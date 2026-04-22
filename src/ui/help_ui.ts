import { t } from '../model/i18n';
import { PALETTE_HUES, PALETTE_S } from '../model/genetic_model';
import { RARITY_COLORS } from '../engine/game';
import { renderBloomSVG } from '../engine/renderer/encyclopedia_renderer';
import { plannedPlant } from '../engine/genetic/genetic';
import type { Rarity } from '../model/plant';
import { version } from '../../package.json';

// ─── Help modal ───────────────────────────────────────────────────────────────

const HELP_SEEN_KEY = 'floev_help_seen';

export function initHelp(): void {
  if (!localStorage.getItem(HELP_SEEN_KEY)) {
    showHelp();
  }
}

export function showHelp(): void {
  document.getElementById('help-modal')?.remove();

  const modal = document.createElement('div');
  modal.id = 'help-modal';
  modal.className = 'help-modal-overlay';
  modal.innerHTML = buildHelpContent();

  document.body.appendChild(modal);

  modal.querySelector('#help-close')?.addEventListener('click', () => closeHelp(modal));
  modal.querySelector('#help-start-game')?.addEventListener('click', () => closeHelp(modal));
  modal.querySelector('#help-start-game-qs')?.addEventListener('click', () => closeHelp(modal));
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeHelp(modal);
  });

  document.addEventListener('keydown', function esc(e) {
    if (e.key === 'Escape') { closeHelp(modal); document.removeEventListener('keydown', esc); }
  });
}

function closeHelp(modal: HTMLElement): void {
  modal.classList.add('help-modal--closing');
  setTimeout(() => modal.remove(), 220);
  localStorage.setItem(HELP_SEEN_KEY, '1');
}

// ─── Content builders ─────────────────────────────────────────────────────────

function buildHelpContent(): string {
  return `
    <div class="help-modal-box">
      <button class="help-modal-close" id="help-close" title="${t.helpClose}">×</button>

      <div class="help-modal-scroll">

        <!-- Header -->
        <div class="help-header">
          <div class="help-flower-deco" aria-hidden="true">${buildDecoFlower()}</div>
          <h2 class="help-title">${t.helpTitle}</h2>
          <p class="help-subtitle">${t.helpSubtitle}</p>
        </div>

        <!-- Intro -->
        <section class="help-section">
          <p class="help-body">${t.helpIntro1}</p>
          <p class="help-body">${t.helpIntro2}</p>
        </section>

        <!-- Quick Start -->
        <div class="help-quickstart">
          <span class="help-quickstart-title">${t.helpQuickStartTitle}</span>
          <div class="help-qs-row">
            <span class="help-qs-btn help-qs-btn--plant">${t.btnPlant}</span>
            <span class="help-qs-text">${t.helpQuickStartItem1}</span>
          </div>
          <div class="help-qs-row">
            <span class="help-qs-btn help-qs-btn--shop">${t.shopOpenBtnLabel}</span>
            <span class="help-qs-text">${t.helpQuickStartItem2}</span>
          </div>
          <div class="help-qs-row">
            <span class="help-qs-btn help-qs-btn--breed">${t.breedBtn}</span>
            <span class="help-qs-text">${t.helpQuickStartItem3}</span>
          </div>
          <button class="help-start-btn help-qs-start-btn" id="help-start-game-qs">${t.helpStartBtn}</button>
        </div>

        <div class="help-disclaimer">
          <strong class="help-disclaimer-title">${t.helpDisclaimerTitle}</strong>
          <p class="help-disclaimer-text">${t.helpDisclaimerText}</p>
        </div>

        <hr class="help-divider" />

        <!-- Colors -->
        <section class="help-section">
          <h3 class="help-section-title">${t.helpColorsTitle}</h3>
          <p class="help-body">${t.helpColorsBody}</p>
          <div class="help-hue-strip">${buildHueStrip()}</div>
          <p class="help-caption">${t.helpColorsDominance}</p>
          <div class="help-lightness-row">${buildLightnessSwatches()}</div>
          <p class="help-caption">${t.helpLightnessDominance}</p>
        </section>

        <hr class="help-divider" />

        <!-- Shapes -->
        <section class="help-section">
          <h3 class="help-section-title">${t.helpShapesTitle}</h3>
          <p class="help-body">${t.helpShapesBody}</p>
          <div class="help-shapes-row">${buildShapeCards()}</div>
          <p class="help-caption">${t.helpShapesDominance}</p>
        </section>

        <hr class="help-divider" />

        <!-- Other heritable traits -->
        <section class="help-section">
          <h3 class="help-section-title">${t.helpOtherTraitsTitle}</h3>
          <p class="help-body">${t.helpOtherTraitsBody}</p>
        </section>

        <hr class="help-divider" />

        <!-- Breeding -->
        <section class="help-section">
          <h3 class="help-section-title">${t.helpBreedTitle}</h3>
          <p class="help-body">${t.helpBreedBody}</p>
          <div class="help-breed-steps">${buildBreedSteps()}</div>
          <p class="help-body">${t.helpSelfBody}</p>
          <p class="help-body">${t.helpHomoBody}</p>
        </section>

        <hr class="help-divider" />

        <!-- Rarity -->
        <section class="help-section">
          <h3 class="help-section-title">${t.helpRarityTitle}</h3>
          <p class="help-body">${t.helpRarityBody}</p>
          <div class="help-rarity-list">${buildRarityList()}</div>
        </section>

        <div class="help-footer">
          <button class="help-start-btn" id="help-start-game">${t.helpStartBtn}</button>
          <p class="help-version">v${version}</p>
        </div>

      </div>
    </div>`;
}

