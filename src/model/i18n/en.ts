// ─── Floev — English UI strings ───────────────────────────────────────────────

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

  // Trait labels (pot card)
  traitGradient: '〜',

  // Homozygous / pure-line badge
  homozygousBadge: '◈',
  homozygousTitle: 'Homozygous — offspring are more predictable',

  // Allele inspect (magnifier)
  alleleInspectTitle: 'Show alleles',
  alleleHueWhite: 'white',
  alleleHueGrayDark: 'dark gray',
  alleleHueGrayMid: 'gray',
  alleleHueGrayLight: 'light gray',
  alleleOverlayTitle: 'Genetics',
  alleleOverlayHue: 'Color',
  alleleOverlayLight: 'Lightness',
  alleleOverlayShape: 'Shape',
  alleleOverlayCenter: 'Center',
  alleleOverlayEffect: 'Effect',
  alleleOverlayGradient: 'Gradient',
  alleleOverlayPetalCount: 'Petal count',
  alleleOverlayStemHeight: 'Stem height',

  // Breeding panel
  breedParent1: 'Parent 1',
  breedParent2: 'Parent 2',
  breedPrompt: 'Select two blooming plants.',
  breedBtn: 'Breed',
  breedHint: 'Result goes into an empty pot',
  breedHintNoSpace: 'No empty pot — remove a plant first.',
  breedSuccess: (gen: number) => `Seed bred! Generation ${gen}.`,
  breedNoSpace: 'No empty pot! Remove a plant first.',
  breedSlotRemoveTitle: 'Remove',

  // Breed estimate
  estPetals: (min: number, max: number) => `Petals: ${min}–${max}`,
  estGroupColor: 'Color',
  estGroupLightness: 'Lightness',
  estGroupShape: 'Shape',
  estGroupCenter: 'Center',
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
  selfPollinateWarning: 'The plant will be removed afterwards.',
  selfPollinateConfirm: 'Pollinate',
  selfPollinateCancel: 'Cancel',
  selfPollinateSuccess: (gen: number) => `Self-pollinated! Generation ${gen} seed planted.`,

  // Catalog / encyclopedia
  catalogEmpty: 'No discoveries yet.',
  catalogMetaPetals: 'Petals',
  catalogMetaCenter: 'Center',
  catalogMetaColor: 'Color',
  catalogMetaEffect: 'Effect',
  catalogMetaGen: 'Gen.',
  catalogAncestry: 'Family tree',
  catalogSelfPollinatedTitle: 'Self-pollinated',
  catalogParentUnknown: 'Unknown',
  catalogEntryNum: (n: number) => `No. ${n}`,
  catalogEntryName: (n: number) => `Bloom ${n}`,
  catalogParentName: (n: number | string) => `No. ${n}`,
  catalogParentUnknownTitle: (id: string) => `Parent unknown (${id})`,
  catalogParentGenTitle: (gen: number) => `Gen. ${gen}`,
  catalogHomozygousBadge: '◈ homozygous',

  // Sell
  btnSell: 'Sell',
  btnSellTitle: 'Sell plant — earns coins',
  msgSold: (coins: number) => `Bloom sold! +${coins} 🪙`,

  // Shop (placeholder)
  shopTab: 'Shop',
  shopComingSoon: 'Coming soon',

  // Shop sidebar
  shopSectionUpgrades: 'Upgrades',
  shopItemOwned: 'Purchased',
  shopOwnedSuffix: ' (owned)',
  shopSectionDeco: 'Pot Design',
  shopSubsectionColors: 'Unlock colors',
  shopDecoHint: 'Switch purchased designs via the 🎨 button on each pot.',
  shopSubsectionShapes: 'Unlock shapes',

  // Messages
  msgSeedPlanted: 'Seed planted!',
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
  helpLightnessDominance: 'Lightness: Dark dominates Mid dominates Light',
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
  helpSelfBody: 'With ↺ (self-pollination) a plant crosses with itself — this consumes the mother plant but produces more homozygous offspring.',
  helpHomoBody: 'Homozygous plants (◈) carry the same value on both alleles — their offspring are considerably more predictable.',

  // Other heritable traits
  helpOtherTraitsTitle: 'More traits',
  helpOtherTraitsBody: 'The genetic information also determines your plant\'s flower center, stem height, petal effects, and petal count. Discover their inheritance order and breed for them deliberately.',

  // Start button
  helpStartBtn: 'Let\'s go 🌱',

  // Help button tooltip
  helpBtnTitle: 'Help & rules',
  helpDisclaimerTitle: 'AI Usage Notice',
  helpDisclaimerText: 'This game is an AI experiment to find out how capable AI is in web development and where the limits lie. The majority of the game is written by Claude Sonnet 4.6 and reviewed by a human developer.',

  shopOpenBtnLabel: '🛒 Shop',

  helpQuickStartTitle: 'Quick Start',
  helpQuickStartItem1: 'plant random seeds',
  helpQuickStartItem2: 'unlock new features',
  helpQuickStartItem3: 'try your first crossbreeding',

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
  achColorDivTitle: (n: number) => n === 8 ? 'Full Palette' : `${n} colors`,
  achColorDivDesc: (n: number) => n === 8
    ? 'Discover blooms in all 8 color ranges (incl. white & gray).'
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

  // ─── New achievements ────────────────────────────────────────────────────────

  // Gradient fixed
  achGradFixedTitle: 'Gradient fixed',
  achGradFixedDesc: 'Discover a homozygous bloom with gradient.',

  // All shapes homozygous
  achAllShapesHomoTitle: (n: number) => `${n} shapes homozygous`,
  achAllShapesHomoDesc: (n: number) => `Breed homozygous blooms in ${n} different bloom shapes.`,

  // Full lightness (all hue-lightness combinations)
  achFullLightnessTitle: (colorLabel: string) => `${colorLabel} — all combinations`,
  achFullLightnessDesc: (colorLabel: string) => `Discover all hue-lightness combinations in the ${colorLabel} color range.`,

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
  0: {
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
      10: "Anthracite",
      40: "Stone gray",
      70: "Silver",
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
