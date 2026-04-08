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
│ └── main.ts           # Entry point — initialisiert App-Shell + UI
|-engine/               # Folder; Logic of the game
│ └── breed.ts          # Logik zur Züchtung und Zuchtvorhersage
│ └── genetic.util.ts   # Helper utils zur Bestimmung von Dominanzen
│ └── genetics.ts       # Code für genetische Verteilung, randomPlant()
│ └── inheritance.ts    # Allele und sonstige Vererbungs-Logik
│ └── rarity.ts         # Seltenheitsberechnung
│ └── renderer.ts       # Reine Funktion: renderPlantSVG(plant, w, h) → string
│ └── game.ts           # State-Management, Phasen, localStorage-Persistenz
|-model/                # Folder; Interfaces and types
│ └── plant.ts          # Alle TypeScript-Interfaces (Plant, Pot, GameState …)
|-ui/                   # Folder; Logik zum Render der UI
│ └── ui.ts             # DOM-Rendering, Event-Handling
|-style/                # Folder; CSS Styles
│ └── style.css         # Globales CSS
```

## Erweiterungspunkte

### Neue Pflanzeneigenschaft hinzufügen
1. `types/plant.ts` — Interface `Plant` erweitern
2. `engine/genetics.ts` — `randomPlant()` und `breedPlants()` anpassen
3. `engine/renderer.ts` — `renderPlantSVG()` nutzt die neue Eigenschaft

### Wachstumszeiten anpassen
`engine/game.ts` → `PHASE_DURATION_MS`

### Weitere Töpfe
`engine/game.ts` → `POT_COUNT`

### Seltenheits-Kriterien ändern
`engine/genetics.ts` → `calcRarity()`

## Für v2 vorgemerkt
- Shop & Währung (Blumen verkaufen, Samen kaufen)
- Forschungsbaum (Upgrades für Wachstum, Töpfe, Dünger)
- Blattform am Stängel
- Mehrere Blüten pro Pflanze
- Dünger-System (Boosts für Wachstum und Mutationsrate)
