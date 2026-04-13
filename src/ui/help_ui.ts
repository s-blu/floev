import { t } from '../model/i18n';
import { PALETTE_HUES, PALETTE_S } from '../model/genetic_model';
import { RARITY_COLORS } from '../engine/game';
import type { Rarity } from '../model/plant';

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
          <div class="help-combo-badge">
            <span class="help-combo-number">${t.helpCombos}</span>
            <span class="help-combo-label">${t.helpCombosLabel}</span>
          </div>
        </section>

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

        <!-- Rarity -->
        <section class="help-section">
          <h3 class="help-section-title">${t.helpRarityTitle}</h3>
          <p class="help-body">${t.helpRarityBody}</p>
          <div class="help-rarity-list">${buildRarityList()}</div>
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

        <!-- Gradient -->
        <section class="help-section">
          <h3 class="help-section-title">${t.helpGradientTitle}</h3>
          <p class="help-body">${t.helpGradientBody}</p>
          <div class="help-gradient-demo">${buildGradientDemo()}</div>
        </section>

        <div class="help-footer">
          <button class="help-start-btn" id="help-close">${t.helpStartBtn}</button>
        </div>

      </div>
    </div>`;
}

// ─── SVG deco flower (small, static, decorative) ──────────────────────────────

function buildDecoFlower(): string {
  const n = 6, r = 14, cx = 32, cy = 32;
  let petals = '';
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    const px = cx + Math.cos(a) * (r - 2);
    const py = cy + Math.sin(a) * r;
    petals += `<ellipse cx="${px}" cy="${py}" rx="${r * 0.62}" ry="${r * 0.38}"
      fill="hsl(300,70%,72%)" stroke="hsl(300,60%,58%)" stroke-width="0.8"
      transform="rotate(${(a * 180) / Math.PI},${px},${py})" opacity="0.9"/>`;
  }
  return `<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" overflow="visible">
    ${petals}
    <circle cx="${cx}" cy="${cy}" r="8" fill="hsl(45,100%,65%)"/>
    <circle cx="${cx - 1.5}" cy="${cy - 1.5}" r="3" fill="white" opacity="0.25"/>
  </svg>`;
}

// ─── Hue strip ────────────────────────────────────────────────────────────────

// Chromatic hues only (no achromatic sentinels)
const DISPLAY_HUES = PALETTE_HUES.filter(h => h >= 0);

// Dominance order label keys
const HUE_BUCKET_ORDER = ['white', 'yellow', 'red', 'pink', 'purple', 'blue', 'green', 'gray'] as const;

function buildHueStrip(): string {
  const swatches = DISPLAY_HUES.map(h => {
    return `<span class="help-hue-swatch" style="background:hsl(${h},${PALETTE_S}%,60%)" title="${h}°"></span>`;
  }).join('');
  // White and gray as special swatches
  const special = `
    <span class="help-hue-swatch" style="background:hsl(0,0%,97%);border-color:rgba(0,0,0,0.2)" title="Weiß"></span>
    <span class="help-hue-swatch" style="background:hsl(0,0%,72%)" title="Grau"></span>
  `;
  return `<div class="help-hue-swatches">${swatches}${special}</div>
    <div class="help-dominance-chain">${buildDominanceChain(HUE_BUCKET_ORDER.map(k => t.helpColorBucket(k)))}</div>`;
}

function buildDominanceChain(items: string[]): string {
  return items.map((item, i) => {
    const isLast = i === items.length - 1;
    return `<span class="help-dom-item${i === 0 ? ' help-dom-item--first' : ''}">${item}</span>${!isLast ? '<span class="help-dom-arrow">›</span>' : ''}`;
  }).join('');
}

// ─── Lightness swatches ───────────────────────────────────────────────────────

function buildLightnessSwatches(): string {
  const hue = 270; // purple — distinctive example color
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
  const secret = [t.helpShapeSecret, t.helpShapeSecret];

  const knownHtml = known.map(s =>
    `<div class="help-shape-card">
      <div class="help-shape-svg">${s.svg}</div>
      <span class="help-shape-label">${s.label}</span>
    </div>`
  ).join('');

  const secretHtml = secret.map(() =>
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
  { rarity: 0, icon: '▪', label: t.rarityCommon,    desc: t.helpRarityDesc(0) },
  { rarity: 1, icon: '●', label: t.rarityUncommon,  desc: t.helpRarityDesc(1) },
  { rarity: 2, icon: '♦', label: t.rarityRare,      desc: t.helpRarityDesc(2) },
  { rarity: 3, icon: '★', label: t.rarityEpic,      desc: t.helpRarityDesc(3) },
  { rarity: 4, icon: '👑', label: t.rarityLegendary, desc: t.helpRarityDesc(4) },
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

// ─── Gradient demo ────────────────────────────────────────────────────────────

function buildGradientDemo(): string {
  const hue = 200;
  return `
    <div class="help-grad-demo-row">
      <div class="help-grad-swatch" style="background:linear-gradient(135deg, hsl(${hue},${PALETTE_S}%,90%), hsl(${hue},${PALETTE_S}%,30%))"></div>
      <div class="help-grad-swatch" style="background:linear-gradient(135deg, hsl(330,${PALETTE_S}%,90%), hsl(330,${PALETTE_S}%,30%))"></div>
      <div class="help-grad-swatch" style="background:linear-gradient(135deg, hsl(60,${PALETTE_S}%,90%), hsl(60,${PALETTE_S}%,30%))"></div>
    </div>`;
}
