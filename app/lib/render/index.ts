import type { ConversionResult } from '../ascii/types'
import { getMotionProgress, type MotionSettings } from '../motion'
import type { OutputMode } from '../stores/editor/output'
import type { ColorTarget } from '../stores/editor/style'

export type RenderStyle = {
  background: string
  backgroundOpacity: number
  characterHeight: number
  characterWidth: number
  colorTarget: ColorTarget
  fontFamily: string
  fontSize: number
  foreground: string
  foregroundOpacity: number
  letterSpacing: number
  mode: OutputMode
  paddingBottom: number
  paddingLeft: number
  paddingRight: number
  paddingTop: number
}

export type RenderOptions = {
  contentScale?: number
  even?: boolean
  pixelRatio?: number
}

export type RenderScene = {
  background: string
  backgroundOpacity: number
  canvas: HTMLCanvasElement
  height: number
  pixelRatio: number
  width: number
}

const STATIC_MOTION: MotionSettings = {
  direction: 'forward',
  duration: 1,
  effect: 'wave',
  enabled: false,
  fps: 30,
  intensity: 0,
  loop: false,
  speed: 1,
  spread: 0,
}

// Round one dimension to a codec-safe even value when requested.
function getDimension(value: number, even: boolean) {
  const rounded = Math.max(1, Math.ceil(value))
  return even && rounded % 2 !== 0 ? rounded + 1 : rounded
}

// Keep one compositor value inside its normalized range.
function clamp(value: number) {
  return Math.min(1, Math.max(0, value))
}

// Smooth one normalized compositor value.
function smooth(value: number) {
  const amount = clamp(value)
  return amount * amount * (3 - 2 * amount)
}

// Produce deterministic slice noise without allocating frame data.
function noise(slice: number, frame: number) {
  const value = Math.sin(slice * 12.9898 + frame * 78.233) * 43758.5453
  return value - Math.floor(value)
}

// Calculate logical frame geometry without tying it to device pixel density.
export function getFrameSize(result: ConversionResult, style: RenderStyle, options: RenderOptions = {}) {
  const contentScale = options.contentScale ?? 1
  const even = options.even ?? false
  return {
    height: getDimension(result.height * style.characterHeight * contentScale + style.paddingTop + style.paddingBottom, even),
    width: getDimension(result.width * style.characterWidth * contentScale + style.paddingLeft + style.paddingRight, even),
  }
}

// Rasterize the expensive glyph layer once for reuse across motion frames.
export function createRenderScene(result: ConversionResult, style: RenderStyle, options: RenderOptions = {}): RenderScene {
  const contentScale = options.contentScale ?? 1
  const pixelRatio = options.pixelRatio ?? 1
  const size = getFrameSize(result, style, options)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(size.width * pixelRatio)
  canvas.height = Math.round(size.height * pixelRatio)

  const context = canvas.getContext('2d')
  if (!context) throw new Error('Could not create the glyph canvas')

  const characterWidth = style.characterWidth * contentScale
  const lineHeight = style.characterHeight * contentScale
  const glyphWidth = Math.max(0.1, style.characterWidth - style.letterSpacing) * contentScale
  const probe = style.mode === 'braille' ? '⣿' : '0'
  const baseFontSize = style.fontSize * contentScale

  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
  context.globalAlpha = 1
  context.filter = 'none'
  context.clearRect(0, 0, size.width, size.height)
  context.font = `${baseFontSize}px ${style.fontFamily}`
  const measuredWidth = context.measureText(probe).width
  const fontSize = baseFontSize * glyphWidth / Math.max(1, measuredWidth)
  context.font = `${fontSize}px ${style.fontFamily}`
  context.textBaseline = 'top'

  const lines = result.text.split('\n')

  // Paint each glyph and optional cell color only once.
  for (let row = 0; row < result.height; row += 1) {
    const characters = Array.from(lines[row] ?? '')

    for (let column = 0; column < result.width; column += 1) {
      const index = row * result.width + column
      const color = result.colors?.[index]
      const x = style.paddingLeft + column * characterWidth
      const y = style.paddingTop + row * lineHeight

      if (color && style.colorTarget === 'background') {
        context.globalAlpha = style.backgroundOpacity / 100
        context.fillStyle = color
        context.fillRect(x, y, characterWidth, lineHeight)
      }

      context.globalAlpha = style.foregroundOpacity / 100
      context.fillStyle = color && style.colorTarget === 'foreground' ? color : style.foreground
      context.fillText(characters[column] ?? ' ', x, y)
    }
  }

  return {
    background: style.background,
    backgroundOpacity: style.backgroundOpacity,
    canvas,
    height: canvas.height,
    pixelRatio,
    width: canvas.width,
  }
}

