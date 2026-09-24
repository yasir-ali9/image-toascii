export type MotionDirection = 'alternate' | 'forward' | 'reverse'
export type MotionEffect = 'glitch' | 'pulse' | 'reveal' | 'scan' | 'wave'

export type MotionSettings = {
  direction: MotionDirection
  duration: number
  effect: MotionEffect
  enabled: boolean
  fps: number
  intensity: number
  loop: boolean
  speed: number
  spread: number
}

export type CellMotion = {
  brightness: number
  opacity: number
  scale: number
  x: number
  y: number
}

const TAU = Math.PI * 2

// Keep a calculated value between two inclusive limits.
function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value))
}

// Smooth one normalized value without introducing sharp velocity changes.
function smooth(value: number) {
  const amount = clamp(value)
  return amount * amount * (3 - 2 * amount)
}

// Produce repeatable cell noise for frame-accurate preview and export parity.
function noise(column: number, row: number, frame: number) {
  const value = Math.sin(column * 12.9898 + row * 78.233 + frame * 37.719) * 43758.5453
  return value - Math.floor(value)
}

// Resolve directional clip progress while keeping its terminal frame stable.
export function getMotionProgress(time: number, settings: MotionSettings) {
  const base = clamp(time / Math.max(0.1, settings.duration))
  if (settings.direction === 'reverse') return 1 - base
  if (settings.direction === 'alternate') return base <= 0.5 ? base * 2 : (1 - base) * 2
  return base
}

// Resolve one cell's visual transform for the selected procedural effect.
export function getCellMotion(column: number, row: number, width: number, height: number, time: number, settings: MotionSettings): CellMotion {
  if (!settings.enabled) return { brightness: 1, opacity: 1, scale: 1, x: 0, y: 0 }

  const normalizedX = width <= 1 ? 0 : column / (width - 1)
  const normalizedY = height <= 1 ? 0 : row / (height - 1)
  const intensity = settings.intensity / 100
  const spread = settings.spread / 100
  const progress = getMotionProgress(time, settings)
  const phase = progress * TAU * settings.speed

  if (settings.effect === 'reveal') {
    const delay = (normalizedX * 0.7 + normalizedY * 0.3) * spread * 0.82
    const revealProgress = clamp(progress * settings.speed)
    const visible = smooth((revealProgress - delay) / Math.max(0.08, 1 - spread * 0.82))
    return {
      brightness: 0.7 + visible * 0.3,
      opacity: visible,
      scale: 0.92 + visible * 0.08,
      x: 0,
      y: (1 - visible) * intensity * 12,
    }
  }

  if (settings.effect === 'pulse') {
    const wave = Math.sin(phase + (normalizedX + normalizedY) * spread * TAU * 2)
    return {
      brightness: 1 + Math.max(0, wave) * intensity * 0.45,
      opacity: 0.68 + (wave + 1) * 0.16,
      scale: 1 + wave * intensity * 0.16,
      x: 0,
      y: 0,
    }
  }

  if (settings.effect === 'glitch') {
    const frame = Math.floor(time * settings.speed * 14)
    const value = noise(column, row, frame)
    const active = value > 1 - intensity * 0.38
    const displacement = active ? (noise(row, frame, column) - 0.5) * intensity * 24 : 0
    return {
      brightness: active ? 1.25 + value * 0.45 : 1,
      opacity: active && value > 0.94 ? 0.18 : 1,
      scale: active ? 0.96 + value * 0.08 : 1,
      x: displacement,
      y: active ? (noise(frame, column, row) - 0.5) * intensity * 5 : 0,
    }
  }

  if (settings.effect === 'scan') {
    const band = 0.06 + spread * 0.3
    const head = progress * (1 + band * 2) - band
    const glow = clamp(1 - Math.abs(normalizedY - head) / band)
    return {
      brightness: 0.72 + glow * intensity * 1.05,
      opacity: 0.38 + glow * 0.62,
      scale: 1,
      x: Math.sin(phase + normalizedY * 18) * glow * intensity * 2,
      y: 0,
    }
  }

  const wave = Math.sin(phase + normalizedX * spread * TAU * 2.5 + normalizedY * spread * TAU)
  return {
    brightness: 0.88 + (wave + 1) * intensity * 0.12,
    opacity: 0.78 + (wave + 1) * 0.11,
    scale: 1,
    x: 0,
    y: wave * intensity * 10,
  }
}
