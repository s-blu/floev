# Floev 🌸

Ein entspanntes Pflanzenzucht-Spiel. Züchte, kreuze und entdecke neue Blumenarten — dynamisch gerendert aus Pflanzeneigenschaften.

## KI Nutzung 

Dieses Spiel wurde großteils mithilfe von Claude Sonnet 4.6 geschrieben, als Experiment, wozu KI Stand April 2026 in der Lage ist und wo ihre Grenzen liegen. Der Code wurde anschließend von mir überprüft. Mein Eindruck: KI kann erschreckend viel, wiederholt aber auch immer die selben Fehler.

- Kann Features einigermaßen zuverlässig hinzufügen, erzeugt selten offensichtliche Bugs
- Code ist durchgängig ausführbar
- Wiederholt selbe Bad Practices: Hardcoded Übersetzungen, Magic Numbers, Code repetition, !important im css
- Ist schlecht im refactoring, insb. beim Lösen von Typescript-Errors (Nutzt unsinnige Quick Fixes, statt dem Kern des Problems nachzugehen; castet Variablennutzungen mehrfach statt der Variable)
- Fährt sich bei schwammigen Bugbeschreibungen schnell fest und verschleudert dann Tokens, um die (fehlerhafte) Nutzerbeschreibung und den Code übereinanderzubringen

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
│ └── achievements.ts              # Logic für das Achievement Panel
│ └── achievement_defs.ts          # Achievement Definition & Checklogik
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
│     └── plant_renderer.ts        # Rendering der Pflanzenphasen (inkl fullBloom)
│     └── pot_renderer.ts          # Rendering der Töpfe
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
│ └── achievement_ui.ts       # UI für das Achievement Panel
|-style/                      # Folder; CSS Styles
│ └── style.css               # Globales CSS
│ └── style_breed.css         # Styles für das Züchtungspanel
│ └── style_encyclopedia.css  # Styles für den Katalog/die Enzyklopädie 
│ └── style_pots.css          # Styles für die Anzuchtstöpfe 
│ └── style_help.css          # Styles für das Hilfe-Popup 
│ └── style_achievements.css  # Styles für das Achievement Panel 
```

## Erweiterungspunkte


## Für v2 vorgemerkt
- Shop & Währung (Blumen verkaufen, Samen kaufen)
- Forschungsbaum (Upgrades für Wachstum, Töpfe, Dünger)
- Blattform am Stängel
- Mehrere Blüten pro Pflanze
- Dünger-System (Boosts für Wachstum und Mutationsrate)
