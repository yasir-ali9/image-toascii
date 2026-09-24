import { makeAutoObservable } from 'mobx'
import { FALLBACK_FONTS } from '../../fonts'
import type { EditorPreset } from '../../presets'
import { ExporterManager } from './exporter'
import { ImporterManager } from './importer'
import { LayoutManager } from './layout'
import { MotionManager } from './motion'
import { OutputManager } from './output'
import { PreviewManager } from './preview'
import { StyleManager } from './style'
import { TransformManager } from './transform'
import { TypographyManager } from './typography'

// Coordinate editor-specific state managers.
export class EditorEngine {
  exporter: ExporterManager
  importer: ImporterManager
  layout: LayoutManager
  motion: MotionManager
  output: OutputManager
  preview: PreviewManager
  style: StyleManager
  transform: TransformManager
  typography: TypographyManager

  // Create editor state managers once per provider.
  constructor() {
    this.exporter = new ExporterManager()
    this.importer = new ImporterManager()
    this.layout = new LayoutManager()
    this.motion = new MotionManager()
    this.output = new OutputManager()
    this.preview = new PreviewManager()
    this.style = new StyleManager()
    this.transform = new TransformManager()
    this.typography = new TypographyManager()
    makeAutoObservable(this, { matchesPreset: false })
  }

  // Set one curated look across every presentation-related manager.
  applyPreset(preset: EditorPreset) {
    const font = FALLBACK_FONTS.find((option) => option.id === preset.fontId) ?? FALLBACK_FONTS[0]

    this.output.setMode(preset.mode)
    this.output.setPreset(preset.map)
    this.style.setSourceColors(preset.colorMode === 'source')
    if (preset.colorMode === 'grayscale') this.style.setGrayscale(true)
    this.style.setColorTarget(preset.colorTarget)
    this.style.setForeground(preset.foreground)
    this.style.setForegroundOpacity(100)
    this.style.setBackground(preset.background)
    this.style.setBackgroundOpacity(100)
    this.style.setNegative(preset.negative)
    this.style.setBrightness(0)
    this.style.setContrast(0)
    this.transform.setFlipX(false)
    this.transform.setFlipY(false)
    this.transform.setDither(preset.dither)
    this.transform.setThreshold(preset.threshold)
    this.typography.setFont(font)
    this.typography.setFontSize(preset.fontSize)
    this.typography.setLineHeight(preset.lineHeight)
    this.typography.setLetterSpacing(preset.letterSpacing)
  }

  // Report whether the current controls still match one curated preset.
  matchesPreset(preset: EditorPreset) {
    return this.output.mode === preset.mode
      && this.output.preset === preset.map
      && this.style.colorMode === preset.colorMode
      && this.style.colorTarget === preset.colorTarget
      && this.style.foreground === preset.foreground
      && this.style.foregroundOpacity === 100
      && this.style.background === preset.background
      && this.style.backgroundOpacity === 100
      && this.style.negative === preset.negative
      && this.style.brightness === 0
      && this.style.contrast === 0
      && !this.transform.flipX
      && !this.transform.flipY
      && this.transform.dither === preset.dither
      && this.transform.threshold === preset.threshold
      && this.typography.fontId === preset.fontId
      && this.typography.fontSize === preset.fontSize
      && this.typography.lineHeight === preset.lineHeight
      && this.typography.letterSpacing === preset.letterSpacing
  }
}
