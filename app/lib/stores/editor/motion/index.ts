import { makeAutoObservable } from 'mobx'
import type { MotionDirection, MotionEffect, MotionSettings } from '../../../motion'

const FPS_OPTIONS = [12, 24, 30, 60] as const

// Keep one numeric setting inside its supported range.
function clamp(value: number, min: number, max: number, precision = 0) {
  const factor = 10 ** precision
  return Math.round(Math.min(max, Math.max(min, value)) * factor) / factor
}

// Manage procedural animation settings and shared playback state.
export class MotionManager {
  currentTime = 0
  direction: MotionDirection = 'forward'
  duration = 4
  effect: MotionEffect = 'glitch'
  enabled = false
  fps: number = 30
  intensity = 60
  loop = true
  playing = false
  speed = 1
  spread = 55
  seekToken = 0

  // Make motion settings observable and bind controls once.
  constructor() {
    makeAutoObservable(this, {}, { autoBind: true })
  }

  // Publish immutable settings for rendering and export jobs.
  get snapshot(): MotionSettings {
    return {
      direction: this.direction,
      duration: this.duration,
      effect: this.effect,
      enabled: this.enabled,
      fps: this.fps,
      intensity: this.intensity,
      loop: this.loop,
      speed: this.speed,
      spread: this.spread,
    }
  }

  // Enable or disable motion without discarding configured values.
  setEnabled(enabled: boolean) {
    this.enabled = enabled
    this.playing = enabled
    if (enabled && this.currentTime >= this.duration) this.restart()
  }

  // Select one procedural cell effect.
  setEffect(effect: MotionEffect) {
    this.effect = effect
  }

  // Set the clip duration in seconds.
  setDuration(duration: number) {
    this.duration = clamp(duration, 0.5, 12, 1)
    this.currentTime = Math.min(this.currentTime, this.duration)
    this.seekToken += 1
  }

  // Select a supported export frame rate.
  setFps(fps: number) {
    this.fps = FPS_OPTIONS.includes(fps as typeof FPS_OPTIONS[number]) ? fps : 30
  }

  // Set the strength shared by all effects.
  setIntensity(intensity: number) {
    this.intensity = clamp(intensity, 0, 100)
  }

  // Set effect phase speed without changing clip duration.
  setSpeed(speed: number) {
    this.speed = clamp(speed, 0.25, 3, 2)
  }

  // Set cell-to-cell phase separation.
  setSpread(spread: number) {
    this.spread = clamp(spread, 0, 100)
  }

  // Set clip playback direction.
  setDirection(direction: MotionDirection) {
    this.direction = direction
  }

  // Set whether live playback returns to its first frame.
  setLoop(loop: boolean) {
    this.loop = loop
  }

  // Set the shared playhead to a valid clip time.
  setCurrentTime(time: number) {
    this.currentTime = clamp(time, 0, this.duration, 3)
  }

  // Move the playhead from an explicit user interaction.
  seek(time: number) {
    this.setCurrentTime(time)
    this.seekToken += 1
  }

  // Start playback and rewind a finished non-looping clip.
  play() {
    if (!this.enabled) this.enabled = true
    if (this.currentTime >= this.duration) {
      this.currentTime = 0
      this.seekToken += 1
    }
    this.playing = true
  }

  // Hold the playhead at its current frame.
  pause() {
    this.playing = false
  }

  // Return to the first frame while preserving playback state.
  restart() {
    this.currentTime = 0
    this.seekToken += 1
  }

  // Finish a non-looping clip at its exact terminal frame.
  finish() {
    this.currentTime = this.duration
    this.playing = false
  }
}
