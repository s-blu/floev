import type { CatalogEntry } from '../model/plant'
import type { Achievement } from '../model/achievements'
import {
  expressedColor, expressedShape, expressedCenter,
  expressedNumber, expressedGradient, colorBucket,
  isHomozygous,
} from './genetic/genetic_utils'
import { PALETTE_HUE_RANGES, PALETTE_HUES, PALETTE_L, PETAL_SHAPES } from '../model/genetic_model'
import type { ColorBucket } from '../model/genetic_model'
import type { PetalShape, Rarity } from '../model/plant'
import { t } from '../model/i18n'

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

function hasShapeInBucket(catalog: CatalogEntry[], shape: PetalShape, bucket: ColorBucket): boolean {
  return catalog.some(e =>
    expressedShape(e.plant.petalShape) === shape &&
    colorBucket(expressedColor(e.plant.petalHue, e.plant.petalLightness)) === bucket
  )
}

function hasShapeWithCount(catalog: CatalogEntry[], shape: PetalShape, count: number): boolean {
  return catalog.some(e =>
    expressedShape(e.plant.petalShape) === shape &&
    Math.round(expressedNumber(e.plant.petalCount)) === count
  )
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
  const total = bucketHues.length * (PALETTE_L as readonly number[]).length
  const seen = new Set<string>()
  for (const e of catalog) {
    const color = expressedColor(e.plant.petalHue, e.plant.petalLightness)
    if (colorBucket(color) === bucket) seen.add(`${color.h}-${color.l}`)
  }
  return { current: seen.size, total: Math.max(1, total) }
}

// ─── CHROMATIC buckets only (no white/gray for combo achievements) ────────────
const CHROMATIC_BUCKETS: ColorBucket[] = ['red', 'yellow', 'pink', 'purple', 'blue', 'green']

// ─── Achievement list ─────────────────────────────────────────────────────────

export function buildAchievements(): Achievement[] {
  const list: Achievement[] = []

  // ── 1. Rarity milestones (stacked) ──────────────────────────────────────────
  const rarityStack: { rarity: Rarity; reward: number }[] = [
    { rarity: 1, reward: 10 },
    { rarity: 2, reward: 25 },
    { rarity: 3, reward: 60 },
    { rarity: 4, reward: 150 },
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
  const sizeStack = [5, 15, 30, 60, 100]
  for (let i = 0; i < sizeStack.length; i++) {
    const n = sizeStack[i]
    list.push({
      id: `catalog_${n}`,
      groupKey: 'catalog_size',
      stackIndex: i,
      hidden: false,
      title: t.achCatalogTitle(n),
      desc: t.achCatalogDesc(n),
      reward: [5, 15, 35, 70, 150][i],
      progress: cat => ({ current: Math.min(cat.length, n), total: n }),
    })
  }

  // ── 3. Colour diversity (visible) ────────────────────────────────────────────
  const colorDivStack = [3, 5, 6, 8]
  for (let i = 0; i < colorDivStack.length; i++) {
    const n = colorDivStack[i]
    list.push({
      id: `color_div_${n}`,
      groupKey: 'color_diversity',
      stackIndex: i,
      hidden: false,
      title: t.achColorDivTitle(n),
      desc: t.achColorDivDesc(n),
      reward: [8, 20, 30, 80][i],
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

  // ── 6. Gradient milestones (stacked) ─────────────────────────────────────────
  const gradStack = [1, 5, 15]
  for (let i = 0; i < gradStack.length; i++) {
    const n = gradStack[i]
    list.push({
      id: `gradient_${n}`,
      groupKey: 'gradient',
      stackIndex: i,
      hidden: i !== 0,
      title: t.achGradientTitle(n),
      desc: t.achGradientDesc(n),
      reward: [20, 45, 100][i],
      progress: cat => {
        const count = cat.filter(e => expressedGradient(e.plant.hasGradient)).length
        return { current: Math.min(count, n), total: n }
      },
    })
  }

  // ── 7. Self-pollination — homozygous (visible) ────────────────────────────────
  list.push({
    id: 'first_homo',
    groupKey: 'homozygous',
    stackIndex: 0,
    hidden: false,
    title: t.achHomoTitle,
    desc: t.achHomoDesc,
    reward: 15,
    progress: cat => ({ current: cat.some(e => isHomozygous(e.plant)) ? 1 : 0, total: 1 }),
  })

  // ── 8. All petal counts for a specific shape (hidden, stacked per shape) ──────
  for (const shape of PETAL_SHAPES) {
    const shapeLabel = t.achShapeLabels[shape] ?? shape
    for (let stackI = 0; stackI < 6; stackI++) {
      const count = stackI + 3   // 3..8
      list.push({
        id: `petals_${shape}_${count}`,
        groupKey: `petals_shape_${shape}`,
        stackIndex: stackI,
        hidden: true,
        title: t.achPetalsTitle(shapeLabel, count),
        desc: t.achPetalsDesc(shapeLabel, count),
        reward: 5 + stackI * 3,
        progress: cat => ({ current: hasShapeWithCount(cat, shape, count) ? 1 : 0, total: 1 }),
      })
    }
  }

  // ── 9. All hues in each chromatic bucket (hidden, stacked: tones then shades) ─
  for (const bucket of CHROMATIC_BUCKETS) {
    const colorLabel = t.achBucketLabels[bucket] ?? bucket

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
    const shapeLabel = t.achShapeLabels[shape] ?? shape
    for (const bucket of CHROMATIC_BUCKETS) {
      const colorLabel = t.achBucketLabels[bucket] ?? bucket
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

  // ── 11. Legendary in every shape (hidden, one per shape) ─────────────────────
  for (let i = 0; i < PETAL_SHAPES.length; i++) {
    const shape = PETAL_SHAPES[i]
    const shapeLabel = t.achShapeLabels[shape] ?? shape
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
  const centerTypes = ['dot', 'disc', 'stamen'] as const
  for (let i = 0; i < centerTypes.length; i++) {
    const ct = centerTypes[i]
    const centerLabel = t.achCenterLabels[ct] ?? ct
    list.push({
      id: `center_${ct}`,
      groupKey: 'center_collection',
      stackIndex: i,
      hidden: i > 0,
      title: t.achCenterTitle(centerLabel),
      desc: t.achCenterDesc(centerLabel),
      reward: [5, 15, 35][i],
      progress: cat => ({
        current: cat.some(e => expressedCenter(e.plant.centerType) === ct) ? 1 : 0,
        total: 1,
      }),
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
