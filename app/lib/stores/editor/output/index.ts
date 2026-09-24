import { makeAutoObservable } from 'mobx'

export const SIMPLE_MAP = ' .:-=+*#%@'
export const DETAILED_MAP = ' .\'`^",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$'

export type OutputMode = 'ascii' | 'braille'
export type MapPreset = 'custom' | 'detailed' | 'simple'

// Manage the selected text format and density map.
export class OutputManager {
  customMap = ' .-=+#@'
  mode: OutputMode = 'ascii'
  preset: MapPreset = 'simple'

  // Make output settings observable and methods action-bound.
  constructor() {
    makeAutoObservable(this, {}, { autoBind: true })
  }

  // Resolve the character map used by the converter.
  get characterMap() {
    if (this.preset === 'detailed') return DETAILED_MAP
    if (this.preset === 'custom') return Array.from(this.customMap).length >= 2 ? this.customMap : SIMPLE_MAP
    return SIMPLE_MAP
  }

  // Report whether the custom map can represent multiple densities.
  get customMapValid() {
    return Array.from(this.customMap).length >= 2
  }

  // Select the generated text format.
  setMode(mode: OutputMode) {
    this.mode = mode
  }

  // Select a built-in or editable density map.
  setPreset(preset: MapPreset) {
    this.preset = preset
  }

  // Store the custom map exactly as entered, including spaces.
  setCustomMap(map: string) {
    this.customMap = map
  }
}
