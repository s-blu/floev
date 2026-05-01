import { t } from '../model/i18n'
import { gardenSettings, saveGardenSettings } from '../model/garden_settings'
import { POT_COLORS, POT_SHAPES, POT_EFFECTS } from '../model/shop'
import { hasPotColor, hasPotShape, hasPotEffect } from '../engine/shop_engine'
import { renderPotShopPreview } from '../engine/renderer/pot_renderer'
import { state, render } from './ui'

// ─── Garden Settings Modal ────────────────────────────────────────────────────

export function showGardenSettings(): void {
  document.getElementById('garden-settings-modal')?.remove()

  const modal = document.createElement('div')
  modal.id = 'garden-settings-modal'
  modal.className = 'garden-settings-overlay'
  modal.innerHTML = buildModalContent()

  document.body.appendChild(modal)
  bindModalEvents(modal)

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeGardenSettings()
  })

  document.addEventListener('keydown', function esc(e) {
    if (e.key === 'Escape') { closeGardenSettings(); document.removeEventListener('keydown', esc) }
  })
}

function closeGardenSettings(): void {
  const modal = document.getElementById('garden-settings-modal')
  if (!modal) return
  modal.classList.add('garden-settings-overlay--closing')
  setTimeout(() => modal.remove(), 220)
}

// ─── Content builder ──────────────────────────────────────────────────────────

function buildModalContent(): string {
  const { resetDesignOnSell, defaultDesign, emptyPotsAtEnd } = gardenSettings
  const designSectionClass = resetDesignOnSell ? '' : ' garden-settings-section--disabled'

  const colorSwatches = POT_COLORS
    .filter(c => hasPotColor(state, c.id))
    .map(c => {
      const selected = defaultDesign.colorId === c.id
      return `<button
        class="pot-swatch${selected ? ' pot-swatch--owned' : ''}"
        data-gs-color="${c.id}"
        title="${t.potColorLabels[c.id]}"
      >
        <span class="pot-swatch-dot" style="background:${c.body};border-color:${c.rim}"></span>
        ${selected ? `<span class="pot-swatch-check">✓</span>` : ''}
      </button>`
    }).join('')

  const shapeCards = POT_SHAPES
    .filter(s => hasPotShape(state, s.id))
    .map(s => {
      const selected = defaultDesign.shape === s.id
      return `<button
        class="pot-shape-card${selected ? ' pot-shape-card--owned' : ''}"
        data-gs-shape="${s.id}"
      >
        <span class="pot-shape-preview">${renderPotShopPreview(s.id, defaultDesign.colorId)}</span>
        <span class="pot-shape-label">${t.potShapeLabels[s.id]}</span>
        ${selected ? `<span class="pot-shape-price" style="color:var(--green)">✓</span>` : ''}
      </button>`
    }).join('')

  const effectCards = POT_EFFECTS
    .filter(e => hasPotEffect(state, e.id))
    .map(e => {
      const selected = defaultDesign.effectId === e.id
      return `<button
        class="pot-shape-card${selected ? ' pot-shape-card--owned' : ''}"
        data-gs-effect="${e.id}"
      >
        <span class="pot-shape-preview">${renderPotShopPreview(defaultDesign.shape, defaultDesign.colorId, e.id)}</span>
        <span class="pot-shape-label">${t.potEffectLabels[e.id]}</span>
        ${selected ? `<span class="pot-shape-price" style="color:var(--green)">✓</span>` : ''}
      </button>`
    }).join('')

  return `
    <div class="garden-settings-box">
      <button class="help-modal-close" id="garden-settings-close" title="${t.gardenSettingsClose}">×</button>
      <div class="help-modal-scroll">
        <p class="garden-settings-heading">${t.gardenSettingsHeading}</p>

        <div class="garden-settings-section">
          <label class="garden-settings-toggle-row">
            <span class="garden-settings-toggle-label">
              <strong>${t.gardenSettingsEmptyAtEnd}</strong>
              <span class="garden-settings-desc">${t.gardenSettingsEmptyAtEndDesc}</span>
            </span>
            <input type="checkbox" id="gs-empty-at-end" class="garden-settings-checkbox" ${emptyPotsAtEnd ? 'checked' : ''}>
          </label>
        </div>

        <div class="garden-settings-section">
          <label class="garden-settings-toggle-row">
            <span class="garden-settings-toggle-label">
              <strong>${t.gardenSettingsResetOnSell}</strong>
              <span class="garden-settings-desc">${t.gardenSettingsResetOnSellDesc}</span>
            </span>
            <input type="checkbox" id="gs-reset-on-sell" class="garden-settings-checkbox" ${resetDesignOnSell ? 'checked' : ''}>
          </label>
        </div>

        <div class="garden-settings-section${designSectionClass}" id="gs-default-design-section">
          <p class="shop-section-label">${t.gardenSettingsDefaultDesign}</p>
          <p class="garden-settings-desc" style="margin-bottom:8px">${t.gardenSettingsDefaultDesignDesc}</p>
          <div class="garden-settings-preview-row">
            <div class="garden-settings-preview" id="gs-preview">
              ${renderPotShopPreview(defaultDesign.shape, defaultDesign.colorId, defaultDesign.effectId)}
            </div>
            <div class="garden-settings-pickers">
              <p class="shop-subsection-label">${t.shopSubsectionColors}</p>
              <div class="pot-color-grid" id="gs-color-grid">${colorSwatches}</div>
              <p class="shop-subsection-label" style="margin-top:10px">${t.shopSubsectionShapes}</p>
              <div class="pot-shape-row" id="gs-shape-row">${shapeCards}</div>
              <p class="shop-subsection-label" style="margin-top:10px">${t.shopSubsectionEffects}</p>
              <div class="pot-shape-row" id="gs-effect-row">${effectCards}</div>
            </div>
          </div>
        </div>
      </div>
    </div>`
}

