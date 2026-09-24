import { makeAutoObservable } from 'mobx'
import type { OutputMode } from '../output'

const MAX_DIMENSION = 300
const MAX_PADDING = 256
const MIN_DIMENSION = 1
const PREVIEW_GUTTER = 80

// Keep one character dimension inside safe conversion bounds.
function clampDimension(value: number) {
  return Math.min(MAX_DIMENSION, Math.max(MIN_DIMENSION, Math.round(value)))
}

// Keep one padding value inside practical export bounds.
function clampPadding(value: number) {
  return Math.min(MAX_PADDING, Math.max(0, Math.round(value)))
}

// Manage output dimensions, display geometry, and outer padding.
export class LayoutManager {
  asciiCharacterWidth = 6
  brailleCharacterWidth = 6
  characterHeight = 10
  height = 40
  locked = true
  mode: OutputMode = 'ascii'
  paddingBottom = 0
  paddingLeft = 0
  paddingLinked = true
  paddingRight = 0
  paddingTop = 0
  sourceHeight = 360
  sourceWidth = 330
  viewportHeight = 0
  viewportWidth = 0
  width = 80

  // Make layout state observable and methods action-bound.
  constructor() {
    makeAutoObservable(this, {}, { autoBind: true })
    this.height = this.getHeight(this.width)
  }

  // Read the current source image ratio safely.
  get sourceRatio() {
    return this.sourceWidth / Math.max(1, this.sourceHeight)
  }

  // Read the active mode's measured glyph width.
  get characterWidth() {
    return this.mode === 'braille' ? this.brailleCharacterWidth : this.asciiCharacterWidth
  }

  // Read the measured browser glyph width-to-height ratio safely.
  get characterRatio() {
    return this.characterWidth / Math.max(1, this.characterHeight)
  }

  // Normalize alternate glyph fonts to the established ASCII preview scale.
  get previewScale() {
    return this.mode === 'braille'
      ? this.asciiCharacterWidth / Math.max(1, this.brailleCharacterWidth)
      : 1
  }

  // Read the visible character width after preview normalization.
  get previewCharacterWidth() {
    return this.characterWidth * this.previewScale
  }

  // Read the visible row height after preview normalization.
  get previewCharacterHeight() {
    return this.characterHeight * this.previewScale
  }

  // Calculate corrected character height from a width.
  private getHeight(width: number) {
    return clampDimension(Math.trunc((width / this.sourceRatio) * this.characterRatio))
  }

  // Calculate corrected character width from a height.
  private getWidth(height: number) {
    return clampDimension(Math.trunc((height * this.sourceRatio) / this.characterRatio))
  }

  // Set every padding edge to one value.
  private setAllPadding(value: number) {
    this.paddingTop = value
    this.paddingRight = value
    this.paddingBottom = value
    this.paddingLeft = value
  }

  // Switch mode geometry before generating its next preview.
  setCharacterMode(mode: OutputMode) {
    if (this.mode === mode) return
    this.mode = mode
    if (this.locked) this.height = this.getHeight(this.width)
  }

  // Update browser glyph geometry and retain the source display ratio.
  setCharacterMetrics(mode: OutputMode, width: number, height: number) {
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return
    const currentWidth = mode === 'braille' ? this.brailleCharacterWidth : this.asciiCharacterWidth
    if (Math.abs(currentWidth - width) < 0.01 && Math.abs(this.characterHeight - height) < 0.01) return

    if (mode === 'braille') this.brailleCharacterWidth = width
    else this.asciiCharacterWidth = width
    this.characterHeight = height
    if (this.locked) this.height = this.getHeight(this.width)
  }

  // Update source geometry and retain the locked output ratio.
  setSourceSize(width: number, height: number) {
    this.sourceWidth = Math.max(1, width)
    this.sourceHeight = Math.max(1, height)
    if (this.locked) this.height = this.getHeight(this.width)
  }

  // Store the usable central preview size.
  setViewport(width: number, height: number) {
    this.viewportWidth = Math.max(0, width)
    this.viewportHeight = Math.max(0, height)
  }

  // Set output width and optionally derive height.
  setWidth(width: number) {
    this.width = clampDimension(width)
    if (this.locked) this.height = this.getHeight(this.width)
  }

  // Set output height and optionally derive width.
  setHeight(height: number) {
    this.height = clampDimension(height)
    if (this.locked) this.width = this.getWidth(this.height)
  }

  // Toggle linked sizing and restore the source ratio when enabled.
  toggleLocked() {
    this.locked = !this.locked
    if (this.locked) this.height = this.getHeight(this.width)
  }

  // Toggle linked padding and synchronize edges when enabled.
  togglePaddingLinked() {
    this.paddingLinked = !this.paddingLinked
    if (this.paddingLinked) this.setAllPadding(this.paddingTop)
  }

  // Set top padding and optionally synchronize all edges.
  setPaddingTop(value: number) {
    const padding = clampPadding(value)
    if (this.paddingLinked) this.setAllPadding(padding)
    else this.paddingTop = padding
  }

  // Set horizontal padding and mirror it across left and right edges.
  setPaddingX(value: number) {
    const padding = clampPadding(value)
    if (this.paddingLinked) this.setAllPadding(padding)
    else {
      this.paddingLeft = padding
      this.paddingRight = padding
    }
  }

  // Set vertical padding and mirror it across top and bottom edges.
  setPaddingY(value: number) {
    const padding = clampPadding(value)
    if (this.paddingLinked) this.setAllPadding(padding)
    else {
      this.paddingTop = padding
      this.paddingBottom = padding
    }
  }

  // Set right padding and optionally synchronize all edges.
  setPaddingRight(value: number) {
    const padding = clampPadding(value)
    if (this.paddingLinked) this.setAllPadding(padding)
    else this.paddingRight = padding
  }

  // Set bottom padding and optionally synchronize all edges.
  setPaddingBottom(value: number) {
    const padding = clampPadding(value)
    if (this.paddingLinked) this.setAllPadding(padding)
    else this.paddingBottom = padding
  }

  // Set left padding and optionally synchronize all edges.
  setPaddingLeft(value: number) {
    const padding = clampPadding(value)
    if (this.paddingLinked) this.setAllPadding(padding)
    else this.paddingLeft = padding
  }

  // Fit corrected output dimensions inside the measured preview.
  fitToPreview() {
    if (this.viewportWidth <= 0 || this.viewportHeight <= 0) return

    const horizontalPadding = this.paddingLeft + this.paddingRight
    const verticalPadding = this.paddingTop + this.paddingBottom
    const usableWidth = Math.max(1, this.viewportWidth - PREVIEW_GUTTER - horizontalPadding)
    const usableHeight = Math.max(1, this.viewportHeight - PREVIEW_GUTTER - verticalPadding)
    const maxWidth = clampDimension(Math.floor(usableWidth / this.previewCharacterWidth))
    const maxHeight = clampDimension(Math.floor(usableHeight / this.previewCharacterHeight))
    let nextWidth = maxWidth
    let nextHeight = this.getHeight(nextWidth)

    if (nextHeight > maxHeight) {
      nextHeight = maxHeight
      nextWidth = this.getWidth(nextHeight)
    }

    this.width = nextWidth
    this.height = nextHeight
  }
}