// ─── Deco flower using encyclopedia renderer ──────────────────────────────────

function buildDecoFlower(): string {
  const plant = plannedPlant({
    hue: 300,
    lightness: 90,
    petalShape: 'round',
    petalEffect: 'none',
    petalCount: 5,
  });
  return renderBloomSVG(plant, 64, 64);
}

// ─── Hue strip ────────────────────────────────────────────────────────────────

// Chromatic hues only (no achromatic sentinels)
const DISPLAY_HUES = PALETTE_HUES.filter(h => h >= 0);

// The actual dominance order for the current model buckets.
// gray, purple, blue are the rarest (= most recessive) buckets — shown as secrets.
const HUE_BUCKET_ORDER = ['white', 'yellowgreen', 'red', 'pink', 'purple', 'blue', 'gray'] as const;

// Buckets that are hidden/secret in the help UI
const SECRET_BUCKETS = new Set(['gray', 'purple', 'blue']);

function buildHueStrip(): string {
  // Group chromatic hues by bucket for visual display
  // Rare/secret buckets show a "?" swatch instead of the actual color

  // Build swatch per bucket in dominance order (skip white for the color row, add at end)
  const bucketSwatches = HUE_BUCKET_ORDER.map(bucket => {
    if (bucket === 'white') {
      return `<span class="help-hue-swatch" style="background:hsl(0,0%,97%);border-color:rgba(0,0,0,0.2)" title="Weiß"></span>`;
    }
    if (SECRET_BUCKETS.has(bucket)) {
      return `<span class="help-hue-swatch help-hue-swatch--secret" title="?">?</span>`;
    }
    // Pick a representative hue for the bucket
    const repHue = DISPLAY_HUES.find(h => bucketContains(bucket, h)) ?? 0;
    const label = t.colorBucketLabels[bucket]
    return `<span class="help-hue-swatch" style="background:hsl(${repHue},${PALETTE_S}%,60%)" title="${label}"></span>`;
  }).join('');

  // Build dominance chain: known buckets named, secret ones as "?"
  const chainLabels = HUE_BUCKET_ORDER.map(k =>
    SECRET_BUCKETS.has(k) ? '?' : t.colorBucketLabels[k]
  );

  return `
    <p class="help-caption" style="margin-bottom:6px">${t.helpColorBucketsExplain}</p>
    <div class="help-hue-swatches">${bucketSwatches}</div>
    <div class="help-dominance-chain">${buildDominanceChain(chainLabels)}</div>`;
}

function bucketContains(bucket: string, hue: number): boolean {
  switch (bucket) {
    case 'yellowgreen': return hue > 25 && hue <= 175;
    case 'red':         return hue <= 25 || hue > 345;
    case 'pink':        return hue > 275 && hue <= 345;
    case 'purple':      return hue > 245 && hue <= 275;
    case 'blue':        return hue > 175 && hue <= 245;
    default:            return false;
  }
}

function buildDominanceChain(items: string[]): string {
  return items.map((item, i) => {
    const isLast = i === items.length - 1;
    const isSecret = item === '?';
    return `<span class="help-dom-item${i === 0 ? ' help-dom-item--first' : ''}${isSecret ? ' help-dom-item--secret' : ''}">${item}</span>${!isLast ? '<span class="help-dom-arrow">›</span>' : ''}`;
  }).join('');
}

// ─── Lightness swatches ───────────────────────────────────────────────────────

