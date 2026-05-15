import type { CollectionDef } from '../model/collections'

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
      { colorBucket: 'white' },
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
    unlockCondition: { type: 'catalog_has_any', criteriaList: [{ colorBucket: 'gray' }, { lightness: 30 }] },
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
    unlockCondition: { type: 'catalog_has', criteria: { hue: 60 } },
    slots: [
      { hue: 60 },
      { hue: 60 },
      { hue: 25 },
      { hue: 25 },
      { hue: 5 },
    ],
  },
  {
    id: 'farbenrausch',
    vessel: 'blumenkasten',
    unlockCondition: { type: 'after_collection', collectionId: 'regenbogen' },
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

  // ─── Herbarien ────────────────────────────────────────────────────────────
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
    unlockCondition: { type: 'after_collection', collectionId: 'heller_garten' },
    slots: [
      { shape: 'round' },
      { shape: 'lanzett' },
      { shape: 'tropfen' },
    ],
  },
  {
    id: 'die_fuenf_formen',
    vessel: 'herbarium',
    unlockCondition: { type: 'after_collection', collectionId: 'gemeine_formen' },
    slots: [
      { shape: 'round' },
      { shape: 'lanzett' },
      { shape: 'tropfen' },
      { shape: 'wavy' },
      { shape: 'zickzack' },
    ],
  },
  {
    id: 'runde_bluetenfuelle',
    vessel: 'herbarium',
    unlockCondition: { type: 'after_collection', collectionId: 'heller_garten' },
    slots: [
      { shape: 'round', petalCount: 3 },
      { shape: 'round', petalCount: 5 },
      { shape: 'round', petalCount: 8 },
    ],
  },
  {
    id: 'die_drei_mitten',
    vessel: 'herbarium',
    unlockCondition: { type: 'catalog_has', criteria: { centerType: 'stamen' } },
    slots: [
      { centerType: 'dot' },
      { centerType: 'disc' },
      { centerType: 'stamen' },
    ],
  },
  {
    id: 'farbeffekte',
    vessel: 'herbarium',
    unlockCondition: { type: 'catalog_has', criteria: { effect: 'bicolor' } },
    slots: [
      { effect: 'bicolor' },
      { effect: 'gradient' },
      { effect: 'shimmer' },
      { effect: 'iridescent' },
    ],
  },
  {
    id: 'regenbogen',
    vessel: 'herbarium',
    unlockCondition: { type: 'catalog_has_any', criteriaList: [{ colorBucket: 'blue' }, { colorBucket: 'purple' }] },
    slots: [
      { colorBucket: 'red' },
      { colorBucket: 'pink' },
      { colorBucket: 'yellowgreen' },
      { colorBucket: 'blue' },
      { colorBucket: 'purple' },
    ],
  },
]

export function getCollectionDef(id: string): CollectionDef | undefined {
  return COLLECTION_DEFS.find(d => d.id === id)
}