// Draw a cached source around its center with shared scale and opacity.
function drawCentered(context: CanvasRenderingContext2D, source: HTMLCanvasElement, scale: number, opacity: number) {
  const width = source.width
  const height = source.height
  context.save()
  context.translate(width / 2, height / 2)
  context.scale(scale, scale)
  context.globalAlpha = opacity
  context.drawImage(source, -width / 2, -height / 2)
  context.restore()
}

// Composite one deterministic motion frame from the cached glyph bitmap.
export function renderSceneFrame(canvas: HTMLCanvasElement, scene: RenderScene, motion: MotionSettings = STATIC_MOTION, time = 0) {
  if (canvas.width !== scene.width) canvas.width = scene.width
  if (canvas.height !== scene.height) canvas.height = scene.height

  const context = canvas.getContext('2d')
  if (!context) throw new Error('Could not create the render canvas')

  const source = scene.canvas
  const width = scene.width
  const height = scene.height
  const intensity = motion.intensity / 100
  const spread = motion.spread / 100
  const progress = getMotionProgress(time, motion)
  const phase = progress * Math.PI * 2 * motion.speed

  context.setTransform(1, 0, 0, 1, 0, 0)
  context.globalAlpha = 1
  context.filter = 'none'
  context.clearRect(0, 0, width, height)
  context.globalAlpha = scene.backgroundOpacity / 100
  context.fillStyle = scene.background
  context.fillRect(0, 0, width, height)
  context.globalAlpha = 1

  if (!motion.enabled) {
    context.drawImage(source, 0, 0)
    return
  }

  if (motion.effect === 'pulse') {
    const wave = Math.sin(phase)
    context.filter = `brightness(${1 + Math.max(0, wave) * intensity * 0.35})`
    drawCentered(context, source, 1 + wave * intensity * 0.045, 0.78 + (wave + 1) * 0.11)
    return
  }

  if (motion.effect === 'reveal') {
    const visible = smooth(progress * motion.speed)
    const diagonal = width * spread * 0.3
    const edge = visible * (width + diagonal * 2) - diagonal
    context.save()
    context.beginPath()
    context.moveTo(0, 0)
    context.lineTo(edge + diagonal, 0)
    context.lineTo(edge - diagonal, height)
    context.lineTo(0, height)
    context.closePath()
    context.clip()
    context.globalAlpha = 0.4 + visible * 0.6
    context.drawImage(source, 0, (1 - visible) * intensity * 8 * scene.pixelRatio)
    context.restore()
    return
  }

  if (motion.effect === 'glitch') {
    const slices = 8 + Math.round(spread * 16)
    const sliceHeight = Math.ceil(height / slices)
    const frame = Math.floor(time * motion.speed * 14)

    // Shift a small fixed number of cached horizontal slices.
    for (let slice = 0; slice < slices; slice += 1) {
      const y = slice * sliceHeight
      const sourceHeight = Math.min(sliceHeight, height - y)
      const value = noise(slice, frame)
      const active = value > 1 - intensity * 0.45
      const offset = active ? (noise(frame, slice) - 0.5) * intensity * 28 * scene.pixelRatio : 0
      context.globalAlpha = active && value > 0.94 ? 0.35 : 1
      context.drawImage(source, 0, y, width, sourceHeight, offset, y, width, sourceHeight)
    }

    context.globalAlpha = 1
    return
  }

  if (motion.effect === 'scan') {
    const bandHeight = height * (0.05 + spread * 0.28)
    const head = progress * (height + bandHeight) - bandHeight
    context.globalAlpha = 0.76
    context.filter = 'brightness(0.68)'
    context.drawImage(source, 0, 0)
    context.save()
    context.beginPath()
    context.rect(0, head, width, bandHeight)
    context.clip()
    context.globalAlpha = 1
    context.filter = `brightness(${1.05 + intensity * 0.9})`
    context.drawImage(source, 0, 0)
    context.restore()
    return
  }

  const slices = 12 + Math.round(spread * 24)
  const sliceWidth = Math.ceil(width / slices)

  // Shift cached vertical strips to form the wave field.
  for (let slice = 0; slice < slices; slice += 1) {
    const x = slice * sliceWidth
    const sourceWidth = Math.min(sliceWidth, width - x)
    const wave = Math.sin(phase + slice / slices * spread * Math.PI * 5)
    const offset = wave * intensity * 8 * scene.pixelRatio
    context.globalAlpha = 0.86 + (wave + 1) * 0.07
    context.drawImage(source, x, 0, sourceWidth, height, x, offset, sourceWidth, height)
  }

  context.globalAlpha = 1
}

// Keep the original one-call renderer for still exports and small utilities.
export function renderFrame(canvas: HTMLCanvasElement, result: ConversionResult, style: RenderStyle, motion: MotionSettings = STATIC_MOTION, time = 0, options: RenderOptions = {}) {
  const scene = createRenderScene(result, style, options)
  renderSceneFrame(canvas, scene, motion, time)
}