function buildLightnessSwatches(): string {
  const hue = 310; // pink — clear example color
  const levels: [number, string][] = [
    [30, t.helpLightnessDark],
    [60, t.helpLightnessMid],
    [90, t.helpLightnessLight],
  ];
  return levels.map(([l, label]) =>
    `<div class="help-lightness-chip">
      <span class="help-lightness-swatch" style="background:hsl(${hue},${PALETTE_S}%,${l}%)"></span>
      <span class="help-lightness-label">${label}</span>
    </div>`
  ).join('');
}

// ─── Shape cards ─────────────────────────────────────────────────────────────

function buildShapeCards(): string {
  const known: { name: string; label: string; svg: string }[] = [
    { name: 'round',   label: t.shapeRound,   svg: buildShapeSVG('round') },
    { name: 'lanzett', label: t.shapeLanzett, svg: buildShapeSVG('lanzett') },
    { name: 'tropfen', label: t.shapeDrop,    svg: buildShapeSVG('tropfen') },
  ];

  const knownHtml = known.map(s =>
    `<div class="help-shape-card">
      <div class="help-shape-svg">${s.svg}</div>
      <span class="help-shape-label">${s.label}</span>
    </div>`
  ).join('');

  const secretHtml = [0, 1].map(() =>
    `<div class="help-shape-card help-shape-card--secret">
      <div class="help-shape-svg help-shape-svg--secret">?</div>
      <span class="help-shape-label">${t.helpShapeSecretLabel}</span>
    </div>`
  ).join('');

  return knownHtml + secretHtml;
}

// Minimal inline SVG per petal shape (single petal, top-centered)
function buildShapeSVG(shape: 'round' | 'lanzett' | 'tropfen'): string {
  const w = 40, h = 44, cx = 20, cy = 38;
  let path = '';
  const fill = 'hsl(330,80%,72%)';
  const stroke = 'hsl(330,70%,55%)';
  const sw = 'stroke-width="0.8"';

  if (shape === 'round') {
    path = `<ellipse cx="${cx}" cy="${cy - 14}" rx="12" ry="8.5" fill="${fill}" stroke="${stroke}" ${sw}/>`;
  } else if (shape === 'lanzett') {
    path = `<path d="M${cx},${cy - 2} C${cx + 4},${cy - 16} ${cx},${cy - 30} ${cx},${cy - 30} C${cx},${cy - 30} ${cx - 4},${cy - 16} ${cx},${cy - 2} Z" fill="${fill}" stroke="${stroke}" ${sw}/>`;
  } else {
    path = `<path d="M${cx},${cy - 2} C${cx + 10},${cy - 14} ${cx},${cy - 32} ${cx},${cy - 32} C${cx},${cy - 32} ${cx - 10},${cy - 14} ${cx},${cy - 2} Z" fill="${fill}" stroke="${stroke}" ${sw}/>`;
  }
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">${path}</svg>`;
}

// ─── Rarity list ──────────────────────────────────────────────────────────────

const RARITY_META: { rarity: Rarity; icon: string; label: string; desc: string }[] = [
  { rarity: 0, icon: '▪', label: t.rarity.common,    desc: t.helpRarityDesc(0) },
  { rarity: 1, icon: '●', label: t.rarity.uncommon,  desc: t.helpRarityDesc(1) },
  { rarity: 2, icon: '♦', label: t.rarity.rare,      desc: t.helpRarityDesc(2) },
  { rarity: 3, icon: '★', label: t.rarity.epic,      desc: t.helpRarityDesc(3) },
  { rarity: 4, icon: '👑', label: t.rarity.legendary, desc: t.helpRarityDesc(4) },
];

function buildRarityList(): string {
  return RARITY_META.map(r =>
    `<div class="help-rarity-row">
      <span class="help-rarity-icon" style="color:${RARITY_COLORS[r.rarity]}">${r.icon}</span>
      <span class="help-rarity-name" style="color:${RARITY_COLORS[r.rarity]}">${r.label}</span>
      <span class="help-rarity-desc">${r.desc}</span>
    </div>`
  ).join('');
}

// ─── Breed steps ──────────────────────────────────────────────────────────────

function buildBreedSteps(): string {
  const steps = [t.helpBreedStep1, t.helpBreedStep2, t.helpBreedStep3, t.helpBreedStep4];
  return steps.map((step, i) =>
    `<div class="help-breed-step">
      <span class="help-breed-num">${i + 1}</span>
      <span class="help-breed-text">${step}</span>
    </div>`
  ).join('');
}
