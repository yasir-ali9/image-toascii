import { makeAutoObservable } from 'mobx'

// Keep one Braille threshold inside the supported byte range.
function clampThreshold(value: number) {
  return Math.min(255, Math.max(0, Math.round(value)))
}

// Manage pixel-grid transforms and Braille detail controls.
export class TransformManager {
  dither = false
  flipX = false
  flipY = false
  threshold = 128

  // Make transform settings observable and methods action-bound.
  constructor() {
    makeAutoObservable(this, {}, { autoBind: true })
  }

  // Toggle horizontal pixel order.
  setFlipX(enabled: boolean) {
    this.flipX = enabled
  }

  // Toggle vertical pixel order.
  setFlipY(enabled: boolean) {
    this.flipY = enabled
  }

  // Toggle Floyd–Steinberg dot dithering.
  setDither(enabled: boolean) {
    this.dither = enabled
  }

  // Set the Braille dot visibility cutoff.
  setThreshold(value: number) {
    this.threshold = clampThreshold(value)
  }
}
