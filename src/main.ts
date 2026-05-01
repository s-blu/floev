import { loadState } from './engine/game'
import { initUI } from './ui/ui'
import { initHelp, showHelp } from './ui/help_ui'
import { initShop, closeShop } from './ui/shop_ui'
import { initOrderBookPanel } from './ui/orders_ui'
import { initSeedDrawer } from './ui/seeds_ui'
import { initNotificationFooter } from './ui/notification_log'
import { t } from './model/i18n'
import { COIN_ICON } from './ui/icons'

// ─── Inject app shell ────────────────────────────────────────────────────────

const app = document.getElementById('app')!
app.innerHTML = `
<div class="game">
  <header class="game-header">
    <div class="header-top">
      <h1 class="game-title">${t.appTitle}</h1>
      <span class="coin-badge" id="coin-badge">${COIN_ICON} 0</span>
      <div class="header-actions">
        <button class="seed-drawer-btn" id="seed-drawer-btn" style="display:none">${t.seedDrawerButton(0)}</button>
        <button class="shop-open-btn" id="shop-open-btn" title="Shop öffnen">🛒 Shop</button>
        <button class="help-btn" id="help-btn" title="${t.helpBtnTitle}">?</button>
      </div>
    </div>
  </header>

  <section id="showcase-section" style="display:none">
    <p class="section-title">${t.sectionShowcase}</p>
    <div class="pots-row" id="showcase-row"></div>
  </section>

  <section>
    <p class="section-title">${t.sectionGarden}</p>
    <div class="pots-row" id="pots-row"></div>
  </section>

  <section>
    <p class="section-title">${t.sectionBreeding}</p>
    <div class="breed-panel">
      <div class="breed-row">
        <div class="breed-slot-col">
          <div class="breed-slot" id="breed-a"><span>${t.breedParent1}</span></div>
          <div id="breed-a-cap"></div>
        </div>
        <span class="breed-op">+</span>
        <div class="breed-slot-col">
          <div class="breed-slot" id="breed-b"><span>${t.breedParent2}</span></div>
          <div id="breed-b-cap"></div>
        </div>
        <span class="breed-op">=</span>
        <div class="breed-result" id="breed-preview">${t.breedPrompt}</div>
      </div>
      <div class="breed-footer">
        <button class="btn" id="breed-btn" disabled>${t.breedBtn}</button>
        <span class="breed-hint">${t.breedHint}</span>
      </div>
      <div id="breed-craft-actions"></div>
    </div>
  </section>

  <section class="order-section-wrapper" id="order-book-panel" style="display:none">
    <div class="ach-section-header">
      <p class="section-title" style="margin-bottom:0">
        📖 ${t.orderBookTitle}
        <span class="order-collapsed-summary"></span>
      </p>
      <button class="ach-toggle-btn order-toggle-btn" title="${t.orderBookTitle}">
        <span class="order-chevron">▾</span>
      </button>
    </div>
    <div class="order-body"></div>
  </section>

  <section class="ach-section-wrapper" id="achievements-panel">
    <div class="ach-section-header">
      <p class="section-title" style="margin-bottom:0">
        ${t.achPanelTitle}
        <span class="ach-header-count" id="ach-count">0 / 0</span>
      </p>
      <button class="ach-toggle-btn" title="${t.achPanelTitle}">
        <span class="ach-chevron">▾</span>
      </button>
    </div>
    <div class="ach-collapsed-preview"></div>
    <div class="ach-body"></div>
  </section>

  <section>
    <p class="section-title">${t.sectionDiscoveries} (<span id="catalog-count">0</span>)</p>
    <div class="catalog-grid" id="catalog-grid">
      <span class="empty-hint">${t.catalogEmpty}</span>
    </div>
  </section>
</div>`

// ─── Shop sidebar & overlay ───────────────────────────────────────────────────

document.body.insertAdjacentHTML('beforeend', `
  <div id="shop-overlay" class="shop-overlay"></div>
  <aside id="shop-sidebar" class="shop-sidebar">
    <div class="shop-sidebar-header">
      <span class="shop-sidebar-title">🛒 Shop</span>
      <button class="shop-sidebar-close" id="shop-close-btn" title="Schließen">×</button>
    </div>
    <div class="shop-sidebar-body" id="shop-sidebar-body"></div>
  </aside>
`)

// ─── Seed drawer & overlay ────────────────────────────────────────────────────

document.body.insertAdjacentHTML('beforeend', `
  <div id="seed-overlay" class="seed-overlay"></div>
  <aside id="seed-drawer" class="seed-drawer">
    <div class="seed-drawer-header">
      <span class="seed-drawer-title">${t.seedDrawerTitle}</span>
      <button class="seed-drawer-close" id="seed-drawer-close-btn" title="${t.seedDrawerClose}">×</button>
    </div>
    <div class="seed-drawer-body" id="seed-drawer-body"></div>
  </aside>
`)

// ─── Emoji support detection ─────────────────────────────────────────────────

;(function detectCoinEmoji() {
  try {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 2
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillText('🪙', -2, 2)
    if (ctx.getImageData(0, 0, 1, 1).data[3] === 0)
      document.documentElement.classList.add('no-emoji-coin')
  } catch { 
    /* canvas unavailable, assume outdated browser */ 
    document.documentElement.classList.add('no-emoji-coin')
  }
})()

// ─── Load & start ────────────────────────────────────────────────────────────

const state = loadState()
initNotificationFooter(t.welcomeMsg)
initUI(state)
initOrderBookPanel()

// Help modal — show on first visit, bind ? button
initHelp()
document.getElementById('help-btn')?.addEventListener('click', showHelp)

// Shop sidebar
initShop()
document.getElementById('shop-close-btn')?.addEventListener('click', closeShop)
document.getElementById('shop-overlay')?.addEventListener('click', closeShop)

// Seed drawer
initSeedDrawer()

;(window as unknown as Record<string, unknown>).__floev__ = { state }
