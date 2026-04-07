# Floev 🌸

Ein entspanntes Pflanzenzucht-Spiel. Züchte, kreuze und entdecke neue Blumenarten — dynamisch gerendert aus Pflanzeneigenschaften.

## Setup

```bash
npm install
npm run dev
```

Dann im Browser öffnen: http://localhost:5173

## Projekt-Struktur

```
src/
│ └── plant.ts          # Alle TypeScript-Interfaces (Plant, Pot, GameState …)
│ └── genetics.ts       # Züchtungslogik, Selteneitsberechnung, randomPlant()
│ └── renderer.ts       # Reine Funktion: renderPlantSVG(plant, w, h) → string
│ └── game.ts           # State-Management, Phasen, localStorage-Persistenz
│ └── ui.ts             # DOM-Rendering, Event-Handling
│ └── main.ts           # Entry point — initialisiert App-Shell + UI
│ └── style.css         # Globales CSS
```

## Erweiterungspunkte

### Neue Pflanzeneigenschaft hinzufügen
1. `types/plant.ts` — Interface `Plant` erweitern
2. `genetics/genetics.ts` — `randomPlant()` und `breedPlants()` anpassen
3. `renderer/renderer.ts` — `renderPlantSVG()` nutzt die neue Eigenschaft

### Wachstumszeiten anpassen
`game/game.ts` → `PHASE_DURATION_MS`

### Weitere Töpfe
`game/game.ts` → `POT_COUNT`

### Seltenheits-Kriterien ändern
`genetics/genetics.ts` → `calcRarity()`

## Für v2 vorgemerkt
- Shop & Währung (Blumen verkaufen, Samen kaufen)
- Forschungsbaum (Upgrades für Wachstum, Töpfe, Dünger)
- Blattform am Stängel
- Mehrere Blüten pro Pflanze
- Dünger-System (Boosts für Wachstum und Mutationsrate)
