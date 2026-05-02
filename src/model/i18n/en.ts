// ─── Floev — English UI strings ───────────────────────────────────────────────
import { COIN_ICON } from '../../ui/icons'

const colorBucketLabels = {
    white: 'White', yellowgreen: 'Yellow/Green', red: 'Red', pink: 'Pink',
    purple: 'Purple', blue: 'Blue', green: 'Green', gray: 'Gray',
  } as Record<string, string>;

export const en = {
  // App shell
  appTitle: 'Floev',
  welcomeMsg: 'Welcome to Floev! Plant a seed in an empty pot.',

  // Section headings
  sectionGarden: 'Your Garden',
  sectionBreeding: 'Breeding',
  sectionDiscoveries: 'Discoveries',
  sectionShowcase: 'Showcase',

  // Phase labels
  phaseEmpty: 'Empty',
  phaseSeed: 'Seed',
  phaseSprout: 'Sprout',
  phaseBud: 'Seedling',
  phaseBloom: (name: string) => name,
  phaseTimeLeft: (min: number) => `${min} min left`,
  phaseAlmostDone: 'almost done',

  // Rarity labels
  rarity: {
    common: 'common',
    0: 'common',
    uncommon: 'uncommon',
    1: 'uncommon',
    rare: 'rare',
    2: 'rare',
    epic: 'epic',
    3: 'epic',
    legendary: 'legendary',
    4: 'legendary',
  },

  // Pot buttons
  potDesignBtnTitle: 'Change pot design',
  btnPlant: 'Plant',
  btnBreedSelect: 'Breed',
  btnBreedDeselect: 'Deselect',
  btnRemove: '✕',
  btnRemoveTitle: 'Remove plant',
  btnOverflowTitle: 'More actions',

  // Homozygous / pure-line badge
  homozygousBadge: '◈',
  homozygousTitle: 'Homozygous — offspring are more predictable',

  // Rare recessive carrier badge
  rareCarrierBadge: '✦',
  rareCarrierTitle: 'Carries a hidden allele of a rare trait not yet fully discovered',

  // Allele inspect (magnifier)
  alleleInspectTitle: 'Show alleles',
  alleleHueWhite: 'white',
  alleleHueGray: 'gray',
  alleleOverlayTitle: 'Genetics',
  alleleOverlayHue: 'Color',
  alleleOverlayLight: 'Lightness',
  alleleOverlayShape: 'Shape',
  alleleOverlayCenter: 'Center',
  alleleOverlayEffect: 'Effect',
  alleleOverlayGradient: 'Gradient',
  alleleOverlayPetalCount: 'Petal count',
  alleleOverlayStemHeight: 'Stem height',
  alleleOverlayBloomedAt: 'Bloomed on',
  dateLocale: 'en-GB',

  // Breeding panel
  breedParent1: 'Parent 1',
  breedParent2: 'Parent 2',
  breedPrompt: 'Select two blooming plants.',
  breedBtn: 'Breed',
  breedHint: 'Result goes into an empty pot',
  breedHintWithSeed: 'Result goes into an empty pot · chance of a seed',
  breedHintNoSpace: 'No empty pot — remove a plant first.',
  breedNoSpace: 'No empty pot! Remove a plant first.',
  breedSlotRemoveTitle: 'Remove',

  // Breed estimate
  estPetals: (min: number, max: number) => `Petals: ${min}–${max}`,
  estGroupColor: 'Color',
  estGroupLightness: 'Lightness',
  estGroupShape: 'Shape',
  estGroupCenter: 'Center',
  estGroupEffect: 'Petal effect',
  estGradient: (pct: number) => `✦ Gradient: ~${pct}%`,
  estNoMutNote: 'Excluding rare mutations.',
  estAlleleDominant: 'expressed',
  estAlleleRecessive: 'recessive',

  // Shape labels
  shapeRound: 'Round',
  shapeLanzett: 'Lanceolate',
  shapeWavy: 'Wavy',
  shapeDrop: 'Teardrop',
  shapeZickzack: 'Zigzag',

  // Center labels
  centerDot: 'Dot',
  centerDisc: 'Disc',
  centerStamen: 'Stamen',

  // Self-pollination
  selfPollinateTitle: 'Self-pollinate — consumes the plant, produces more homozygous seeds',
  selfPollinateConfirmTitle: 'Self-pollination',
  selfPollinateConfirmText: 'The bloom pollinates itself. The resulting seed is more homozygous than the parent plant.',
  selfPollinateWarning: 'The parent plant will be used up and removed.',
  selfPollinateConfirm: 'Pollinate',
  selfPollinateCancel: 'Cancel',

  // Seed crafting
  craftSingleSeedBtn: 'Craft 1 Seed',
  craftSingleSeedTitle: 'Craft 1 seed — uses one surplus slot from each plant & 24 h rest period',
   craftSingleSeedWarningShort: '⚠ Both plants rest for 24h',
  craftSingleSeedConfirm: 'Craft',
  craftSingleSeedCancel: 'Cancel',
  craftMultiSeedBtn: 'Craft 3–5 Seeds',
  craftMultiSeedWarningShort: '⚠ Consumes both plants',
  craftMultiSeedTitle: 'Craft 3–5 seeds — consumes both plants',
  craftMultiSeedConfirmTitle: 'Seed Harvest',
  craftMultiSeedConfirmText: 'Both plants yield 3–5 seeds. The seeds go into the seed drawer.',
  craftMultiSeedWarning: 'Both plants will be consumed and removed.',
  craftMultiSeedConfirm: 'Harvest',
  craftMultiSeedCancel: 'Cancel',
  craftRestingLabel: 'Resting',
  craftRestingTime: (time: string) => `(${time} remaining)`,
  craftSeedObtained: (n: number) => `${n} seed${n === 1 ? '' : 's'} placed in the drawer!`,

  // Catalog / encyclopedia
  catalogEmpty: 'No discoveries yet.',
  catalogMetaPetals: 'Petals',
  catalogMetaCenter: 'Center',
  catalogMetaColor: 'Color',
  catalogMetaEffect: 'Effect',
  catalogMetaGen: 'Gen.',
  catalogEntryNum: (n: number) => `No. ${n}`,
  catalogEntryName: (n: number) => `Bloom ${n}`,
  catalogHomozygousBadge: '◈ homozygous',

  // Showcase
  btnMoveToShowcase: '🪟',
  btnMoveToShowcaseTitle: 'Display in showcase',
  btnMoveFromShowcase: 'Back to garden',
  btnMoveFromShowcaseTitle: 'Move plant back to a free pot',
  showcaseNoFreePot: 'No free pot in the garden.',

  // Pot swap
  btnSwapPotTitle: 'Swap position with another pot',
  btnSwapPotCancel: 'Cancel selection',

  // Sell
  btnSell: 'Sell',
  btnSellTitle: 'Sell plant — earns coins',
  btnSellConfirmTitle: 'Press again to confirm sale',
  msgSold: (coins: number) => `Bloom sold! +${coins} ${COIN_ICON}`,

  // Shop (placeholder)
  shopTab: 'Shop',
  shopComingSoon: 'Coming soon',

  // Shop sidebar
  shopSectionUpgrades: 'Upgrades',
  shopItemOwned: 'Purchased',
  shopOwnedSuffix: ' (owned)',
  shopSectionPots: 'Pots',
  shopPotsTitle: 'Buy new pot',
  shopPotsDesc: (current: number, max: number) => `Currently ${current} of ${max} pots. Each additional pot costs +50 ${COIN_ICON}.`,
  shopPotsMax: 'Maximum reached',
  shopSectionDeco: 'Pot Design',
  shopSubsectionColors: 'Unlock colors',
  shopDecoHint: 'Switch purchased designs via the 🎨 button on each pot.',
  shopSubsectionShapes: 'Unlock shapes',
  shopSubsectionEffects: 'Unlock finishes',

  // Shop — upgrade labels
  upgradeTitle: {
    unlock_lupe:             'Genetics Loupe',
    unlock_selfpollinate:    'Self-pollination',
    unlock_rare_radar:       'Rarity Radar',
    unlock_discovery_index:  'Discovery Index',
    unlock_showcase:         'Showcase',
    unlock_order_book:       'Order Book',
    unlock_seed_drawer:      'Seed Drawer',
    unlock_completion_index: 'Completion Index',
  } as Record<string, string>,
  upgradeDesc: {
    unlock_lupe:             'Shows you the hidden alleles of every blooming plant.',
    unlock_selfpollinate:    'Plants can self-pollinate to produce more homozygous offspring.',
    unlock_rare_radar:       'Shows a ✦ symbol next to the rarity badge when a plant carries a hidden allele of a rare trait not yet fully discovered.',
    unlock_discovery_index:  'Shows an overview of all discovered and undiscovered shapes and colors in the catalog.',
    unlock_showcase:         'A showcase with 3 display slots for your most beautiful blooms. Displayed plants cannot be sold or used for breeding.',
    unlock_order_book:       'Three daily orders: breed and sell blooms with specific traits for bonus coins.',
    unlock_seed_drawer:      'A drawer with 20 compartments for up to 100 seeds. Crossing plants gives a chance to receive a surplus seed.',
    unlock_completion_index: 'A detailed collection tracker for the truly ambitious completists. See exactly which combinations you have in your collection and which ones you can still discover.',
  } as Record<string, string>,

  // Seed drawer
  seedDrawerTitle: 'Seed Drawer',
  seedDrawerCapacity: (n: number, max: number) => `${n} / ${max}`,
  seedDrawerEmpty: 'No seeds stored yet.',
  plantFromStorage: 'From Collection',
  surplusSeedObtained: 'Got a surplus seed!',
  surplusSeedCapacity: (n: number, max: number) => `${n} of ${max} surplus seeds remaining`,
  seedDrawerButton: (n: number) => `Seeds (${n})`,
  selectSeedToPlant: 'Select a seed to plant',
  seedMoveHint: 'Click a compartment to move seed',
  seedSellZone: 'Sell',
  msgSeedSold: (coins: number) => `Seed sold! +${coins} ${COIN_ICON}`,
  seedMoveCancel: 'Cancel',
  seedDrawerClose: 'Close',
  seedLabelEditBtn: 'Label',
  seedLabelEditHint: 'Click a compartment to label it',
  seedLabelPickerTitle: 'Label',
  seedLabelPickerClear: 'Clear',
  seedLabelPickerDone: 'Done',
  seedLabelCategoryBucket: 'Color',
  seedLabelCategoryShape: 'Petal shape',
  seedLabelCategoryCenter: 'Center',
  seedLabelCategoryEffect: 'Effect',
  seedLabelCategoryMark: 'Symbols',
  seedLabelMaxHint: '(max. 2)',

  // Shop — Showcase
  shopSectionShowcase: 'Expand showcase',
  shopShowcaseSlotsDesc: (current: number, max: number) => `Currently ${current} of ${max} display slots.`,
  shopShowcaseSlotsMax: 'Maximum display slots reached',

  // Shop — pot cosmetic labels
  potColorLabels: {
    terracotta: 'Terracotta',
    cream:      'Cream',
    slate:      'Slate',
    sage:       'Sage',
    blush:      'Blush',
    cobalt:     'Cobalt',
    obsidian:   'Obsidian',
    gold:       'Gold',
    coral:      'Coral',
    mint:       'Mint',
    lavender:   'Lavender',
    teal:       'Teal',
  } as Record<string, string>,
  potShapeLabels: {
    standard: 'Classic',
    conic:    'Conical',
    belly:    'Bulbous',
    bowl:     'Bowl',
    urn:      'Vase',
    tiny:     'Mini',
    amphore:  'Amphora',
    offset:   'Offset',
  } as Record<string, string>,
  potEffectLabels: {
    none:     'Plain',
    glossy:   'Glossy',
    stripes:  'Stripes',
    diagonal: 'Diagonal',
    dots:     'Dots',
  } as Record<string, string>,

  // Order book panel
  orderBookTitle:       'Order Book',
  orderBookEmpty:       'No orders available.',
  orderBookRefreshBtn:        'Reshuffle',
  orderBookRefreshConfirmBtn: 'Press again to reshuffle',
  orderBookRefreshUsed:       'Already reshuffled today',
  orderBookPinTitle:    'Pin order — keeps it when reshuffling',
  orderBookUnpinTitle:  'Unpin order',
  orderBookOrderLabel:  (n: number) => `Order ${n}`,
  orderBookReward:      (coins: number) => `+${coins} ${COIN_ICON} bonus`,
  orderBookDoneLabel:   'Done',
  orderBookBadgeTitle:  (n: number) => `Sell fulfills order ${n}`,
  msgSoldWithBonus:     (total: number, bonus: number) => `Bloom sold! +${total} ${COIN_ICON} (incl. +${bonus} ${COIN_ICON} order bonus)`,

  // Order requirement labels
  orderReqShape:      (name: string) => `Shape: ${name}`,
  orderReqColor:      (name: string) => `Bucket: ${name}`,
  orderReqLightness:  (name: string) => `Lightness: ${name}`,
  orderReqCountGte:   (n: number)    => `Min. ${n} petals`,
  orderReqCountLte:   (n: number)    => `Max. ${n} petals`,
  orderReqCenter:     (name: string) => `Center: ${name}`,
  orderReqEffect:     (name: string) => `Effect: ${name}`,
  orderReqHomozygous: 'Homozygous (◈)',

  // Lightness labels
  lightnessLabels: { 30: 'Dark', 60: 'Mid', 90: 'Light' } as Record<number, string>,

  // Notification footer
  notifEmpty: 'No messages yet.',

  // Messages
  msgPotCleared: 'Pot cleared.',
  msgNewBloom: (gen: number) => `A new bloom has opened! (Gen. ${gen})`,

  // ─── Help modal ─────────────────────────────────────────────────────────────

  helpClose: 'Close',

  // Header
  helpTitle: 'Welcome to Floev',
  helpSubtitle: 'A botanical breeding game',
  helpChangelogBtn: "What's new?",

  // Intro
  helpIntro1: 'Floev is a relaxed offline game — plant seeds, check back later, and marvel at what has bloomed. Each flower is calculated from genetic traits. Color, shape, center, and petal effects combine to create thousands of unique bloom combinations.',
  helpIntro2: 'Every mature plant carries two genetic values and passes one on through crossbreeding — learn the mechanics and discover even the rarest blooms yourself!',

  // Colors
  helpColorsTitle: 'Color & Lightness',
  helpColorsBody: 'Each plant carries two color alleles and two lightness alleles. The more dominant allele determines the visible color.',
  helpColorBucketsExplain: 'Colors are grouped into ranges — from common (left) to rare (right). Some ranges are still undiscovered:',
  helpColorsDominance: 'Color dominance — left dominates, right is recessive',
  helpLightnessDominance: 'Lightness: Light dominates Mid dominates Dark',
  helpLightnessDark: 'dark',
  helpLightnessMid: 'mid',
  helpLightnessLight: 'light',

  // Shapes
  helpShapesTitle: 'Bloom shapes',
  helpShapesBody: 'The first three shapes can be discovered from the start. Two more are rarer and more recessive — find them through targeted crossbreeding.',
  helpShapesDominance: 'Shape dominance: Round > Lanceolate > Teardrop > ? > ?',
  helpShapeSecretLabel: 'Secret',
  helpShapeSecret: '?',

  // Rarity
  helpRarityTitle: 'Rarity tiers',
  helpRarityBody: 'Each bloom receives a score based on shape, color, center, petal effect, and other traits when it opens. The rarer the bloom, the more coins it earns when sold.',
  helpRarityDesc: (rarity: number): string => {
    const descs = [
      'Common — round shapes, simple colors',
      'Uncommon trait combination',
      'Rare shapes or special colors',
      'Very rare combination of multiple traits',
      'Legendary — extremely difficult to breed',
    ];
    return descs[rarity] ?? '';
  },

  // Breeding
  helpBreedTitle: 'Breeding & Inheritance',
  helpBreedBody: 'Cross two blooming plants — each offspring inherits one random allele per trait from each parent. The preview shows probabilities for color, shape, and center.',
  helpBreedStep1: 'Select two blooming plants via "Breed".',
  helpBreedStep2: 'The preview shows probabilities for color, shape, and center.',
  helpBreedStep3: 'Click "Breed" — a new seed lands in the next empty pot.',
  helpBreedStep4: 'Let the seed grow and observe the result.',
  helpSelfBody: 'With ↺ (self-pollination, a buyable upgrade) a plant crosses with itself — this consumes the mother plant but produces more homozygous offspring.',
  helpHomoBody: 'Homozygous plants (◈) carry the same value on both alleles — their offspring are considerably more predictable.',

  // Other heritable traits
  helpOtherTraitsTitle: 'More traits',
  helpOtherTraitsBody: 'The genetic information also determines your plant\'s flower center, stem height, petal effects, and petal count. Discover their inheritance order and breed for them deliberately.',

  // Start button
  helpStartBtn: 'Let\'s go 🌱',

  // Garden settings modal
  gardenSettingsBtnTitle: 'Garden settings',
  gardenSettingsHeading: 'Garden settings',
  gardenSettingsClose: 'Close',
  gardenSettingsResetOnSell: 'Reset design on sell',
  gardenSettingsResetOnSellDesc: 'Pot design is reset to the default appearance after selling a plant.',
  gardenSettingsDefaultDesign: 'Default appearance',
  gardenSettingsDefaultDesignDesc: 'Used when resetting a pot.',
  gardenSettingsEmptyAtEnd: 'Empty pots at end',
  gardenSettingsEmptyAtEndDesc: 'Pots are moved to the end after sell.',

  // Help button tooltip
  helpBtnTitle: 'Help & rules',
  helpDisclaimerTitle: 'AI Usage Notice',
  helpDisclaimerText: 'This game is an AI experiment to find out how capable AI is in web development and where the limits lie. The majority of the game is written by Claude Sonnet 4.6 and reviewed by a human developer.',

  shopOpenBtnLabel: '🛒 Shop',

  helpQuickStartTitle: 'Quick Start',
  helpQuickStartItem1: 'plant random seeds',
  helpQuickStartItem2: 'unlock new features',
  helpQuickStartItem3: 'try your first crossbreeding',
  helpQuickStartTip: '💡 Shop tip!',
  helpQuickStartTipText: 'The Order Book helps you earn coins early – and the Genetics Loupe lets you better understand inheritance.',

  // Achievement panel
  achPanelTitle: 'Achievements',
  achEmpty: 'No achievements in sight yet.',
  achInProgress: 'In progress',
  achCompleted: 'Completed',
  achUnlocked: 'Achievement unlocked',
  achDoneTitle: 'Completed',
  achShowAll: 'show all',
  achHideAll: 'show less',

  // ─── Achievement definitions ─────────────────────────────────────────────────

  // Rarity milestones
  achRarityTitle: (label: string) => `${label} bloom`,
  achRarityDesc: (label: string) => `Breed a bloom of rarity "${label}".`,
  achRarityLabel: (rarity: number): string => {
    const labels = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];
    return labels[rarity] ?? '';
  },

  // Catalog size milestones
  achCatalogTitle: (n: number): string => {
    if (n >= 100) return 'Collector IV';
    if (n >= 60)  return 'Collector III';
    if (n >= 30)  return 'Collector II';
    return 'Collector';
  },
  achCatalogDesc: (n: number) => `Discover ${n} different blooms.`,

  // Color diversity
  achColorDivTitle: (n: number) => n === 7? 'Full Palette' : `${n} colors`,
  achColorDivDesc: (n: number) => n === 7
    ? 'Discover blooms in all 7 color ranges (incl. white & gray).'
    : `Discover blooms in ${n} different color ranges.`,

  // Shape diversity
  achShapeDivTitle: (n: number) => n === 5 ? 'All shapes' : `${n} bloom shapes`,
  achShapeDivDesc: (n: number) => n === 5
    ? 'Discover blooms in all 5 bloom shapes.'
    : `Discover blooms in ${n} different bloom shapes.`,

  // Generation milestones
  achGenTitle: (g: number) => `Generation ${g}`,
  achGenDesc: (g: number) => `Breed a bloom of generation ${g} or higher.`,

  // Effect milestones (unified: gradient, bicolor, shimmer, iridescent)
  effectLabels: {
    none:       'No effect',
    gradient:   'Gradient',
    bicolor:    'Bicolor',
    shimmer:    'Shimmer',
    iridescent: 'Iridescent',
  } as Record<string, string>,
  effectFirstTitles: {
    gradient:   'First Shimmer',
    bicolor:    'Bicolor',
    shimmer:    'Shimmer',
    iridescent: 'Iridescent',
  } as Record<string, string>,
  achEffectTitle: (label: string, firstTitle: string, n: number) =>
    n === 1 ? firstTitle : `${n}× ${label}`,
  achEffectDesc: (label: string, n: number) =>
    n === 1 ? `Discover your first bloom with the ${label} effect.` : `Discover ${n} blooms with the ${label} effect.`,

  // Homozygous
  achHomoTitle: 'Homozygous',
  achHomoDesc: 'Discover a homozygous (◈) bloom.',

  // Petal count × shape
  achPetalsTitle: (shapeLabel: string, count: number) => `${shapeLabel}, ${count} petals`,
  achPetalsDesc: (shapeLabel: string, count: number) => `Discover a ${shapeLabel} bloom with exactly ${count} petals.`,

  // Bucket collection
  achBucketFirstTitle: (colorLabel: string) => `In the ${colorLabel} range`,
  achBucketFirstDesc: (colorLabel: string) => `Discover your first bloom in the ${colorLabel} range.`,
  achBucketHuesTitle: (colorLabel: string) => `All ${colorLabel} groups`,
  achBucketHuesDesc: (colorLabel: string) => `Discover at least one bloom from each group in the ${colorLabel} range.`,
  achBucketShadesTitle: (colorLabel: string) => `All ${colorLabel} shades`,
  achBucketShadesDesc: (colorLabel: string) => `Discover all hue-lightness combinations in the ${colorLabel} range.`,

  // 8-petal shape × color combos
  achCombo8Title: (shapeLabel: string, colorLabel: string) => `8× ${shapeLabel} (${colorLabel})`,
  achCombo8Desc: (shapeLabel: string, colorLabel: string) => `Discover an 8-petal ${shapeLabel} bloom in ${colorLabel}.`,

  // Legendary per shape
  achLegendaryShapeTitle: (shapeLabel: string) => `Legendary ${shapeLabel} bloom`,
  achLegendaryShapeDesc: (shapeLabel: string) => `Breed a legendary bloom with the shape "${shapeLabel}".`,

  // Center type collection
  achCenterTitle: (centerLabel: string) => `Center: ${centerLabel}`,
  achCenterDesc: (centerLabel: string) => `Discover a bloom with the center "${centerLabel}".`,
  achAllShapesCenterTitle: (centerLabel: string) => `All shapes: ${centerLabel}`,
  achAllShapesCenterDesc: (centerLabel: string) => `Breed at least one bloom of each petal shape with the ${centerLabel} center.`,
  achAllShapesEffectTitle: (effectLabel: string) => `All shapes: ${effectLabel}`,
  achAllShapesEffectDesc: (effectLabel: string) => `Breed at least one bloom of each petal shape with the ${effectLabel} effect.`,

  // ─── New achievements ────────────────────────────────────────────────────────

  // Gradient fixed
  achGradFixedTitle: 'Gradient fixed',
  achGradFixedDesc: 'Discover a homozygous bloom with gradient.',

  // All shapes homozygous
  achAllShapesHomoTitle: (n: number) => `${n} shapes homozygous`,
  achAllShapesHomoDesc: (n: number) => `Breed homozygous blooms in ${n} different bloom shapes.`,

  // Monochrome set
  achMonochromeTitle: 'Monochrome',
  achMonochromeDesc: `Discover blooms in white, silver, stone gray, and anthracite.`,

  // All petal counts
  achAllCountsTitle: 'Full count',
  achAllCountsDesc: 'Discover blooms with 3, 4, 5, 6, 7, and 8 petals.',
  achAllCountsShapeTitle: (shapeLabel: string) => `Full count: ${shapeLabel}`,
  achAllCountsShapeDesc: (shapeLabel: string) => `Discover ${shapeLabel} blooms with 3, 4, 5, 6, 7, and 8 petals.`,

  // All bloom shapes in one color bucket
  achShapesInBucketTitle: (colorLabel: string) => `All shapes in ${colorLabel}`,
  achShapesInBucketDesc: (colorLabel: string) => `Discover all 5 bloom shapes in the ${colorLabel} color range.`,

  // Rich harvest
  achRichHarvestTitle: (coins: number) => `Worth ${coins} coins`,
  achRichHarvestDesc: (coins: number) => `Own a single bloom worth at least ${coins} coins.`,

  // Shared label maps
  shapeLabels: {
    round: 'Round', lanzett: 'Lanceolate', tropfen: 'Teardrop', wavy: 'Wavy', zickzack: 'Zigzag',
  } as Record<string, string>,
  colorBucketLabels,

  centerTypeLabels: {
    dot: 'Dot', disc: 'Disc', stamen: 'Stamens',
  } as Record<string, string>,

  colorLabelGradient: " gradient",

  colorLabel: {
  5: {
    hueName: `Carmine (group)`,
    90: {
      30: "Crimson",
      60: "Carmine",
      90: "Coral red",
    }
  },
  1: {
    hueName: 'White (group)',
    0: {
      100: "White"
    }
  },
  2: {
    hueName: 'Gray (group)',
    0: {
      30: "Anthracite",
      60: "Stone gray",
      90: "Silver",
    }
  },
  25: {
    hueName: `Rust (group)`,
    90: {
      30: "Rust",
      60: "Rust orange",
      90: "Apricot",
    },
  },
  350: {
    hueName: `Ruby (group)`,
    90: {
      30: "Ruby red",
      60: "Rhodolite",
      90: "Rosé",
    },
  },
  60: {
    hueName: `Yellow (group)`,
    90: {
      30: "Mustard",
      60: "Golden yellow",
      90: "Vanilla yellow",
    },
  },
  160: {
    hueName: `Emerald (group)`,
    90: {
      30: "Emerald",
      60: "Jade green",
      90: "Mint green",
    },
  },
  180: {
    hueName: `Teal (group)`,
    90: {
      30: "Deep sea teal",
      60: "Teal",
      90: "Ice blue",
    },
  },
  200: {
    hueName: `Azure (group)`,
    90: {
      30: "Petrol",
      60: "Sky blue",
      90: "Azure blue",
    },
  },
  230: {
    hueName: `Navy (group)`,
    90: {
      30: "Navy blue",
      60: "Royal blue",
      90: "Distant blue",
    },
  },
  250: {
    hueName: `Gray-violet (group)`,
    90: {
      30: "Indigo",
      60: "Dusk purple",
      90: "Mist lilac",
    },
  },
  270: {
    hueName: `Amethyst (group)`,
    90: {
      30: "Amethyst",
      60: "Amethyst lilac",
      90: "Kunzite",
    },
  },
  290: {
    hueName: `Magenta (group)`,
    90: {
      30: "Purple",
      60: "Magenta",
      90: "Silk rose",
    },
  },
  310: {
    hueName: `Fuchsia (group)`,
    90: {
      30: "Plum",
      60: "Fuchsia",
      90: "Powder pink",
    },
  },
  330: {
    hueName: `Burgundy (group)`,
    90: {
      30: "Burgundy",
      60: "Burgundy red",
      90: "Dusty rose",
    },
  },
},

