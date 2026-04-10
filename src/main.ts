import { loadState } from './engine/game'
import { initUI, showMsg } from './ui/ui'
import { t } from './model/i18n'

// ─── Inject app shell ────────────────────────────────────────────────────────

const app = document.getElementById('app')!
app.innerHTML = `
<div class="game">
  <header class="game-header">
    <h1 class="game-title">${t.appTitle}</h1>
    <p class="msg-bar" id="msg">${t.welcomeMsg}</p>
  </header>

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

  <section>
    <p class="section-title">${t.sectionDiscoveries} (<span id="catalog-count">0</span>)</p>
    <div class="catalog-grid" id="catalog-grid">
      <span class="empty-hint">${t.catalogEmpty}</span>
    </div>
  </section>
</div>`

// ─── Load & start ────────────────────────────────────────────────────────────

const state = loadState()
initUI(state)

;(window as unknown as Record<string, unknown>).__floev__ = { state, showMsg }
