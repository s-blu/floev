import { loadState } from './engine/game'
import { initUI, showMsg } from './ui/ui'
import { initHelp, showHelp, initFavicon } from './ui/help_ui'
import { initShop, closeShop } from './ui/shop_ui'
import { initOrderBookPanel } from './ui/orders_ui'
import { t } from './model/i18n'

// ─── Inject app shell ────────────────────────────────────────────────────────

const app = document.getElementById('app')!
app.innerHTML = `
<div class="game">
  <header class="game-header">
    <div class="header-top">
      <h1 class="game-title">${t.appTitle}</h1>
      <div class="header-actions">
        <span class="coin-badge" id="coin-badge">🪙 0</span>
        <button class="shop-open-btn" id="shop-open-btn" title="Shop öffnen">🛒 Shop</button>
        <button class="help-btn" id="help-btn" title="${t.helpBtnTitle}">?</button>
      </div>
    </div>
    <p class="msg-bar" id="msg">${t.welcomeMsg}</p>
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
        <div class="breed-slot" id="breed-a"><span>${t.breedParent1}</span></div>
        <span class="breed-op">+</span>
        <div class="breed-slot" id="breed-b"><span>${t.breedParent2}</span></div>
        <span class="breed-op">=</span>
        <div class="breed-result" id="breed-preview">${t.breedPrompt}</div>
      </div>
      <div class="breed-footer">
        <button class="btn" id="breed-btn" disabled>${t.breedBtn}</button>
        <span class="breed-hint">${t.breedHint}</span>
      </div>
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

// ─── Load & start ────────────────────────────────────────────────────────────

const state = loadState()
initUI(state)
initOrderBookPanel()

initFavicon()

// Help modal — show on first visit, bind ? button
initHelp()
document.getElementById('help-btn')?.addEventListener('click', showHelp)

// Shop sidebar
initShop()
document.getElementById('shop-close-btn')?.addEventListener('click', closeShop)
document.getElementById('shop-overlay')?.addEventListener('click', closeShop)

;(window as unknown as Record<string, unknown>).__floev__ = { state, showMsg }
