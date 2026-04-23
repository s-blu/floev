import type { CatalogEntry } from '../model/plant'
import type { Achievement } from '../model/achievements'
import {
  expressedColor, expressedShape, expressedCenter,
  expressedNumber, colorBucket,
  isHomozygous,
  expressedEffect,
} from './genetic/genetic_utils'
import { PALETTE_HUE_RANGES, PALETTE_HUES, PALETTE_L, PETAL_SHAPES, CENTER_TYPES, PETAL_EFFECTS } from '../model/genetic_model'
import type { ColorBucket } from '../model/genetic_model'
import type { Rarity } from '../model/plant'
import { t } from '../model/i18n'
import { coinValueForScore } from './game'
import { calcCoinScore } from './rarity'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hasRarity(catalog: CatalogEntry[], r: Rarity): boolean {
  return catalog.some(e => e.rarity >= r)
}

function countUniqueBuckets(catalog: CatalogEntry[]): number {
  const seen = new Set<string>()
  for (const e of catalog) {
    seen.add(colorBucket(expressedColor(e.plant.petalHue, e.plant.petalLightness)))
  }
  return seen.size
}

function countUniqueShapes(catalog: CatalogEntry[]): number {
  const seen = new Set<string>()
  for (const e of catalog) seen.add(expressedShape(e.plant.petalShape))
  return seen.size
}

function countShapesInBucket(catalog: CatalogEntry[], bucket: ColorBucket): { current: number; total: number } {
  const seen = new Set<string>()
  for (const e of catalog) {
    if (colorBucket(expressedColor(e.plant.petalHue, e.plant.petalLightness)) === bucket)
      seen.add(expressedShape(e.plant.petalShape))
  }
  return { current: seen.size, total: PETAL_SHAPES.length }
}

/** Count how many distinct hue values from a bucket appear in catalog */
function countHuesInBucket(catalog: CatalogEntry[], bucket: ColorBucket): { current: number; total: number } {
  // We count distinct (hue, lightness) combinations as "all shades"
  const seen = new Set<number>()
  for (const e of catalog) {
    const color = expressedColor(e.plant.petalHue, e.plant.petalLightness)
    if (colorBucket(color) === bucket) seen.add(color.h)
  }
  // Total: number of distinct palette hues in this bucket
  const ranges: Record<string, (h: number) => boolean> = PALETTE_HUE_RANGES
  const bucketHues = (PALETTE_HUES as readonly number[]).filter(h => {
    if (bucket === 'white' || bucket === 'gray') return false
    return ranges[bucket]?.(h) ?? false
  })
  return { current: seen.size, total: Math.max(1, bucketHues.length) }
}

/** Count how many (hue × lightness) combos exist in a bucket */
function countShadesInBucket(catalog: CatalogEntry[], bucket: ColorBucket): { current: number; total: number } {
  const ranges: Record<string, (h: number) => boolean> = PALETTE_HUE_RANGES
  const bucketHues = (PALETTE_HUES as readonly number[]).filter(h => {
    if (bucket === 'white' || bucket === 'gray') return false
    return ranges[bucket]?.(h) ?? false
  })
  
  let total = bucketHues.length * (PALETTE_L as readonly number[]).length
  if (bucket === 'gray') total = 4;
  if (bucket === 'white') total = 1;
  const seen = new Set<string>()
  for (const e of catalog) {
    const color = expressedColor(e.plant.petalHue, e.plant.petalLightness)
    if (colorBucket(color) === bucket) seen.add(`${color.h}-${color.l}`)
  }
console.log('countShadesInBucket', bucket, { current: seen.size, total: Math.max(1, total) })
  return { current: seen.size, total: Math.max(1, total) }
}

// ─── CHROMATIC buckets only (no white/gray for combo achievements) ────────────
const CHROMATIC_BUCKETS: ColorBucket[] = ['red', 'yellowgreen', 'pink', 'purple', 'blue', 'gray']
const CHROMATIC_RARE_BUCKETS: ColorBucket[] = ['purple', 'blue', 'gray']

// ─── Achievement list ─────────────────────────────────────────────────────────

