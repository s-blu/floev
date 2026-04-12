// ─── Floev — German UI strings ───────────────────────────────────────────────

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
  phaseBloom: (name: string) => name,

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
  btnRemoveTitle: 'Pflanze entfernen',

  // Trait labels (pot card)
  traitGradient: '〜',

  // Homozygous / pure-line badge
  homozygousBadge: '◈',
  homozygousTitle: 'Reinerbig — Nachkommen sind berechenbarer',

  // Allele inspect (magnifier)
  alleleInspectTitle: 'Allele anzeigen',
  alleleOverlayTitle: 'Genetik',
  alleleOverlayHue: 'Farbe',
  alleleOverlayLight: 'Helligkeit',
  alleleOverlayShape: 'Form',
  alleleOverlayCenter: 'Mitte',

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
  estPetals: (min: number, max: number) => `Blätter: ${min}–${max}`,
  estGroupColor: 'Farbe',
  estGroupLightness: 'Helligkeit',
  estGroupShape: 'Blütenform',
  estGroupCenter: 'Blütenmitte',
  estGradient: (pct: number) => `✦ Farbverlauf: ~${pct}%`,
  estNoMutNote: 'Ohne seltene Mutationen.',
  estAlleleDominant: 'exprimiert',
  estAlleleRecessive: 'rezessiv',

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

  // Self-pollination
  selfPollinateTitle: 'Selbstbestäuben — verbraucht die Pflanze, erzeugt reinerbigeren Samen',
  selfPollinateConfirmTitle: 'Selbstbestäubung',
  selfPollinateConfirmText: 'Die Blüte bestäubt sich selbst. Der entstandene Samen ist reinerbiger als die Elternpflanze.',
  selfPollinateWarning: 'Die Pflanze wird danach entfernt.',
  selfPollinateConfirm: 'Bestäuben',
  selfPollinateCancel: 'Abbrechen',
  selfPollinateSuccess: (gen: number) => `Selbstbestäubt! Samen der Generation ${gen} gepflanzt.`,

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
  catalogHomozygousBadge: '◈ reinerbig',

  // Messages
  msgSeedPlanted: 'Samen gepflanzt!',
  msgPotCleared: 'Topf geleert.',
  msgNewBloom: (gen: number) => `Eine neue Blüte ist aufgegangen! (Gen. ${gen})`,
}

export type I18n = typeof de
