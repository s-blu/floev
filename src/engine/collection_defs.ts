import type { CollectionDef } from '../model/collections'

// ─── Free collection constants ────────────────────────────────────────────────

export const FREE_HERBARIUM_MIN_SIZE = 2
export const FREE_HERBARIUM_MAX_SIZE = 5
export const FREE_HERBARIUM_SIZES    = [2, 3, 4, 5] as const

export const FREE_BK_MIN_SIZE = 5
export const FREE_BK_MAX_SIZE = 8
export const FREE_BK_SIZES    = [5, 6, 7, 8] as const

export function buildFreeCollectionDef(vessel: 'herbarium' | 'blumenkasten', index: number): CollectionDef {
  const maxSlots = vessel === 'herbarium' ? FREE_HERBARIUM_MAX_SIZE : FREE_BK_MAX_SIZE
  return {
    id: `free_${vessel}_${index}`,
    vessel,
    slots: Array.from({ length: maxSlots }, () => ({})),
    freeForm: true,
  }
}

export const COLLECTION_DEFS: CollectionDef[] = [
  // ─── Blumenkästen ─────────────────────────────────────────────────────────
  {
    id: 'heller_garten',
    vessel: 'blumenkasten',
    slots: [
      { colorBucket: 'white' },
      { lightness: 90 },
      { colorBucket: 'white' },
      { lightness: 90 },
      { lightness: 90 },
    ],
  },
  {
    id: 'fruehlingskiste',
    vessel: 'blumenkasten',
    unlockCondition: { type: 'after_collection', collectionId: 'heller_garten' },
    slots: [
      { colorBucket: 'pink' },
      { colorBucket: 'white' },
      { colorBucket: 'yellowgreen' },
      { colorBucket: 'pink' },
      { colorBucket: 'red' },
    ],
  },
  {
    id: 'mondlichtnacht',
    vessel: 'blumenkasten',
    unlockCondition: { type: 'after_collection', collectionId: 'feuer_und_glut' },
    slots: [
      { lightness: 30, colorBucket: 'blue' },
      { colorBucket: 'gray' },
      { lightness: 30, colorBucket: 'purple' },
      { lightness: 30 },
      { colorBucket: 'gray' },
      { lightness: 30, colorBucket: 'red' },
    ],
  },
  {
    id: 'sommerwiese',
    vessel: 'blumenkasten',
    unlockCondition: { type: 'after_collection', collectionId: 'fruehlingskiste' },
    slots: [
      { hue: 60 },
      { hue: 60 },
      { hue: 25 },
      { hue: 25 },
      { hue: 5 },
    ],
  },
  {
    id: 'herbstkiste',
    vessel: 'blumenkasten',
    unlockCondition: { type: 'after_collection', collectionId: 'sommerwiese' },
    slots: [
      { hue: 5,  lightness: 30 },
      { hue: 25, lightness: 30 },
      { hue: 60, lightness: 30 },
      { hue: 25, lightness: 60 },
      { hue: 5,  lightness: 60 },
    ],
  },
  {
    id: 'winterfenster',
    vessel: 'blumenkasten',
    unlockCondition: { type: 'after_collection', collectionId: 'herbstkiste' },
    slots: [
      { colorBucket: 'white' },
      { colorBucket: 'blue', lightness: 90 },
      { colorBucket: 'white' },
      { colorBucket: 'gray', lightness: 90 },
      { colorBucket: 'blue', lightness: 90 },
    ],
  },
  {
    id: 'blaue_stunde',
    vessel: 'blumenkasten',
    unlockCondition: { type: 'after_collection', collectionId: 'pastell_kasten' },
    slots: [
      { colorBucket: 'blue',   lightness: 60 },
      { colorBucket: 'purple', lightness: 60 },
      { colorBucket: 'blue',   lightness: 30 },
      { colorBucket: 'blue',   lightness: 60 },
      { colorBucket: 'purple', lightness: 30 },
      { colorBucket: 'blue',   lightness: 30 },
    ],
  },
  {
    id: 'pastell_kasten',
    vessel: 'blumenkasten',
    unlockCondition: { type: 'after_collection', collectionId: 'heller_garten' },
    slots: [
      { colorBucket: 'pink',        lightness: 90 },
      { colorBucket: 'yellowgreen', lightness: 90 },
      { colorBucket: 'white' },
      { colorBucket: 'blue',        lightness: 90 },
      { colorBucket: 'red',         lightness: 90 },
      { colorBucket: 'purple',      lightness: 90 },
    ],
  },
  {
    id: 'feuer_und_glut',
    vessel: 'blumenkasten',
    unlockCondition: { type: 'after_collection', collectionId: 'blaue_stunde' },
    slots: [
      { colorBucket: 'red',  lightness: 30 },
      { hue: 25,             lightness: 30 },
      { hue: 5,              lightness: 30 },
      { colorBucket: 'pink', lightness: 30 },
      { hue: 350,            lightness: 30 },
    ],
  },
  {
    id: 'farbenrausch',
    vessel: 'blumenkasten',
    unlockCondition: { type: 'after_collection', collectionId: 'mondlichtnacht' },
    slots: [
      { colorBucket: 'white' },
      { colorBucket: 'yellowgreen' },
      { colorBucket: 'red' },
      { colorBucket: 'pink' },
      { colorBucket: 'purple' },
      { colorBucket: 'blue' },
      { colorBucket: 'gray' },
    ],
  },

  // ─── Herbarien: Einstieg ──────────────────────────────────────────────────
  {
    id: 'helligkeitsstufen',
    vessel: 'herbarium',
    unlockCondition: { type: 'after_collection', collectionId: 'heller_garten' },
    slots: [
      { lightness: 90 },
      { lightness: 60 },
      { lightness: 30 },
    ],
  },
  {
    id: 'gemeine_formen',
    vessel: 'herbarium',
    unlockCondition: { type: 'after_collection', collectionId: 'helligkeitsstufen' },
    slots: [
      { shape: 'round' },
      { shape: 'lanzett' },
      { shape: 'tropfen' },
    ],
  },
  {
    id: 'die_fuenf_formen',
    vessel: 'herbarium',
    unlockCondition: { type: 'after_collection', collectionId: 'die_drei_mitten' },
    slots: [
      { shape: 'round' },
      { shape: 'lanzett' },
      { shape: 'tropfen' },
      { shape: 'wavy' },
      { shape: 'zickzack' },
    ],
  },

  // ─── Herbarien: Blütenfülle-Reihe (je Form × Petalzahl) ──────────────────
  {
    id: 'runde_bluetenfuelle',
    vessel: 'herbarium',
    unlockCondition: { type: 'after_collection', collectionId: 'gemeine_formen' },
    slots: [
      { shape: 'round', petalCount: 3 },
      { shape: 'round', petalCount: 5 },
      { shape: 'round', petalCount: 8 },
    ],
  },
  {
    id: 'lanzett_bluetenfuelle',
    vessel: 'herbarium',
    unlockCondition: { type: 'after_collection', collectionId: 'runde_bluetenfuelle' },
    slots: [
      { shape: 'lanzett', petalCount: 3 },
      { shape: 'lanzett', petalCount: 5 },
      { shape: 'lanzett', petalCount: 8 },
    ],
  },
  {
    id: 'tropfen_bluetenfuelle',
    vessel: 'herbarium',
    unlockCondition: { type: 'after_collection', collectionId: 'lanzett_bluetenfuelle' },
    slots: [
      { shape: 'tropfen', petalCount: 3 },
      { shape: 'tropfen', petalCount: 5 },
      { shape: 'tropfen', petalCount: 8 },
    ],
  },
  {
    id: 'wavy_bluetenfuelle',
    vessel: 'herbarium',
    unlockCondition: { type: 'after_collection', collectionId: 'tropfen_bluetenfuelle' },
    slots: [
      { shape: 'wavy', petalCount: 3 },
      { shape: 'wavy', petalCount: 5 },
      { shape: 'wavy', petalCount: 8 },
    ],
  },
  {
    id: 'zickzack_bluetenfuelle',
    vessel: 'herbarium',
    unlockCondition: { type: 'after_collection', collectionId: 'wavy_bluetenfuelle' },
    slots: [
      { shape: 'zickzack', petalCount: 3 },
      { shape: 'zickzack', petalCount: 5 },
      { shape: 'zickzack', petalCount: 8 },
    ],
  },

  // ─── Herbarien: Mitten & Effekte ─────────────────────────────────────────
  {
    id: 'die_drei_mitten',
    vessel: 'herbarium',
    unlockCondition: { type: 'after_collection', collectionId: 'gemeine_formen' },
    slots: [
      { centerType: 'dot' },
      { centerType: 'disc' },
      { centerType: 'stamen' },
    ],
  },
  {
    id: 'farbeffekte',
    vessel: 'herbarium',
    unlockCondition: { type: 'after_collection', collectionId: 'die_fuenf_formen' },
    slots: [
      { effect: 'bicolor' },
      { effect: 'gradient' },
      { effect: 'shimmer' },
      { effect: 'iridescent' },
    ],
  },

  // ─── Herbarien: Farbspektrum ─────────────────────────────────────────────
  {
    id: 'regenbogen',
    vessel: 'herbarium',
    unlockCondition: { type: 'after_collection', collectionId: 'katalog_der_kostbarkeiten' },
    slots: [
      { colorBucket: 'red' },
      { colorBucket: 'pink' },
      { colorBucket: 'yellowgreen' },
      { colorBucket: 'blue' },
      { colorBucket: 'purple' },
    ],
  },

  // ─── Herbarien: Hue-Reihen (L60, nach Häufigkeit gestaffelt) ─────────────
  {
    id: 'gruengelbe_reihe',
    vessel: 'herbarium',
    unlockCondition: { type: 'catalog_has', criteria: { colorBucket: 'yellowgreen', lightness: 60 } },
    slots: [
      { hue: 60,  lightness: 60 },
      { hue: 160, lightness: 60 },
    ],
  },
  {
    id: 'rote_reihe',
    vessel: 'herbarium',
    unlockCondition: { type: 'after_collection', collectionId: 'gruengelbe_reihe' },
    slots: [
      { hue: 5,   lightness: 60 },
      { hue: 25,  lightness: 60 },
      { hue: 350, lightness: 60 },
    ],
  },
  {
    id: 'rosa_reihe',
    vessel: 'herbarium',
    unlockCondition: { type: 'after_collection', collectionId: 'rote_reihe' },
    slots: [
      { hue: 290, lightness: 60 },
      { hue: 310, lightness: 60 },
      { hue: 330, lightness: 60 },
    ],
  },
  {
    id: 'violette_reihe',
    vessel: 'herbarium',
    unlockCondition: { type: 'after_collection', collectionId: 'rosa_reihe' },
    slots: [
      { hue: 255, lightness: 60 },
      { hue: 270, lightness: 60 },
    ],
  },
  {
    id: 'blaue_reihe',
    vessel: 'herbarium',
    unlockCondition: { type: 'after_collection', collectionId: 'violette_reihe' },
    slots: [
      { hue: 180, lightness: 60 },
      { hue: 200, lightness: 60 },
      { hue: 230, lightness: 60 },
    ],
  },
  {
    id: 'achromatisches_herbarium',
    vessel: 'herbarium',
    unlockCondition: { type: 'after_collection', collectionId: 'blaue_reihe' },
    slots: [
      { colorBucket: 'white' },
      { colorBucket: 'gray', lightness: 90 },
      { colorBucket: 'gray', lightness: 60 },
      { colorBucket: 'gray', lightness: 30 },
    ],
  },

  // ─── Herbarien: Seltenheit ────────────────────────────────────────────────
  {
    id: 'katalog_der_kostbarkeiten',
    vessel: 'herbarium',
    unlockCondition: { type: 'catalog_has', criteria: { minRarity: 2 } },
    slots: [
      { minRarity: 1 },
      { minRarity: 2 },
      { minRarity: 3 },
    ],
  },
]

export function getCollectionDef(id: string): CollectionDef | undefined {
  const m = id.match(/^free_(herbarium|blumenkasten)_(\d+)$/)
  if (m) return buildFreeCollectionDef(m[1] as 'herbarium' | 'blumenkasten', Number(m[2]))
  return COLLECTION_DEFS.find(d => d.id === id)
}