export function buildAchievements(): Achievement[] {
  const list: Achievement[] = []

  // ── 1. Rarity milestones (stacked) ──────────────────────────────────────────
  const rarityStack: { rarity: Rarity; reward: number }[] = [
    { rarity: 2, reward: 15 },
    { rarity: 3, reward: 40 },
    { rarity: 4, reward: 100 },
  ]
  for (const { rarity, reward } of rarityStack) {
    const label = t.achRarityLabel(rarity)
    list.push({
      id: `rarity_${rarity}`,
      groupKey: 'rarity_milestone',
      stackIndex: rarity - 1,
      hidden: false,
      title: t.achRarityTitle(label),
      desc: t.achRarityDesc(label),
      reward,
      progress: cat => ({ current: hasRarity(cat, rarity) ? 1 : 0, total: 1 }),
    })
  }

  // ── 2. Catalog size milestones (stacked) ─────────────────────────────────────
  const sizeStack = [25, 50, 75, 100]
  for (let i = 0; i < sizeStack.length; i++) {
    const n = sizeStack[i]
    list.push({
      id: `catalog_${n}`,
      groupKey: 'catalog_size',
      stackIndex: i,
      hidden: false,
      title: t.achCatalogTitle(n),
      desc: t.achCatalogDesc(n),
      reward: [15, 25, 50, 150][i],
      progress: cat => ({ current: Math.min(cat.length, n), total: n }),
    })
  }

  // ── 3. Colour diversity (visible) ────────────────────────────────────────────
  const colorDivStack = [6, 7, 8]
  for (let i = 0; i < colorDivStack.length; i++) {
    const n = colorDivStack[i]
    list.push({
      id: `color_div_${n}`,
      groupKey: 'color_diversity',
      stackIndex: i,
      hidden: false,
      title: t.achColorDivTitle(n),
      desc: t.achColorDivDesc(n),
      reward: [20, 30, 80][i],
      progress: cat => ({ current: Math.min(countUniqueBuckets(cat), n), total: n }),
    })
  }

  // ── 4. Shape diversity (visible) ─────────────────────────────────────────────
  const shapeDivStack = [3, 5]
  for (let i = 0; i < shapeDivStack.length; i++) {
    const n = shapeDivStack[i]
    list.push({
      id: `shape_div_${n}`,
      groupKey: 'shape_diversity',
      stackIndex: i,
      hidden: false,
      title: t.achShapeDivTitle(n),
      desc: t.achShapeDivDesc(n),
      reward: [15, 50][i],
      progress: cat => ({ current: Math.min(countUniqueShapes(cat), n), total: n }),
    })
  }

  // ── 5. Generation milestones (stacked) ──────────────────────────────────────
  const genStack = [5, 10, 20]
  for (let i = 0; i < genStack.length; i++) {
    const g = genStack[i]
    list.push({
      id: `gen_${g}`,
      groupKey: 'generation',
      stackIndex: i,
      hidden: false,
      title: t.achGenTitle(g),
      desc: t.achGenDesc(g),
      reward: [20, 50, 120][i],
      progress: cat => {
        const maxGen = cat.reduce((m, e) => Math.max(m, e.plant.generation), 0)
        return { current: Math.min(maxGen, g), total: g }
      },
    })
  }

  // ── 6. Effect milestones (alle Effekte vereinheitlicht: 1 / 3 / 5, alle hidden) ─
  const allEffects: Array<{
    effect: 'gradient' | 'bicolor' | 'shimmer' | 'iridescent'
    rewards: [number, number, number]
  }> = [
    { effect: 'gradient',   rewards: [20, 35, 55]    },
    { effect: 'bicolor',    rewards: [15, 25, 40]    },
    { effect: 'shimmer',    rewards: [30, 50, 80]    },
    { effect: 'iridescent', rewards: [200, 300, 400] },
  ]
  const effectMilestones = [1, 3, 5]
  for (const { effect, rewards } of allEffects) {
    const label      = t.effectLabels[effect]      ?? effect
    const firstTitle = t.effectFirstTitles[effect] ?? effect
    for (let i = 0; i < effectMilestones.length; i++) {
      const n = effectMilestones[i]
      list.push({
        id: `effect_${effect}_${n}`,
        groupKey: `effect_${effect}`,
        stackIndex: i,
        hidden: true,
        title: t.achEffectTitle(label, firstTitle, n),
        desc:  t.achEffectDesc(label, n),
        reward: rewards[i],
        progress: cat => {
          const count = cat.filter(e => expressedEffect(e.plant.petalEffect) === effect).length
          return { current: Math.min(count, n), total: n }
        },
      })
    }
  }


  // ── 7. Self-pollination — homozygous (visible) ────────────────────────────────
  list.push({
    id: 'first_homo',
    groupKey: 'all_shapes_homo',
    stackIndex: 0,
    hidden: false,
    title: t.achHomoTitle,
    desc: t.achHomoDesc,
    reward: 15,
    progress: cat => ({ current: cat.some(e => isHomozygous(e.plant)) ? 1 : 0, total: 1 }),
  })

  // ── 9. All hues in each chromatic bucket (hidden, stacked: tones then shades) ─
  // For the first achievement, only take into account rare colors
    for (const bucket of CHROMATIC_RARE_BUCKETS) {
      const colorLabel = t.colorBucketLabels[bucket] ?? bucket
      list.push({
        id: `bucket_first_${bucket}`,
        groupKey: `bucket_collection_${bucket}`,
        stackIndex: 0,
        hidden: true,
        title: t.achBucketFirstTitle(colorLabel),
        desc: t.achBucketFirstDesc(colorLabel),
        reward: 5,
        progress: cat => ({ current: countHuesInBucket(cat, bucket).current > 0 ? 1 : 0, total: 1 }),
      })
  }

  for (const bucket of CHROMATIC_BUCKETS) {
    const colorLabel = t.colorBucketLabels[bucket] ?? bucket
    if (bucket === 'gray') continue;

    list.push({
      id: `bucket_hues_${bucket}`,
      groupKey: `bucket_collection_${bucket}`,
      stackIndex: 1,
      hidden: true,
      title: t.achBucketHuesTitle(colorLabel),
      desc: t.achBucketHuesDesc(colorLabel),
      reward: 30,
      progress: cat => countHuesInBucket(cat, bucket),
    })
    list.push({
      id: `bucket_shades_${bucket}`,
      groupKey: `bucket_collection_${bucket}`,
      stackIndex: 2,
      hidden: true,
      title: t.achBucketShadesTitle(colorLabel),
      desc: t.achBucketShadesDesc(colorLabel),
      reward: 80,
      progress: cat => countShadesInBucket(cat, bucket),
    })
  }

  // ── 10. Shape × Color combos — 8 petals (hidden) ────────────────────────────
  for (const shape of PETAL_SHAPES) {
    const shapeLabel = t.shapeLabels[shape] ?? shape
    for (const bucket of CHROMATIC_BUCKETS) {
      const colorLabel = t.colorBucketLabels[bucket] ?? bucket
      list.push({
        id: `combo_8_${shape}_${bucket}`,
        groupKey: `combo_8petals_${shape}`,
        stackIndex: CHROMATIC_BUCKETS.indexOf(bucket),
        hidden: true,
        title: t.achCombo8Title(shapeLabel, colorLabel),
        desc: t.achCombo8Desc(shapeLabel, colorLabel),
        reward: 25,
        progress: cat => ({
          current: cat.some(e =>
            expressedShape(e.plant.petalShape) === shape &&
            colorBucket(expressedColor(e.plant.petalHue, e.plant.petalLightness)) === bucket &&
            Math.round(expressedNumber(e.plant.petalCount)) === 8
          ) ? 1 : 0,
          total: 1,
        }),
      })
    }
  }

  // ── 11. Legendary in all 3 rarer shapes (hidden, one per shape) ─────────────────────
  for (let i = 2; i < PETAL_SHAPES.length; i++) {
    const shape = PETAL_SHAPES[i]
    const shapeLabel = t.shapeLabels[shape] ?? shape
    list.push({
      id: `legendary_shape_${shape}`,
      groupKey: 'legendary_shapes',
      stackIndex: i,
      hidden: true,
      title: t.achLegendaryShapeTitle(shapeLabel),
      desc: t.achLegendaryShapeDesc(shapeLabel),
      reward: 100,
      progress: cat => ({
        current: cat.some(e =>
          e.rarity === 4 &&
          expressedShape(e.plant.petalShape) === shape
        ) ? 1 : 0,
        total: 1,
      }),
    })
  }

  // ── 12. Center type collection (hidden, stacked) ──────────────────────────────
  const centerTypes = ['disc', 'stamen'] as const
  for (let i = 0; i < centerTypes.length; i++) {
    const ct = centerTypes[i]
    const centerLabel = t.centerTypeLabels[ct] ?? ct
    list.push({
      id: `center_${ct}`,
      groupKey: 'center_collection',
      stackIndex: i,
      hidden: i > 0,
      title: t.achCenterTitle(centerLabel),
      desc: t.achCenterDesc(centerLabel),
      reward: [15, 35][i],
      progress: cat => ({
        current: cat.some(e => expressedCenter(e.plant.centerType) === ct) ? 1 : 0,
        total: 1,
      }),
    })
  }

  // ── 14. Alle Formen reinerbig (gestapelt mit first_homo: 3 / alle 5) ─────────
  for (let i = 0; i < 2; i++) {
    const n = i === 0 ? 3 : 5
    list.push({
      id: `all_shapes_homo_${n}`,
      groupKey: 'all_shapes_homo',
      stackIndex: i + 1,
      hidden: true,
      title: t.achAllShapesHomoTitle(n),
      desc: t.achAllShapesHomoDesc(n),
      reward: i === 0 ? 40 : 120,
      progress: cat => {
        const seen = new Set<string>()
        for (const e of cat) {
          if (isHomozygous(e.plant)) seen.add(expressedShape(e.plant.petalShape))
        }
        return { current: Math.min(seen.size, n), total: n }
      },
    })
  }

  // ── 15. Volle Helligkeit — alle Farbton-Helligkeitskombinationen pro Bucket ───
  for (const bucket of CHROMATIC_BUCKETS) {
    const colorLabel = t.colorBucketLabels[bucket] ?? bucket
    list.push({
      id: `full_lightness_${bucket}`,
      groupKey: `full_lightness_${bucket}`,
      stackIndex: 0,
      hidden: true,
      title: t.achFullLightnessTitle(colorLabel),
      desc: t.achFullLightnessDesc(colorLabel),
      reward: 35,
      progress: cat => countShadesInBucket(cat, bucket),
    })
  }

  // ── 16. Monochromes Set ───────────────────────────────────────────────────────
  // Ziel: alle 4 achromatischen Typen im Katalog (weiß, hellgrau, grau, dunkelgrau)
  // expressedColor gibt für achromatic: l=100 (weiß), l=70 (hellgrau), l=40 (grau), l=0 (dunkelgrau)
  list.push({
    id: 'monochrome_set',
    groupKey: 'monochrome_set',
    stackIndex: 0,
    hidden: true,
    title: t.achMonochromeTitle,
    desc: t.achMonochromeDesc,
    reward: 50,
    progress: cat => {
      const TARGET_LIGHTNESSES = new Set([100, 70, 40, 10])
      const found = new Set<number>()
      for (const e of cat) {
        const color = expressedColor(e.plant.petalHue, e.plant.petalLightness)
        if (color.s === 0 && TARGET_LIGHTNESSES.has(color.l)) found.add(color.l)
      }
      return { current: found.size, total: 4 }
    },
  })

  // ── 17. Alle Blütenblatt-Anzahlen (gestapelt: erst formlos, dann pro Form) ─────
  list.push({
    id: 'all_petal_counts',
    groupKey: 'all_petal_counts',
    stackIndex: 0,
    hidden: false,
    title: t.achAllCountsTitle,
    desc: t.achAllCountsDesc,
    reward: 30,
    progress: cat => {
      const counts = new Set<number>()
      for (const e of cat) counts.add(Math.round(expressedNumber(e.plant.petalCount)))
      const TARGET = new Set([3, 4, 5, 6, 7, 8])
      return { current: [...TARGET].filter(n => counts.has(n)).length, total: 6 }
    },
  })
  for (let i = 0; i < PETAL_SHAPES.length; i++) {
    const shape = PETAL_SHAPES[i]
    const shapeLabel = t.shapeLabels[shape] ?? shape
    list.push({
      id: `all_counts_${shape}`,
      groupKey: 'all_petal_counts',
      stackIndex: i + 1,
      hidden: true,
      title: t.achAllCountsShapeTitle(shapeLabel),
      desc: t.achAllCountsShapeDesc(shapeLabel),
      reward: [15, 20, 30, 40, 60][i],
      progress: cat => {
        const TARGET = new Set([3, 4, 5, 6, 7, 8])
        const found = [...TARGET].filter(n =>
          cat.some(e =>
            expressedShape(e.plant.petalShape) === shape &&
            Math.round(expressedNumber(e.plant.petalCount)) === n
          )
        ).length
        return { current: found, total: 6 }
      },
    })
  }

  // ── 19. Alle Blütenformen in einem Farbbucket (hidden) ───────────────────────
  for (const bucket of CHROMATIC_BUCKETS) {
    const colorLabel = t.colorBucketLabels[bucket] ?? bucket
    list.push({
      id: `shapes_in_bucket_${bucket}`,
      groupKey: `shapes_in_bucket_${bucket}`,
      stackIndex: 0,
      hidden: true,
      title: t.achShapesInBucketTitle(colorLabel),
      desc: t.achShapesInBucketDesc(colorLabel),
      reward: 40,
      progress: cat => countShapesInBucket(cat, bucket),
    })
  }

  // ── 18. Reiche Ernte (gestapelt: 20 / 50 / 100 Münzen) ───────────────────────
  // Proxy: schaut ob irgendeine Katalog-Blüte den entsprechenden coinValue erreicht
  const harvestStack = [30, 50, 100]
  for (let i = 0; i < harvestStack.length; i++) {
    const coins = harvestStack[i]
    list.push({
      id: `rich_harvest_${coins}`,
      groupKey: 'rich_harvest',
      stackIndex: i,
      hidden: i > 0,
      title: t.achRichHarvestTitle(coins),
      desc: t.achRichHarvestDesc(coins),
      reward: [15, 40, 100][i],
      progress: cat => ({
        current: cat.some(e => coinValueForScore(calcCoinScore(e.plant)) >= coins) ? 1 : 0,
        total: 1,
      }),
    })
  }

  // ── 20. Alle Formen mit jedem Zentrumstyp (hidden) ──────────────────────────
  for (let i = 0; i < CENTER_TYPES.length; i++) {
    const ct = CENTER_TYPES[i]
    const centerLabel = t.centerTypeLabels[ct] ?? ct
    list.push({
      id: `all_shapes_center_${ct}`,
      groupKey: 'all_shapes_center',
      stackIndex: i,
      hidden: true,
      title: t.achAllShapesCenterTitle(centerLabel),
      desc: t.achAllShapesCenterDesc(centerLabel),
      reward: [40, 70, 120][i],
      progress: cat => {
        const seen = new Set<string>()
        for (const e of cat)
          if (expressedCenter(e.plant.centerType) === ct) seen.add(expressedShape(e.plant.petalShape))
        return { current: Math.min(seen.size, PETAL_SHAPES.length), total: PETAL_SHAPES.length }
      },
    })
  }

  // ── 21. Alle Formen mit jedem Effekt (hidden) ────────────────────────────────
  const displayEffects = PETAL_EFFECTS.filter(e => e !== 'none')
  for (let i = 0; i < displayEffects.length; i++) {
    const effect = displayEffects[i]
    const effectLabel = t.effectLabels[effect] ?? effect
    list.push({
      id: `all_shapes_effect_${effect}`,
      groupKey: 'all_shapes_effect',
      stackIndex: i,
      hidden: true,
      title: t.achAllShapesEffectTitle(effectLabel),
      desc: t.achAllShapesEffectDesc(effectLabel),
      reward: [50, 80, 120, 250][i],
      progress: cat => {
        const seen = new Set<string>()
        for (const e of cat)
          if (expressedEffect(e.plant.petalEffect) === effect) seen.add(expressedShape(e.plant.petalShape))
        return { current: Math.min(seen.size, PETAL_SHAPES.length), total: PETAL_SHAPES.length }
      },
    })
  }

  return list
}

// Singleton — built once
let _cache: Achievement[] | null = null
export function getAchievements(): Achievement[] {
  if (!_cache) _cache = buildAchievements()
  return _cache
}
