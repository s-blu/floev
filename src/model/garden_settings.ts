import { DEFAULT_POT_DESIGN } from './shop'

const SETTINGS_KEY = 'floev_garden_settings'

export interface GardenSettings {
  resetDesignOnSell: boolean
  defaultDesign: { colorId: string; shape: string; effectId: string }
  emptyPotsAtEnd: boolean
}

const DEFAULTS: GardenSettings = {
  resetDesignOnSell: false,
  defaultDesign: { colorId: DEFAULT_POT_DESIGN.colorId, shape: DEFAULT_POT_DESIGN.shape, effectId: DEFAULT_POT_DESIGN.effectId ?? 'none' },
  emptyPotsAtEnd: false,
}

export function loadGardenSettings(): GardenSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return { ...DEFAULTS }
    const parsed = JSON.parse(raw) as Partial<GardenSettings>
    return {
      resetDesignOnSell: parsed.resetDesignOnSell ?? DEFAULTS.resetDesignOnSell,
      defaultDesign: { ...DEFAULTS.defaultDesign, ...(parsed.defaultDesign ?? {}) },
      emptyPotsAtEnd: parsed.emptyPotsAtEnd ?? DEFAULTS.emptyPotsAtEnd,
    }
  } catch {
    return { ...DEFAULTS }
  }
}

export function saveGardenSettings(s: GardenSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s))
}

export const gardenSettings: GardenSettings = loadGardenSettings()
