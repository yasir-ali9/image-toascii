import { makeAutoObservable } from 'mobx'

export type ColorMode = 'grayscale' | 'mono' | 'source'
export type ColorTarget = 'background' | 'foreground'

// Keep source tone adjustments inside the supported percentage range.
function clampTone(value: number) {
  return Math.min(100, Math.max(-100, Math.round(value)))
}

// Keep color opacity inside the supported percentage range.
function clampOpacity(value: number) {
  return Math.min(100, Math.max(0, Math.round(value)))
}

// Manage tone and color presentation settings.
export class StyleManager {
  background = '#111111'
  backgroundOpacity = 100
  brightness = 0
  colorMode: ColorMode = 'mono'
  colorTarget: ColorTarget = 'foreground'
  contrast = 0
  foreground = '#f5f5f5'
  foregroundOpacity = 100
  negative = false

  // Make style settings observable and methods action-bound.
  constructor() {
    makeAutoObservable(this, {}, { autoBind: true })
  }

  // Report whether source colors are active.
  get sourceColors() {
    return this.colorMode === 'source'
  }

  // Report whether dynamic grayscale colors are active.
  get grayscale() {
    return this.colorMode === 'grayscale'
  }

  // Toggle source colors while preserving one valid color mode.
  setSourceColors(enabled: boolean) {
    this.colorMode = enabled ? 'source' : 'mono'
  }

  // Toggle grayscale while preserving one valid color mode.
  setGrayscale(enabled: boolean) {
    this.colorMode = enabled ? 'grayscale' : 'mono'
  }

  // Toggle reversed density and dynamic colors.
  setNegative(enabled: boolean) {
    this.negative = enabled
  }

  // Set the source brightness adjustment percentage.
  setBrightness(value: number) {
    this.brightness = clampTone(value)
  }

  // Set the source contrast adjustment percentage.
  setContrast(value: number) {
    this.contrast = clampTone(value)
  }

  // Select whether dynamic color affects glyphs or their cells.
  setColorTarget(target: ColorTarget) {
    this.colorTarget = target
  }

  // Set the fixed glyph color.
  setForeground(color: string) {
    this.foreground = color
  }

  // Set the fixed glyph opacity percentage.
  setForegroundOpacity(opacity: number) {
    this.foregroundOpacity = clampOpacity(opacity)
  }

  // Set the preview surface color.
  setBackground(color: string) {
    this.background = color
  }

  // Set the preview surface opacity percentage.
  setBackgroundOpacity(opacity: number) {
    this.backgroundOpacity = clampOpacity(opacity)
  }
}
