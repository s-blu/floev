// ─── Floev — German UI strings ───────────────────────────────────────────────
import { COIN_ICON } from '../../ui/icons'

const colorBucketLabels = {
    white: 'Weiß', yellowgreen: 'Gelb/Grün', red: 'Rot', pink: 'Pink',
    purple: 'Lila', blue: 'Blau', green: 'Grün', gray: 'Grau',
  } as Record<string, string>;

export const de = {
  // App shell
  appTitle: 'Floev',
  welcomeMsg: 'Willkommen bei Floev! Pflanze einen Samen in einen leeren Topf.',

  // Section headings
  sectionGarden: 'Dein Garten',
  sectionBreeding: 'Züchtung',
  sectionDiscoveries: 'Entdeckungen',
  sectionShowcase: 'Schaukasten',

  // Phase labels
  phaseEmpty: 'Leer',
  phaseSeed: 'Samen',
  phaseSprout: 'Keimling',
  phaseBud: 'Jungpflanze',
  phaseBloom: (name: string) => name,
  phaseTimeLeft: (min: number) => `noch ${min} Min`,
  phaseAlmostDone: 'gleich fertig',

  // Rarity labels
  rarity: {
    common: 'gewöhnlich',
    0: 'gewöhnlich',
    uncommon: 'ungewöhnlich',
    1: 'ungewöhnlich',
    rare: 'selten',
    2: 'selten',
    epic: 'episch',
    3: 'episch',
    legendary: 'legendär',
    4: 'legendär',
  },

  // Pot buttons
  potDesignBtnTitle: 'Topf-Design ändern',
  btnPlant: 'Pflanzen',
  btnBreedSelect: 'Züchten',
  btnBreedDeselect: 'Abwählen',
  btnRemove: '✕',
  btnRemoveTitle: 'Pflanze entfernen',
  btnOverflowTitle: 'Weitere Aktionen',

  // Homozygous / pure-line badge
  homozygousBadge: '◈',
  homozygousTitle: 'Reinerbig — Nachkommen sind berechenbarer',

  // Rare recessive carrier badge
  rareCarrierBadge: '✦',
  rareCarrierTitle: 'Trägt ein verborgenes Allel einer noch nicht vollständig entdeckten Rarität',

  // Allele inspect (magnifier)
  alleleInspectTitle: 'Allele anzeigen',
  alleleHueWhite: 'weiß',
  alleleHueGray: 'grau',
  alleleOverlayTitle: 'Genetik',
  alleleOverlayHue: 'Farbe',
  alleleOverlayLight: 'Helligkeit',
  alleleOverlayShape: 'Form',
  alleleOverlayCenter: 'Mitte',
  alleleOverlayEffect: 'Effekt',
  alleleOverlayGradient: 'Farbverlauf',
  alleleOverlayPetalCount: 'Blattanzahl',
  alleleOverlayStemHeight: 'Stängelhöhe',
  alleleOverlayBloomedAt: 'Erblüht am',
  dateLocale: 'de-DE',

  // Breeding panel
  breedParent1: 'Elternteil 1',
  breedParent2: 'Elternteil 2',
  breedPrompt: 'Wähle zwei blühende Pflanzen aus.',
  breedBtn: 'Züchten',
  breedHint: 'Ergebnis landet in einem leeren Topf',
  breedHintWithSeed: 'Ergebnis landet in einem leeren Topf · Chance auf einen Samen',
  breedHintNoSpace: 'Kein freier Topf — entferne zuerst eine Pflanze.',
  breedNoSpace: 'Kein leerer Topf! Entferne zuerst eine Pflanze.',
  breedSlotRemoveTitle: 'Entfernen',

  // Breed estimate
  estPetals: (min: number, max: number) => `Blätter: ${min}–${max}`,
  estGroupPetalCount: 'Blattanzahl',
  estGroupColor: 'Farbe',
  estGroupLightness: 'Helligkeit',
  estGroupShape: 'Blütenform',
  estGroupCenter: 'Blütenmitte',
  estGroupEffect: 'Blüteneffekt',
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
  selfPollinateHomozygousTitle: 'Bereits reinerbig — nutze den Samen-Button, um einen Samen zu lagern',

  // Samen aus reinerbiger Pflanze
  seedHomozygousTitle: 'Samen erhalten — verbraucht einen Samen-Slot & versetzt in Ruhezeit',
  seedHomozygousNoDrawer: 'Saatenschublade freischalten, um reinerbige Samen zu erhalten',
  seedHomozygousCapped: 'Samen-Limit erreicht — diese Pflanze kann keine weiteren Samen produzieren',
  seedHomozygousStorageFull: 'Saatenschublade ist voll',
  seedHomozygousConfirmTitle: 'Samen erhalten',
  seedHomozygousConfirmText: 'Die Pflanze produziert einen identischen Samen, der in der Saatenschublade landet.',
  seedHomozygousWarning: 'Die Pflanze geht in die Ruhezeit und kann währenddessen nicht für Züchtungen verwendet werden.',
  seedHomozygousConfirm: 'Samen erhalten',
  seedHomozygousCancel: 'Abbrechen',
  selfPollinateConfirmTitle: 'Selbstbestäubung',
  selfPollinateConfirmText: 'Die Blüte bestäubt sich selbst. Der entstandene Samen ist reinerbiger als die Elternpflanze.',
  selfPollinateWarning: 'Die Pflanze wird dabei entfernt.',
  selfPollinateConfirm: 'Bestäuben',
  selfPollinateCancel: 'Abbrechen',

  // Seed crafting
  craftSingleSeedBtn: '1 Samen herstellen',
  craftSingleSeedTitle: '1 Samen herstellen — verbraucht je einen Überschuss-Slot beider Pflanzen & 24 Std. Ruhezeit',
  craftSingleSeedWarningShort: '⚠ Beide Pflanzen 20h Ruhezeit',
  craftSingleSeedConfirm: 'Herstellen',
  craftSingleSeedCancel: 'Abbrechen',
  craftMultiSeedBtn: '3–5 Samen herstellen',
  craftMultiSeedWarningShort: '⚠ Verbraucht beide Pflanzen',
  craftMultiSeedTitle: '3–5 Samen herstellen — verbraucht beide Pflanzen',
  craftMultiSeedConfirmTitle: 'Samenernte',
  craftMultiSeedConfirmText: 'Aus den beiden Pflanzen werden 3–5 Samen gewonnen. Die Samen landen in der Saatenschublade.',
  craftMultiSeedWarning: 'Beide Pflanzen werden dabei verbraucht und entfernt.',
  craftMultiSeedConfirm: 'Ernten',
  craftMultiSeedCancel: 'Abbrechen',
  craftRestingLabel: 'In Ruhezeit',
  craftRestingTime: (time: string) => `(noch ${time})`,
  craftSeedObtained: (n: number) => `${n} Samen in der Schublade abgelegt!`,

  // Catalog / encyclopedia
  catalogEmpty: 'Noch keine Entdeckungen.',
  catalogMetaPetals: 'Blätter',
  catalogMetaCenter: 'Mitte',
  catalogMetaColor: 'Farbe',
  catalogMetaEffect: 'Effekt',
  catalogMetaGen: 'Gen.',
  catalogEntryNum: (n: number) => `Nr. ${n}`,
  catalogEntryName: (n: number) => `Blüte ${n}`,
  catalogHomozygousBadge: '◈ reinerbig',

  // Showcase
  btnMoveToShowcase: '🪟',
  btnMoveToShowcaseTitle: 'Im Schaukasten ausstellen',
  btnMoveFromShowcase: 'Zurück in den Garten',
  btnMoveFromShowcaseTitle: 'Pflanze in einen freien Topf zurücksetzen',
  showcaseNoFreePot: 'Kein freier Topf im Garten.',

  // Pot swap
  btnSwapPotTitle: 'Position mit einem anderen Topf tauschen',
  btnSwapPotCancel: 'Auswahl aufheben',
  btnPushToEndTitle: 'Topf ans Ende schieben',

  // Sell
  btnSell: 'Verkaufen',
  btnSellTitle: 'Pflanze verkaufen — erhält Münzen',
  btnSellConfirmTitle: 'Nochmal drücken zum Bestätigen',
  msgSold: (coins: number) => `Blüte verkauft! +${coins} ${COIN_ICON}`,

  // Shop (placeholder)
  shopTab: 'Shop',
  shopComingSoon: 'Bald verfügbar',

  // Shop — Buffs
  shopSectionBuffs: 'Verbesserungen',
  buffTitle: {
    faster_growth:      'Schnelles Wachstum',
    seed_luck:          'Saatenglück',
    cooldown_reduction: 'Auszeit verkürzen',
    trade_skill:        'Verhandlungsgeschick',
  } as Record<string, string>,
  buffDesc: {
    faster_growth:      (pct: number) => `Wachstumsphasen dauern ${pct}% kürzer`,
    seed_luck:          (pct: number) => `+${pct}% Chance auf Bonussamen beim Züchten`,
    cooldown_reduction: (pct: number) => `Ruhezeit nach Züchtung ${pct}% kürzer`,
    trade_skill:        (pct: number) => `+${pct}% Münzen beim Verkaufen`,
  } as Record<string, (pct: number) => string>,
  buffBadge: {
    faster_growth:      (pct: number) => `-${pct}% Wachstum`,
    seed_luck:          (pct: number) => `+${pct}% Samen`,
    cooldown_reduction: (pct: number) => `-${pct}% Ruhezeit`,
    trade_skill:        (pct: number) => `+${pct}% Münzen`,
  } as Record<string, (pct: number) => string>,
  buffActiveLabel:     'Aktiv',
  buffMaxed:           'Maximal',
  buffUnlockRequires:  (name: string) => `Benötigt: ${name}`,
  buffRedeemBtn:       'Einlösen',
  buffRedeemTitle:     (name: string, level: number) => `${name} — Stufe ${level} freischalten`,
  buffRedeemPickHint:  (n: number) => `Wähle ${n} passende Pflanze(n) aus`,
  buffRedeemSeedHint:  (n: number) => `Wähle ${n} passende(n) Samen aus`,
  buffRedeemConfirm:   'Einlösen',
  buffRedeemCancel:    'Abbrechen',
  buffRedeemProgress:  (selected: number, needed: number) => `${selected} / ${needed}`,
  buffUnlocked:        (name: string, level: number) => `${name} Stufe ${level} freigeschaltet!`,
  buffReqAny:          'beliebige Pflanze',
  buffReqRarityMin:    (r: number) => ['', '', '', 'epische', 'legendäre'][r] ?? `Rarität ${r}+`,
  buffReqEffect:       (e: string) => e,
  buffReqEffectOr:     (effects: string[]) => effects.join(' oder '),
  buffReqPetalCount:   (n: number) => `${n} Blütenblätter`,
  buffReqShape:        (s: string) => s,
  buffReqShapeOr:      (shapes: string[]) => shapes.join(' oder '),
  buffReqColorBucket:  (b: string) => colorBucketLabels[b] ?? b,
  buffReqColorOr:      (buckets: string[]) => buckets.map(b => colorBucketLabels[b] ?? b).join('/'),
  buffReqCoinMin:      (n: number) => `≥ ${n} Münzen wert`,
  buffReqCombined:     (parts: string[]) => parts.join(' + '),
  buffReqSourcePot:    'Pflanze (blühend)',
  buffReqSourceSeed:   'Samen aus Schublade',

  // Shop sidebar
  shopSectionUpgrades: 'Upgrades',
  shopItemOwned: 'Gekauft',
  shopOwnedSuffix: ' (gekauft)',
  shopSectionPots: 'Töpfe',
  shopPotsTitle: 'Neuen Topf kaufen',
  shopPotsDesc: (current: number, max: number) => `Aktuell ${current} von ${max} Töpfen. Jeder weitere Topf kostet +50 ${COIN_ICON}.`,
  shopPotsMax: 'Maximum erreicht',
  shopSectionDeco: 'Topf-Design',
  shopSubsectionColors: 'Farben freischalten',
  shopDecoHint: 'Gekaufte Designs per 🎨-Button an jedem Topf wechseln.',
  shopSubsectionShapes: 'Formen freischalten',
  shopSubsectionEffects: 'Muster freischalten',

  // Shop — Upgrade-Beschriftungen
  upgradeTitle: {
    unlock_lupe:             'Genetik-Lupe',
    unlock_selfpollinate:    'Selbstbestäubung',
    unlock_rare_radar:       'Seltenheits-Radar',
    unlock_discovery_index:  'Entdeckungs-Index',
    unlock_showcase:         'Schaukasten',
    unlock_order_book:       'Auftragsbuch',
    unlock_seed_drawer:      'Saatenschublade',
    unlock_research_book:    'Forschungsbuch',
    unlock_completion_index: 'Vollständigkeits-Index',
  } as Record<string, string>,
  upgradeDesc: {
    unlock_lupe:             'Zeigt dir die versteckten Allele jeder blühenden Pflanze.',
    unlock_selfpollinate:    'Pflanzen können sich selbst bestäuben, um reinerbigere Nachkommen zu erzeugen.',
    unlock_rare_radar:       'Zeigt ein ✦-Symbol neben der Seltenheitsstufe, wenn eine Pflanze ein verborgenes Allel einer seltenen, noch nicht vollständig entdeckten Eigenschaft trägt.',
    unlock_discovery_index:  'Zeigt im Katalog eine Übersicht aller entdeckten und noch unbekannten Formen und Farben.',
    unlock_showcase:         'Ein Schaukasten mit 3 Stellplätzen für deine schönsten Blüten. Ausgestellte Pflanzen können weder verkauft noch zum Züchten genutzt werden.',
    unlock_order_book:       'Täglich 3 Aufträge: Züchte und verkaufe Blüten mit bestimmten Merkmalen für Bonus-Münzen.',
    unlock_seed_drawer:      'Eine Schublade mit 20 Fächern für bis zu 100 Saaten. Beim Kreuzen besteht eine Chance auf einen Überschuss-Samen.',
    unlock_research_book:    'Täglich 3 Forschungsaufgaben: Entdecke neue Blüten für Forschungspunkte. Nutze Punkte für dauerhafte Verbesserungen.',
    unlock_completion_index: 'Ein detaillierter Vollständigkeits-Tracker für die richtig ambitionierten Komplettisten. Sieh genau, welche Kombinationen du im Katalog hast und welche du noch entdecken kannst.',
  } as Record<string, string>,

  // Saatenschublade
  seedDrawerTitle: 'Saatenschublade',
  seedDrawerCapacity: (n: number, max: number) => `${n} / ${max}`,
  seedDrawerEmpty: 'Noch keine Saaten vorhanden.',
  plantFromStorage: 'Aus Saatensammlung',
  surplusSeedObtained: 'Einen Überschuss-Samen erhalten!',
  surplusSeedCapacity: (n: number, max: number) => `${n} von ${max} Überschuss-Samen verbleibend`,
  seedDrawerButton: (n: number) => `Saaten (${n})`,
  selectSeedToPlant: 'Saaten zum Einpflanzen wählen',
  seedMoveHint: 'Klick auf ein Fach zum Ablegen',
  seedSellZone: 'Verkaufen',
  msgSeedSold: (coins: number) => `Samen verkauft! +${coins} ${COIN_ICON}`,
  seedMoveCancel: 'Abbrechen',
  seedDrawerClose: 'Schließen',
  seedLabelEditBtn: 'Beschriften',
  seedLabelEditHint: 'Fach anklicken zum Beschriften',
  seedLabelPickerTitle: 'Beschriftung',
  seedLabelPickerClear: 'Löschen',
  seedLabelPickerDone: 'Fertig',
  seedLabelCategoryBucket: 'Farbe',
  seedLabelCategoryShape: 'Blütenform',
  seedLabelCategoryCenter: 'Blütenmitte',
  seedLabelCategoryEffect: 'Effekt',
  seedLabelCategoryMark: 'Symbole',
  seedLabelMaxHint: '(max. 2)',

  // Shop — Showcase
  shopSectionShowcase: 'Schaukasten erweitern',
  shopShowcaseSlotsDesc: (current: number, max: number) => `Aktuell ${current} von ${max} Stellplätzen.`,
  shopShowcaseSlotsMax: 'Maximale Stellplätze erreicht',

  // Shop — Saatenschublade erweitern
  shopSectionSeedSlots: 'Saatenschublade erweitern',
  shopSeedSlotsTitle: 'Neue Fach-Reihe kaufen',
  shopSeedSlotsDesc: (slots: number, capacity: number, remaining: number) =>
    `Aktuell ${slots} Fächer (${capacity} Samenplätze). Noch ${remaining} Reihe${remaining !== 1 ? 'n' : ''} kaufbar.`,
  shopSeedSlotsMax: 'Maximale Fachanzahl erreicht',

  // Shop — Topf-Kosmetik-Bezeichnungen
  potColorLabels: {
    terracotta: 'Terrakotta',
    cream:      'Crème',
    slate:      'Schiefer',
    sage:       'Salbei',
    blush:      'Altrosa',
    cobalt:     'Kobalt',
    obsidian:   'Obsidian',
    gold:       'Gold',
    coral:      'Koralle',
    mint:       'Mint',
    lavender:   'Lavendel',
    teal:       'Petrol',
  } as Record<string, string>,
  potShapeLabels: {
    standard: 'Klassisch',
    conic:    'Konisch',
    belly:    'Bauchig',
    bowl:     'Schale',
    urn:      'Vase',
    tiny:     'Mini',
    amphore:  'Amphore',
    offset:   'Offset',
  } as Record<string, string>,
  potEffectLabels: {
    none:     'Normal',
    glossy:   'Glänzend',
    stripes:  'Streifen',
    diagonal: 'Diagonal',
    dots:     'Punkte',
  } as Record<string, string>,

  // Research book panel
  researchBookTitle:       'Forschungsbuch',
  researchTaskLabel:       (n: number) => `Forschung ${n}`,
  researchTaskDone:        'Erforscht',
  researchPointsBadge:     (n: number) => `🔬 ${n}`,
  researchUnknownTrait:    'Merkmal unbekannt',
  researchTaskGrayedHint:  'Unbekannte Merkmale — forsche weiter, um diese Aufgabe zu sehen',
  msgResearchTaskDone:     (n: number) => `Forschungsaufgabe ${n} erfüllt! +1 Forschungspunkt 🔬`,

  // Research — trait badge labels
  researchBadgeShape:      (name: string) => name,
  researchBadgeCount:      (n: number) => `${n} Blütenbl.`,
  researchBadgeColor:      (name: string) => name,
  researchBadgeLightness:  (name: string) => name,
  researchBadgeCenter:     (name: string) => name,
  researchBadgeEffect:     (name: string) => name,

  // Buff panel (research-point based)
  buffBuyBtn:              'Kaufen',
  buffCost:                (n: number) => `${n} 🔬`,
  buffLevelLabel:          (n: number) => `Stufe ${n}`,
  buffNoResearchBook:      'Forschungsbuch kaufen, um Forschungspunkte zu sammeln',

  // Order book panel
  orderBookTitle:       'Auftragsbuch',
  orderBookEmpty:       'Keine Aufträge verfügbar.',
  orderBookRefreshBtn:        'Neue Aufträge anfordern',
  orderBookRefreshConfirmBtn: 'Zum Anfordern nochmal drücken',
  orderBookRefreshUsed:       'Heute bereits neu angefordert',
  orderBookPinTitle:    'Auftrag anpinnen — bleibt beim Neu-Mischen erhalten',
  orderBookUnpinTitle:  'Auftrag lösen',
  orderBookOrderLabel:  (n: number) => `Auftrag ${n}`,
  orderBookReward:      (coins: number) => `+${coins} ${COIN_ICON} Bonus`,
  orderBookDoneLabel:   'Erledigt',
  orderBookBadgeTitle:  (n: number) => `Verkauf erfüllt Auftrag ${n}`,
  msgSoldWithBonus:     (total: number, bonus: number) => `Blüte verkauft! +${total} ${COIN_ICON} (inkl. +${bonus} ${COIN_ICON} Auftrag)`,

  // Order requirement labels
  orderReqShape:      (name: string) => `Form: ${name}`,
  orderReqColor:      (name: string) => `Farbbereich: ${name}`,
  orderReqLightness:  (name: string) => `Helligkeit: ${name}`,
  orderReqCountEq:   (n: number)    => `${n} Blütenbl.`,
  orderReqCountGte:   (n: number)    => `Min. ${n} Blütenbl.`,
  orderReqCountLte:   (n: number)    => `Max. ${n} Blütenbl.`,
  orderReqCenter:     (name: string) => `Mitte: ${name}`,
  orderReqEffect:     (name: string) => `Effekt: ${name}`,
  orderReqHomozygous: 'Reinerbig (◈)',

  // Lightness labels
  lightnessLabels: { 30: 'Dunkel', 60: 'Mittel', 90: 'Hell' } as Record<number, string>,

  // Notification footer
  notifEmpty: 'Noch keine Meldungen.',

  // Messages
  msgPotCleared: 'Topf geleert.',
  msgNewBloom: (potIndex: number, catalogNr: number, isNew: boolean, rarity: number) => {
    const labels = ['▪', '●', '♦', '★', '👑']
    const rarityLabel = labels[rarity] ?? ''
    const tag = isNew ? '(Neu! ' : '('
    return `Eine Blüte ${rarityLabel} ist in Topf ${potIndex} erblüht! ${tag}📖 Nr. ${catalogNr})`
  },

  // ─── Help modal ─────────────────────────────────────────────────────────────

  helpClose: 'Schließen',

  // Header
  helpTitle: 'Willkommen bei Floev',
  helpSubtitle: 'Ein botanisches Züchtungsspiel',
  helpChangelogBtn: 'Was ist neu?',

  // Intro
  helpIntro1: 'Floev ist ein entspanntes Offline-Spiel — pflanze Samen, schau später wieder rein und staune, was erblüht ist.',
  helpIntro2: 'Jede Blüte wird aus genetischen Eigenschaften berechnet. Farbe, Form, Blütenmitte und Blüteneffekte ergeben zusammen tausende einzigartige Blütenkombinationen. Die Blumen tragen je zwei Erbgutinformationen in sich und geben eine durch Kreuzung weiter - lerne die Mechanismen dahinter kennen und entdecke selbst die seltensten Blüten!',

  // Colors
  helpColorsTitle: 'Farbe & Helligkeit',
  helpColorsBody: 'Jede Pflanze trägt zwei Farb-Allele und zwei Helligkeits-Allele. Das dominantere Allel bestimmt die sichtbare Farbe.',
  helpColorBucketsExplain: 'Farben sind in Bereiche eingeteilt — von häufig (links) bis selten (rechts). Manche Bereiche sind noch unentdeckt:',
  helpColorsDominance: 'Farbdominanz — links dominiert, rechts ist rezessiv',
  helpLightnessDominance: 'Helligkeit: Hell dominiert Mittel dominiert Dunkel',
  helpLightnessDark: 'dunkel',
  helpLightnessMid: 'mittel',
  helpLightnessLight: 'hell',

  // Shapes
  helpShapesTitle: 'Blütenformen',
  helpShapesBody: 'Die ersten drei Formen kannst du von Anfang an entdecken. Zwei weitere sind seltener und rezessiver — finde sie durch gezieltes Kreuzen heraus.',
  helpShapesDominance: 'Formdominanz: Rund > Lanzett > Tropfen > ? > ?',
  helpShapeSecretLabel: 'Geheimnis',
  helpShapeSecret: '?',

  // Rarity
  helpRarityTitle: 'Seltenheitsstufen',
  helpRarityBody: 'Jede Blüte erhält beim Aufblühen einen Score aus Form, Farbe, Blütenmitte, Blüteneffekt und weiteren Merkmalen. Je seltener, desto mehr Münzen beim Verkauf.',
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
  helpBreedBody: 'Kreuze zwei blühende Pflanzen — jedes Kind erbt von jedem Elternteil ein zufälliges Allel pro Eigenschaft. Die Vorschau zeigt Wahrscheinlichkeiten für Farbe, Form und Blütenmitte.',
  helpBreedStep1: 'Wähle zwei blühende Pflanzen über „Züchten" aus.',
  helpBreedStep2: 'Die Vorschau zeigt Wahrscheinlichkeiten für Farbe, Form und Blütenmitte.',
  helpBreedStep3: 'Klicke „Züchten" — ein neuer Samen landet im nächsten freien Topf.',
  helpBreedStep4: 'Lass den Samen wachsen und beobachte das Ergebnis.',
  helpSelfBody: 'Mit ↺ (Selbstbestäubung, im Shop erhältlich) kreuzt sich eine Pflanze mit sich selbst — das verbraucht die Mutterpflanze, erzeugt aber reinerbigere Nachkommen.',
  helpHomoBody: 'Reinerbige Pflanzen (◈) tragen auf beiden Allelen denselben Wert — ihre Nachkommen sind deutlich berechenbarer.',

  // Other heritable traits
  helpOtherTraitsTitle: 'Weitere Eigenschaften',
  helpOtherTraitsBody: 'Zusätzlich bestimmen die Erbinformationen die Blütenmitte, Stängelhöhe, Blüteneffekte und Blattanzahl deiner Pflanze. Finde ihre Erbreihenfolge heraus und züchte sie gezielt.',

  // Start button
  helpStartBtn: 'Los geht\'s 🌱',

  // Help button tooltip
  // Garden settings modal
  gardenSettingsBtnTitle: 'Garteneinstellungen',
  gardenSettingsHeading: 'Garteneinstellungen',
  gardenSettingsClose: 'Schließen',
  gardenSettingsResetOnSell: 'Design beim Verkauf zurücksetzen',
  gardenSettingsResetOnSellDesc: 'Topf-Design wird nach dem Verkauf einer Pflanze auf das Standard-Aussehen zurückgesetzt.',
  gardenSettingsDefaultDesign: 'Standard-Aussehen',
  gardenSettingsDefaultDesignDesc: 'Wird beim Zurücksetzen verwendet.',
  gardenSettingsEmptyAtEnd: 'Leere Töpfe ans Ende',
  gardenSettingsEmptyAtEndDesc: 'Töpfe werden nach dem Verkauf ans Ende verschoben.',

  helpBtnTitle: 'Hilfe & Spielregeln',
  helpDisclaimerTitle: 'KI-Nutzungshinweis',
  helpDisclaimerText: 'Dieses Spiel ist ein KI-Experiment, um herauszufinden, wie leistungsstark KI in der Webentwicklung ist und wo die Grenzen liegen. Der Großteil des Spiels ist durch Claude Sonnet 4.6 geschrieben und von einem menschlichen Entwickler überprüft.',

  shopOpenBtnLabel: '🛒 Shop',

  helpQuickStartTitle: 'Schnellstart',
  helpQuickStartItem1: 'zufällige Samen pflanzen',
  helpQuickStartItem2: 'neue Funktionen freischalten',
  helpQuickStartItem3: 'deine erste Kreuzung ausprobieren',
  helpQuickStartTip: '💡 Shop-Tipp!',
  helpQuickStartTipText: 'Das Auftragsbuch hilft schon früh, Münzen zu verdienen – und die Genetik-Lupe lässt dich die Vererbung besser verstehen.',

  // Achievement panel
  achPanelTitle: 'Erfolge',
  achEmpty: 'Noch keine Erfolge in Sicht.',
  achInProgress: 'In Arbeit',
  achCompleted: 'Abgeschlossen',
  achUnlocked: 'Erfolg freigeschaltet',
  achDoneTitle: 'Abgeschlossen',
  achShowAll: 'alle anzeigen',
  achHideAll: 'weniger',

  // ─── Achievement definitions ─────────────────────────────────────────────────

  // Rarity milestones
  achRarityTitle: (label: string) => `${label}e Blüte`,
  achRarityDesc: (label: string) => `Züchte eine Blüte der Seltenheit „${label}".`,
  achRarityLabel: (rarity: number): string => {
    const labels = ['Gewöhnlich', 'Ungewöhnlich', 'Selten', 'Episch', 'Legendär'];
    return labels[rarity] ?? '';
  },

  // Catalog size milestones
  achCatalogTitle: (n: number): string => {
    if (n >= 100) return 'Sammlerin IV';
    if (n >= 60)  return 'Sammlerin III';
    if (n >= 30)  return 'Sammler II';
    return 'Sammler';
  },
  achCatalogDesc: (n: number) => `Entdecke ${n} verschiedene Blüten.`,

  // Color diversity
  achColorDivTitle: (n: number) => n === 7 ? 'Volle Palette' : `${n} Farben`,
  achColorDivDesc: (n: number) => n === 7
    ? 'Entdecke Blüten in allen 7 Farbbereichen (inkl. Weiß & Grau).'
    : `Entdecke Blüten in ${n} verschiedenen Farbbereichen.`,

  // Shape diversity
  achShapeDivTitle: (n: number) => n === 5 ? 'Alle Formen' : `${n} Blütenformen`,
  achShapeDivDesc: (n: number) => n === 5
    ? 'Entdecke Blüten in allen 5 Blütenformen.'
    : `Entdecke Blüten in ${n} verschiedenen Blütenformen.`,

  // Generation milestones
  achGenTitle: (g: number) => `Generation ${g}`,
  achGenDesc: (g: number) => `Züchte eine Blüte der Generation ${g} oder höher.`,

  // Effect milestones (unified: gradient, bicolor, shimmer, iridescent)
  effectLabels: {
    none:       'Kein Effekt',
    gradient:   'Farbverlauf',
    bicolor:    'Zweifarbig',
    shimmer:    'Schimmer',
    iridescent: 'Irisierend',
  } as Record<string, string>,
  effectFirstTitles: {
    gradient:   'Erstes Schimmern',
    bicolor:    'Zweifarbig',
    shimmer:    'Schimmer',
    iridescent: 'Irisierend',
  } as Record<string, string>,
  achEffectTitle: (label: string, firstTitle: string, n: number) =>
    n === 1 ? firstTitle : `${n}× ${label}`,
  achEffectDesc: (label: string, n: number) =>
    n === 1 ? `Entdecke deine erste Blüte mit dem Effekt ${label}.` : `Entdecke ${n} Blüten mit dem Effekt ${label}.`,

  // Homozygous
  achHomoTitle: 'Reinerbig',
  achHomoDesc: 'Entdecke eine reinerbige (◈) Blüte.',

  // Petal count × shape
  achPetalsTitle: (shapeLabel: string, count: number) => `${shapeLabel}, ${count} Blätter`,
  achPetalsDesc: (shapeLabel: string, count: number) => `Entdecke eine ${shapeLabel}-Blüte mit genau ${count} Blütenblättern.`,

  // Bucket collection
  achBucketFirstTitle: (colorLabel: string) => `Im ${colorLabel}-Bereich`,
  achBucketFirstDesc: (colorLabel: string) => `Entdecke deine erste Blüte im ${colorLabel}-Bereich.`,
  achBucketHuesTitle: (colorLabel: string) => `Alle ${colorLabel}-Gruppen`,
  achBucketHuesDesc: (colorLabel: string) => `Entdecke jeweils einen Farbton aus allen Gruppen des ${colorLabel}-Bereichs.`,
  achBucketShadesTitle: (colorLabel: string) => `Alle ${colorLabel}-Farbtöne`,
  achBucketShadesDesc: (colorLabel: string) => `Entdecke alle Farbton-Helligkeits-Kombinationen im ${colorLabel}-Bereich.`,

  // 8-petal shape × color combos
  achCombo8Title: (shapeLabel: string, colorLabel: string) => `8× ${shapeLabel} (${colorLabel})`,
  achCombo8Desc: (shapeLabel: string, colorLabel: string) => `Entdecke eine 8-blütige ${shapeLabel}-Blüte in ${colorLabel}.`,

  // Legendary per shape
  achLegendaryShapeTitle: (shapeLabel: string) => `Legendäre ${shapeLabel}-Blüte`,
  achLegendaryShapeDesc: (shapeLabel: string) => `Züchte eine legendäre Blüte mit der Form „${shapeLabel}".`,

  // Center type collection
  achCenterTitle: (centerLabel: string) => `Blütenmitte: ${centerLabel}`,
  achCenterDesc: (centerLabel: string) => `Entdecke eine Blüte mit der Blütenmitte ${centerLabel}.`,
  achAllShapesCenterTitle: (centerLabel: string) => `${centerLabel}: Alle Formen`,
  achAllShapesCenterDesc: (centerLabel: string) => `Züchte mindestens eine Blüte jeder Blütenform mit der Blütenmitte ${centerLabel}.`,
  achAllShapesEffectTitle: (effectLabel: string) => `${effectLabel}: Alle Formen`,
  achAllShapesEffectDesc: (effectLabel: string) => `Züchte mindestens eine Blüte jeder Blütenform mit dem Effekt ${effectLabel}.`,

  // ─── New achievements ────────────────────────────────────────────────────────

  // Farbverlauf fixiert
  achGradFixedTitle: 'Farbverlauf fixiert',
  achGradFixedDesc: 'Entdecke eine reinerbige Blüte mit Farbverlauf.',

  // Alle Formen reinerbig
  achAllShapesHomoTitle: (n: number) => `${n} Formen reinerbig`,
  achAllShapesHomoDesc: (n: number) => `Züchte reinerbige Blüten in ${n} verschiedenen Blütenformen.`,

  // Monochromes Set
  achMonochromeTitle: 'Monochrom',
  achMonochromeDesc: `Entdecke Blüten in Weiß, Silber, Steingrau und Anthrazit.`,

  // Alle Blütenblatt-Anzahlen
  achAllCountsTitle: 'Vollständige Zählung',
  achAllCountsDesc: 'Entdecke Blüten mit 3, 4, 5, 6, 7 und 8 Blütenblättern.',
  achAllCountsShapeTitle: (shapeLabel: string) => `Vollständige Zählung: ${shapeLabel}`,
  achAllCountsShapeDesc: (shapeLabel: string) => `Entdecke ${shapeLabel}-Blüten mit 3, 4, 5, 6, 7 und 8 Blütenblättern.`,

  // Alle Blütenformen in einem Farbbucket
  achShapesInBucketTitle: (colorLabel: string) => `Alle Formen in ${colorLabel}`,
  achShapesInBucketDesc: (colorLabel: string) => `Entdecke alle 5 Blütenformen im ${colorLabel}-Farbbereich.`,

  // Reiche Ernte
  achRichHarvestTitle: (coins: number) => `${coins} Münzen wert`,
  achRichHarvestDesc: (coins: number) => `Besitze eine einzelne Blüte die mindestens ${coins} Münzen wert ist.`,

  // Vollständigkeits-Index Meilensteine
  achCiPctTitle: (pct: number) => pct === 100 ? 'Vollständig!' : `${pct}% vollständig`,
  achCiPctDesc: (pct: number) => `Entdecke ${pct}% aller Kombinationen im Vollständigkeits-Index.`,

  // Matrix-Vervollständigung (Form × Farbe × alle Blattanzahlen × alle Mittentypen)
  achMatrixTitle: (shapeLabel: string, colorLabel: string) => `${shapeLabel} × ${colorLabel}: Matrix`,
  achMatrixDesc: (shapeLabel: string, colorLabel: string) => `Entdecke alle Kombinationen aus Blattanzahl (3, 5, 8) und Blütenmitte für eine ${shapeLabel}-Blüte in ${colorLabel}.`,

  // Shared label maps
  shapeLabels: {
    round: 'Rund', lanzett: 'Lanzett', tropfen: 'Tropfen', wavy: 'Wellig', zickzack: 'Zickzack',
  } as Record<string, string>,
  colorBucketLabels,
  
  centerTypeLabels: {
    dot: 'Punkt', disc: 'Scheibe', stamen: 'Staubblätter',
  } as Record<string, string>,

  colorLabelGradient: "-Verlauf",

  colorLabel: {
  5: {
    hueName: `Karmin (Gruppe)`,
    90: {
      30: "Karmesin",
      60: "Karminrot",
      90: "Korallenrot",
    }
  },
  1: {
    hueName: 'Weiß (Gruppe)',
    0: {
      100: "Weiß"
    }
  },
  2: {
    hueName: 'Grau (Gruppe)',
    0: {
      30: "Anthrazit",
      60: "Steingrau",
      90: "Silber",
    }
  },
  25: {
    hueName: `Rost (Gruppe)`,
    90: {
      30: "Rost",
      60: "Rostorange",
      90: "Apricot",
    },
  },
  350: {
    hueName: `Rubin (Gruppe)`,
    90: {
      30: "Rubinrot",
      60: "Rhodolith",
      90: "Rosé",
    },
  },
  60: {
    hueName: `Gelb (Gruppe)`,
    90: {
      30: "Senf",
      60: "Goldgelb",
      90: "Vanillegelb",
    },
  },
  160: {
    hueName: `Smaragd (Gruppe)`,
    90: {
      30: "Smaragd",
      60: "Jadegrün",
      90: "Mintgrün",
    },
  },
  180: {
    hueName: `Türkis (Gruppe)`,
    90: {
      30: "Tiefseetürkis",
      60: "Türkis",
      90: "Eisblau",
    },
  },
  200: {
    hueName: `Azur (Gruppe)`,
    90: {
      30: "Petrol",
      60: "Himmelblau",
      90: "Azurblau",
    },
  },
  230: {
    hueName: `Marine (Gruppe)`,
    90: {
      30: "Marineblau",
      60: "Königsblau",
      90: "Fernblau",
    },
  },
  255: {
    hueName: `Grauviolett (Gruppe)`,
    90: {
      30: "Indigo",
      60: "Dämmerlila",
      90: "Nebellila",
    },
  },
  270: {
    hueName: `Amethyst (Gruppe)`,
    90: {
      30: "Amethyst",
      60: "Amethystlila",
      90: "Kunzit",
    },
  },
  290: {
    hueName: `Magenta (Gruppe)`,
    90: {
      30: "Purpur",
      60: "Magenta",
      90: "Seidenrosa",
    },
  },
  310: {
    hueName: `Fuchsia (Gruppe)`,
    90: {
      30: "Pflaume",
      60: "Fuchsia",
      90: "Puderrosa",
    },
  },
  330: {
    hueName: `Burgund (Gruppe)`,
    90: {
      30: "Burgund",
      60: "Burgundrot",
      90: "Altrosa",
    },
  },
},

completionIndexTitle: 'Vollständigkeits-Index',
  completionIndexSummary: (found: number, total: number) => `${found}/${total} entdeckt`,
  completionIndexUndiscovered: 'Unentdeckt',

discoveryIndexTitle: 'Entdeckungs-Index',
  discoveryIndexSectionShapes: 'Blütenformen',
  discoveryIndexMatrixCount: 'Anzahl',
  discoveryIndexMatrixCenter: 'Zentrum',
  discoveryIndexMatrixEffect: 'Effekt',
  discoveryIndexSectionColors: 'Farben',
  discoveryIndexSectionShapeColors: 'Farbe × Form',
  discoveryIndexSummary: (shapes: number, totalShapes: number, colors: number, totalColors: number) =>
    `${shapes}/${totalShapes} Kombinationen · ${colors}/${totalColors} Farben`,

migrationNoticeTitle: 'Spielstand aktualisiert',
migrationNoticeText: 'Die Blütenblatt-Mechanik wurde überarbeitet und auf drei Stufen vereinfacht (3, 5, 8). Dadurch sind einige Katalogeinträge entfallen und bestehende Blüten wurden neu berechnet.',
migrationNoticeDetails: (lost: number, coins: number) => `${lost} ${lost === 1 ? 'Katalogeintrag' : 'Katalogeinträge'} entfallen. +${coins} Münzen als Entschädigung gutgeschrieben`,
migrationNoticeOk: 'Verstanden',

petalNames: {
  round: {
    3: 'Karge Orbella',
    5: 'Sommerorbella',
    8: 'Volle Orbella',
  },
  lanzett: {
    3: 'Nadel-Lancea',
    5: 'Kühne Lancea',
    8: 'Himmelslanze',
  },
  tropfen: {
    3: 'Tau-Lumaria',
    5: 'Echte Lumaria',
    8: 'Sonnen-Lumaria',
  },
  wavy: {
    3: 'Leichte Velora',
    5: 'Tanzende Velora',
    8: 'Große Velora',
  },
  zickzack: {
    3: 'Frühe Serrata',
    5: 'Scharfwind-Serrata',
    8: 'Donnerkranz',
  },
}
}

export type I18n = typeof de