completionIndexTitle: 'Completion Index',
  completionIndexSummary: (found: number, total: number) => `${found}/${total} found`,
  completionIndexUndiscovered: 'Undiscovered',

discoveryIndexTitle: 'Discovery Index',
  discoveryIndexSectionShapes: 'Petal shapes',
  discoveryIndexMatrixCount: 'Count',
  discoveryIndexMatrixCenter: 'Center',
  discoveryIndexMatrixEffect: 'Effect',
  discoveryIndexSectionColors: 'Colours',
  discoveryIndexSectionShapeColors: 'Colour × Shape',
  discoveryIndexSummary: (shapes: number, totalShapes: number, colors: number, totalColors: number) =>
    `${shapes}/${totalShapes} forms · ${colors}/${totalColors} colours`,

petalNames: {
  round: {
    3: 'Sparse Orbella',
    4: 'Small Orbella',
    5: 'Common Orbella',
    6: 'Summer Orbella',
    7: 'Rich Orbella',
    8: 'Full Orbella',
  },
  lanzett: {
    3: 'Needle Lancea',
    4: 'Slender Lancea',
    5: 'Common Lancea',
    6: 'Bold Lancea',
    7: 'Wild Lancea',
    8: 'Sky Lance',
  },
  tropfen: {
    3: 'Dew Lumaria',
    4: 'Young Lumaria',
    5: 'True Lumaria',
    6: 'Tear Lumaria',
    7: 'Rich Lumaria',
    8: 'Sun Lumaria',
  },
  wavy: {
    3: 'Light Velora',
    4: 'Gentle Velora',
    5: 'True Velora',
    6: 'Surging Velora',
    7: 'Dancing Velora',
    8: 'Grand Velora',
  },
  zickzack: {
    3: 'Splinter Wisp',
    4: 'Early Serrata',
    5: 'True Serrata',
    6: 'Sharp Wind Serrata',
    7: 'Wild Serrata',
    8: 'Thunder Crown',
  },
}
}
