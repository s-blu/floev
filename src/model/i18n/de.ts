// ─── Floev — German UI strings ───────────────────────────────────────────────
// To add a new language: copy this file, change the values, import it in i18n.ts.

export const de = {
  // App shell
  appTitle: 'Floev',
  welcomeMsg: 'Willkommen bei Floev! Pflanze einen Samen in einen leeren Topf.',

  // Section headings
  sectionGarden: 'Dein Garten',
  sectionBreeding: 'Züchtung',
  sectionDiscoveries: 'Entdeckungen',

  // Phase labels
  phaseEmpty: 'Leer',
  phaseSeed: 'Samen',
  phaseSprout: 'Keimling',
  phaseBud: 'Jungpflanze',
  phaseBloom: (name: string) => name,   // shows the plant's name at full bloom

  // Rarity labels
  rarityCommon: 'gewöhnlich',
  rarityUncommon: 'ungewöhnlich',
  rarityRare: 'selten',
  rarityEpic: 'episch',
  rarityLegendary: 'legendär',

  // Pot buttons
  btnPlant: 'Pflanzen',
  btnBreedSelect: 'Züchten',
  btnBreedDeselect: 'Abwählen',
  btnRemove: '✕',

  // Trait labels (pot card)
  traitGradient: '〜',

  // Breeding panel
  breedParent1: 'Elter 1',
  breedParent2: 'Elter 2',
  breedPrompt: 'Wähle zwei blühende Pflanzen aus.',
  breedBtn: 'Züchten',
  breedHint: 'Ergebnis landet in einem leeren Topf',
  breedHintNoSpace: 'Kein freier Topf — entferne zuerst eine Pflanze.',
  breedSuccess: (gen: number) => `Samen gezüchtet! Generation ${gen}.`,
  breedNoSpace: 'Kein leerer Topf! Entferne zuerst eine Pflanze.',
  breedSlotRemoveTitle: 'Entfernen',

  // Breed estimate
  estColorRange: 'Farbbereich (ca.)',
  estPetals: (min: number, max: number) => `Blätter: ${min}–${max}`,
  estGroupShape: 'Blütenform',
  estGroupCenter: 'Blütenmitte',
  estGradient: (pct: number) => `✦ Farbverlauf: ~${pct}%`,
  estNoMutNote: 'Ohne seltene Mutationen.',

  // Shape labels
  shapeRound: 'Rund',
  shapeLanzett: 'Lanzett',
  shapeWavy: 'Wellig',
  shapeDrop: 'Tropfen',
  shapeZickzack: 'Zickzack',

  // Center labels
  centerDot: 'Punkt',
  centerDisc: 'Scheibe',
  centerStamen: 'Staubbl.',

  // Catalog / encyclopedia
  catalogEmpty: 'Noch keine Entdeckungen.',
  catalogMetaPetals: 'Blätter',
  catalogMetaCenter: 'Mitte',
  catalogMetaColor: 'Farbe',
  catalogMetaGen: 'Gen.',
  catalogAncestry: 'Stammbaum',
  catalogParentUnknown: 'Unbekannt',
  catalogEntryNum: (n: number) => `Nr. ${n}`,
  catalogEntryName: (n: number) => `Blüte ${n}`,
  catalogParentName: (n: number | string) => `Blüte ${n}`,
  catalogParentUnknownTitle: (id: string) => `Elter unbekannt (${id})`,
  catalogParentGenTitle: (gen: number) => `Gen. ${gen}`,

  // Messages
  msgSeedPlanted: 'Samen gepflanzt!',
  msgPotCleared: 'Topf geleert.',
  msgNewBloom: (gen: number) => `Eine neue Blüte ist aufgegangen! (Gen. ${gen})`,
}

export type I18n = typeof de
