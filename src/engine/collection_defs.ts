import type { CollectionDef } from '../model/collections'

export const COLLECTION_DEFS: CollectionDef[] = [
  {
    id: 'weisser_garten',
    vessel: 'herbarium',
    slots: [
      { colorBucket: 'white', shape: 'round' },
      { colorBucket: 'white', shape: 'lanzett' },
      { colorBucket: 'white' },
    ],
  },
  {
    id: 'grundfarben',
    vessel: 'herbarium',
    unlockCondition: { type: 'after_collection', collectionId: 'weisser_garten' },
    slots: [
      { colorBucket: 'red' },
      { colorBucket: 'pink' },
      { colorBucket: 'yellowgreen' },
    ],
  },
  {
    id: 'die_fuenf_formen',
    vessel: 'herbarium',
    unlockCondition: { type: 'after_collection', collectionId: 'grundfarben' },
    slots: [
      { shape: 'round' },
      { shape: 'lanzett' },
      { shape: 'tropfen' },
      { shape: 'wavy' },
      { shape: 'zickzack' },
    ],
  },
  {
    id: 'mondlichtnacht',
    vessel: 'herbarium',
    unlockCondition: { type: 'catalog_has', criteria: { lightness: 30 } },
    slots: [
      { lightness: 30, colorBucket: 'blue' },
      { lightness: 30, colorBucket: 'purple' },
      { lightness: 30, colorBucket: 'red' },
      { lightness: 30 },
    ],
  },
  {
    id: 'staubblatt_trio',
    vessel: 'herbarium',
    unlockCondition: { type: 'catalog_has', criteria: { centerType: 'stamen' } },
    slots: [
      { centerType: 'stamen' },
      { centerType: 'stamen' },
      { centerType: 'stamen' },
    ],
  },
  {
    id: 'sommerwiese',
    vessel: 'herbarium',
    unlockCondition: { type: 'catalog_has', criteria: { hue: 60 } },
    slots: [
      { hue: 60 },
      { hue: 25 },
      { hue: 5 },
    ],
  },
  {
    id: 'effektgarten',
    vessel: 'herbarium',
    unlockCondition: { type: 'catalog_has', criteria: { effect: 'bicolor' } },
    slots: [
      { effect: 'bicolor' },
      { effect: 'gradient' },
      { effect: 'shimmer' },
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
