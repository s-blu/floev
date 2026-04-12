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
│ └── rarity.ts         # Seltenheitsberechnung
│ └── game.ts           # State-Management, Phasen, localStorage-Persistenz
│ └── genetic/                     # Folder; Logik zur Vererbung
│     └── genetic.ts               # Code für genetische Verteilung, randomPlant()
│     └── dominance_utils.ts       # Helpers, um dominante Eigenschaften zu bestimmen 
│     └── dominance_utils.ts       # Helpers, um expressed & andere Eigenschaften zu bestimmen
|     └── inheritance.ts           # Inheritance-Logik
│ └── renderer/                    # Folder; Logik zum rendern der SVGs
│     └── renderer.ts              # Hauptrendering der Blumen
│     └── encyclopedia_renderer.ts # Blumenrendering für die Enzyklopädie
│     └── petal_renderer.ts        # Rendering der verschiedenen Blütenarten
│     └── center_renderer.ts       # Rendering der verschiedenen CenterTypes
│     └── renderer_utils.ts        # Helper functions für SVG Renderings
|-model/                # Folder; Interfaces and types
│ └── plant.ts          # Alle TypeScript-Interfaces (Plant, Pot, GameState …)
│ └── i18n/             # ui labels for the app
│     └── index.ts      # central translation key export file 
│     └── de.ts         # DE translations
│     └── ...           # translations for other languages, named after their 2 digit locale
|-ui/                   # Folder; Logik zum Render der UI
│ └── ui.ts             # Hauptfunktion für DOM Rendering, Event handling
│ └── breedpanel_ui.ts     # UI für Züchtungspanel
│ └── breedestimate_ui.ts  # UI für Kreuzungsvorhersage
│ └── catalog_ui.ts           # UI für Enzyklopädie /Catalog
│ └── pots_ui.ts              # UI für Pflanztöpfe
|-style/                      # Folder; CSS Styles
│ └── style.css               # Globales CSS
│ └── style_breed.css         # Styles für das Züchtungspanel
│ └── style_encyclopedia.css  # Styles für den Katalog/die Enzyklopädie 
│ └── style_pots.css          # Styles für die Anzuchtstöpfe 
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
