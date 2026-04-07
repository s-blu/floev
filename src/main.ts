import { loadState } from './game'
import { initUI, showMsg } from './ui'

// ─── Inject app shell ────────────────────────────────────────────────────────

const app = document.getElementById('app')!
app.innerHTML = `
<div class="game">
  <header class="game-header">
    <h1 class="game-title">Floev</h1>
    <p class="msg-bar" id="msg">Willkommen bei Floev! Pflanze einen Samen in einen leeren Topf.</p>
  </header>

  <section>
    <p class="section-title">Dein Garten</p>
    <div class="pots-row" id="pots-row"></div>
  </section>

  <section>
    <p class="section-title">Züchtung</p>
    <div class="breed-panel">
      <div class="breed-row">
        <div class="breed-slot" id="breed-a"><span>Elter 1</span></div>
        <span class="breed-op">+</span>
        <div class="breed-slot" id="breed-b"><span>Elter 2</span></div>
        <span class="breed-op">=</span>
        <div class="breed-result" id="breed-preview">Wähle zwei blühende Pflanzen aus.</div>
      </div>
      <div class="breed-footer">
        <button class="btn" id="breed-btn" disabled>Züchten</button>
        <span class="breed-hint">Ergebnis landet in einem leeren Topf</span>
      </div>
    </div>
  </section>

  <section>
    <p class="section-title">Entdeckungen (<span id="catalog-count">0</span>)</p>
    <div class="catalog-grid" id="catalog-grid">
      <span class="empty-hint">Noch keine Entdeckungen.</span>
    </div>
  </section>
</div>`

// ─── Load & start ────────────────────────────────────────────────────────────

const state = loadState()
initUI(state)

// Expose for debugging in the browser console
;(window as unknown as Record<string, unknown>).__floev__ = { state, showMsg }