// ─── Event binding ────────────────────────────────────────────────────────────

function bindModalEvents(modal: HTMLElement): void {
  modal.querySelector('#garden-settings-close')?.addEventListener('click', closeGardenSettings)

  modal.querySelector('#gs-empty-at-end')?.addEventListener('change', (e) => {
    gardenSettings.emptyPotsAtEnd = (e.target as HTMLInputElement).checked
    saveGardenSettings(gardenSettings)
    render()
  })

  modal.querySelector('#gs-reset-on-sell')?.addEventListener('change', (e) => {
    gardenSettings.resetDesignOnSell = (e.target as HTMLInputElement).checked
    saveGardenSettings(gardenSettings)
    const section = modal.querySelector<HTMLElement>('#gs-default-design-section')
    if (section) section.classList.toggle('garden-settings-section--disabled', !gardenSettings.resetDesignOnSell)
  })

  modal.querySelector('#gs-color-grid')?.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('[data-gs-color]') as HTMLElement | null
    if (!btn) return
    gardenSettings.defaultDesign.colorId = btn.dataset.gsColor!
    saveGardenSettings(gardenSettings)
    render()
    updateDesignPickers(modal)
  })

  modal.querySelector('#gs-shape-row')?.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('[data-gs-shape]') as HTMLElement | null
    if (!btn) return
    gardenSettings.defaultDesign.shape = btn.dataset.gsShape!
    saveGardenSettings(gardenSettings)
    render()
    updateDesignPickers(modal)
  })

  modal.querySelector('#gs-effect-row')?.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('[data-gs-effect]') as HTMLElement | null
    if (!btn) return
    gardenSettings.defaultDesign.effectId = btn.dataset.gsEffect!
    saveGardenSettings(gardenSettings)
    render()
    updateDesignPickers(modal)
  })
}

function updateDesignPickers(modal: HTMLElement): void {
  const { defaultDesign } = gardenSettings

  // Preview
  const preview = modal.querySelector<HTMLElement>('#gs-preview')
  if (preview) preview.innerHTML = renderPotShopPreview(defaultDesign.shape, defaultDesign.colorId, defaultDesign.effectId)

  // Color active states
  modal.querySelectorAll<HTMLElement>('[data-gs-color]').forEach(btn => {
    const selected = btn.dataset.gsColor === defaultDesign.colorId
    btn.classList.toggle('pot-swatch--owned', selected)
    const check = btn.querySelector('.pot-swatch-check')
    if (selected && !check) btn.insertAdjacentHTML('beforeend', '<span class="pot-swatch-check">✓</span>')
    else if (!selected && check) check.remove()
  })

  // Shape active states + re-render previews with new color
  modal.querySelectorAll<HTMLElement>('[data-gs-shape]').forEach(btn => {
    const selected = btn.dataset.gsShape === defaultDesign.shape
    btn.classList.toggle('pot-shape-card--owned', selected)
    const preview = btn.querySelector<HTMLElement>('.pot-shape-preview')
    if (preview) preview.innerHTML = renderPotShopPreview(btn.dataset.gsShape!, defaultDesign.colorId)
    const check = btn.querySelector('.pot-shape-price')
    if (check) check.innerHTML = selected ? '✓' : ''
    if (check) (check as HTMLElement).style.color = selected ? 'var(--green)' : ''
  })

  // Effect active states + re-render previews
  modal.querySelectorAll<HTMLElement>('[data-gs-effect]').forEach(btn => {
    const selected = btn.dataset.gsEffect === defaultDesign.effectId
    btn.classList.toggle('pot-shape-card--owned', selected)
    const preview = btn.querySelector<HTMLElement>('.pot-shape-preview')
    if (preview) preview.innerHTML = renderPotShopPreview(defaultDesign.shape, defaultDesign.colorId, btn.dataset.gsEffect!)
    const check = btn.querySelector('.pot-shape-price')
    if (check) check.innerHTML = selected ? '✓' : ''
    if (check) (check as HTMLElement).style.color = selected ? 'var(--green)' : ''
  })
}
