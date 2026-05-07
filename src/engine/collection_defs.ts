import type { CollectionDef } from '../model/collections'

export const COLLECTION_DEFS: CollectionDef[] = [
  {
    id: 'erstes_herbarium',
    vessel: 'herbarium',
    unlockCondition: { type: 'catalog_size', threshold: 3 },
    slots: [
      { colorBucket: 'red' },
      { colorBucket: 'pink' },
      { colorBucket: 'yellowgreen' },
    ],
  },
  {
    id: 'mondlichtnacht',
    vessel: 'herbarium',
    unlockCondition: { type: 'catalog_size', threshold: 10 },
    slots: [
      { lightness: 30, colorBucket: 'blue' },
      { lightness: 30, colorBucket: 'purple' },
      { lightness: 30, colorBucket: 'red' },
      { lightness: 30 },
    ],
  },
  {
    id: 'die_fuenf_formen',
    vessel: 'herbarium',
    unlockCondition: { type: 'after_collection', collectionId: 'erstes_herbarium' },
    slots: [
      { shape: 'round' },
      { shape: 'lanzett' },
      { shape: 'tropfen' },
      { shape: 'wavy' },
      { shape: 'zickzack' },
    ],
  },
  {
    id: 'weisser_garten',
    vessel: 'herbarium',
    unlockCondition: { type: 'catalog_size', threshold: 20 },
    slots: [
      { colorBucket: 'white', shape: 'round' },
      { colorBucket: 'white', shape: 'lanzett' },
      { colorBucket: 'white' },
    ],
  },
  {
    id: 'staubblatt_trio',
    vessel: 'herbarium',
    unlockCondition: { type: 'catalog_size', threshold: 25 },
    slots: [
      { centerType: 'stamen', colorBucket: 'red' },
      { centerType: 'stamen', colorBucket: 'blue' },
      { centerType: 'stamen' },
    ],
  },
]

export function getCollectionDef(id: string): CollectionDef | undefined {
  return COLLECTION_DEFS.find(d => d.id === id)
}
