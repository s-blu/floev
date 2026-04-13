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

  // Sell
  btnSell: 'Verkaufen',
  btnSellTitle: 'Pflanze verkaufen — erhält Münzen',
  msgSold: (coins: number) => `Blüte verkauft! +${coins} 🪙`,

  // Shop (placeholder)
  shopTab: 'Shop',
  shopComingSoon: 'Bald verfügbar',

  // Messages
  msgSeedPlanted: 'Samen gepflanzt!',
  msgPotCleared: 'Topf geleert.',
  msgNewBloom: (gen: number) => `Eine neue Blüte ist aufgegangen! (Gen. ${gen})`,

  // ─── Help modal ─────────────────────────────────────────────────────────────

  helpClose: 'Schließen',

  // Header
  helpTitle: 'Willkommen bei Floev',
  helpSubtitle: 'Ein botanisches Züchtungsspiel',

  // Intro
  helpIntro1: 'Floev ist ein entspanntes Offline-Spiel — du musst nicht ständig dabei sein. Pflanze einen Samen, schau später wieder rein und staune, was geblüht ist. Die Pflanzenwelt macht in deiner Abwesenheit weiter: Wachstumsphasen laufen im Hintergrund ab, und der Fortschritt wird beim nächsten Öffnen automatisch nachgeholt.',
  helpIntro2: 'Jede Blüte wird aus genetischen Eigenschaften dynamisch berechnet — keine zwei sind exakt gleich. Farbe, Form, Blütenmitte, Helligkeit und seltene Farbverläufe ergeben zusammen über',
  helpCombos: '7.000+',
  helpCombosLabel: 'einzigartige Blütenkombinationen',

  // Colors
  helpColorsTitle: 'Farbe & Helligkeit',
  helpColorsBody: 'Jede Pflanze trägt zwei Farbgen-Allele und zwei Helligkeits-Allele. Das dominantere Allel bestimmt die sichtbare Farbe. Die Dominanzreihenfolge gilt von links (stärkstes) nach rechts (schwächstes):',
  helpColorsDominance: 'Farbdominanz — links dominiert, rechts ist rezessiv',
  helpColorBucket: (bucket: string): string => {
    const map: Record<string, string> = {
      white: 'Weiß', yellow: 'Gelb', red: 'Rot', pink: 'Rosa',
      purple: 'Lila', blue: 'Blau', green: 'Grün', gray: 'Grau',
    };
    return map[bucket] ?? bucket;
  },
  helpLightnessDominance: 'Helligkeitsdominanz: Dunkel (L30) dominiert Mittel (L60) dominiert Hell (L90)',
  helpLightnessDark: 'dunkel',
  helpLightnessMid: 'mittel',
  helpLightnessLight: 'hell',

  // Shapes
  helpShapesTitle: 'Blütenformen',
  helpShapesBody: 'Die ersten drei Formen kannst du von Anfang an entdecken. Zwei weitere sind seltener und rezessiver — finde sie durch gezieltes Kreuzen heraus.',
  helpShapesDominance: 'Formdominanz: Rund > Lanzett > Tropfen > … (seltenere Formen sind rezessiver und schwerer zu fixieren)',
  helpShapeSecretLabel: 'Geheimnis',

  // Rarity
  helpRarityTitle: 'Seltenheitsstufen',
  helpRarityBody: 'Jede Blüte erhält beim Aufblühen einen Seltenheitsscore — berechnet aus Blütenform, Farbe, Blütenmitte, Farbverlauf, Blattanzahl und Stängelhöhe. Je seltener, desto mehr Münzen beim Verkauf.',
  helpRarityDesc: (rarity: number): string => {
    const descs = [
      'Häufig — runde Formen, einfache Farben',
      'Ungewöhnliche Merkmalskombination',
      'Seltene Formen oder besondere Farben',
      'Sehr seltene Kombination mehrerer Merkmale',
      'Legendär — extrem schwer zu züchten',
    ];
    return descs[rarity] ?? '';
  },

  // Breeding
  helpBreedTitle: 'Züchtung & Vererbung',
  helpBreedBody: 'Wenn zwei Pflanzen blühen, kannst du sie kreuzen. Jedes Kind erbt von jedem Elternteil ein zufälliges Allel pro Eigenschaft — wie echte Mendelsche Vererbung. Die Kreuzungsvorschau zeigt Wahrscheinlichkeiten für Farbe, Form und Mitte.',
  helpBreedStep1: 'Wähle zwei blühende Pflanzen über „Züchten" aus.',
  helpBreedStep2: 'Die Vorschau zeigt Wahrscheinlichkeiten für Farbe, Form und Blütenmitte.',
  helpBreedStep3: 'Klicke „Züchten" — ein neuer Samen landet im nächsten freien Topf.',
  helpBreedStep4: 'Lass den Samen durch alle Phasen wachsen und beobachte das Ergebnis.',
  helpSelfBody: 'Mit ↺ (Selbstbestäubung) kannst du eine Pflanze mit sich selbst kreuzen. Das verbraucht die Mutterpflanze, erzeugt aber reinerbigere Nachkommen — ideal, um eine gewünschte Eigenschaft zu fixieren.',
  helpHomoBody: 'Reinerbige Pflanzen (◈) tragen auf beiden Allelen denselben Wert. Ihre Nachkommen sind deutlich berechenbarer — perfekt für die gezielte Weiterzüchtung seltener Merkmale.',

  // Gradient
  helpGradientTitle: '✦ Farbverlauf',
  helpGradientBody: 'Manche Pflanzen tragen ein verborgenes Farbverlauf-Gen. Es zeigt sich nur, wenn beide Allele aktiv sind — ein rezessives Merkmal, das sich durch gezieltes Kreuzen und Selbstbestäuben aufdecken lässt. Blüten mit Farbverlauf schimmern von hell nach dunkel.',

  // Start button
  helpStartBtn: 'Los geht\'s 🌱',

  // Help button tooltip
  helpBtnTitle: 'Hilfe & Spielregeln',
}

export type I18n = typeof de
