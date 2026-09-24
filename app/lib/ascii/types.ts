import type { OutputMode } from '../stores/editor/output'
import type { ColorMode } from '../stores/editor/style'

export type ConversionResult = {
  colors: string[] | null
  height: number
  text: string
  width: number
}

export type ConversionOptions = {
  brightness: number
  colorMode: ColorMode
  contrast: number
  dither: boolean
  flipX: boolean
  flipY: boolean
  map: string
  mode: OutputMode
  negative: boolean
  threshold: number
}
