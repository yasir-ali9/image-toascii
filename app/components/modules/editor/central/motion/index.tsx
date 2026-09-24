import { useEffect, useRef } from 'react'
import type { ConversionResult } from '../../../../../lib/ascii/types'
import { createRenderScene, renderSceneFrame, type RenderStyle } from '../../../../../lib/render'
import type { MotionManager } from '../../../../../lib/stores/editor/motion'

type MotionProps = {
  motion: MotionManager
  result: ConversionResult
  style: RenderStyle
}

const PLAYHEAD_RATE = 180
const MAX_PREVIEW_FPS = 30
const MAX_PIXEL_RATIO = 1.5

// Render live motion without forcing React through frame-rate updates.
export function Motion({ motion, result, style }: MotionProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Drive the canvas directly while publishing a throttled inspector playhead.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const pixelRatio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO)
    const scene = createRenderScene(result, style, { pixelRatio })
    let frame = 0
    let lastDrawn = Number.NEGATIVE_INFINITY
    let lastPublished = 0
    let lastSignature = ''
    let startedAt = performance.now() - motion.currentTime * 1000
    let wasPlaying = motion.playing
    let seekToken = motion.seekToken
    let visible = true

    // Stop frame work when the preview leaves the visible workspace.
    const visibility = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? false
    })
    visibility.observe(canvas)

    // Paint one live frame and schedule the next browser refresh.
    const draw = (now: number) => {
      if (document.hidden || !visible) {
        frame = requestAnimationFrame(draw)
        return
      }

      const previewFps = Math.min(motion.fps, MAX_PREVIEW_FPS)
      if (now - lastDrawn < 1000 / previewFps) {
        frame = requestAnimationFrame(draw)
        return
      }
      lastDrawn = now

      if (motion.playing && !wasPlaying) startedAt = now - motion.currentTime * 1000
      if (motion.seekToken !== seekToken) {
        startedAt = now - motion.currentTime * 1000
        seekToken = motion.seekToken
      }
      wasPlaying = motion.playing

      let time = motion.currentTime

      if (motion.playing) {
        time = (now - startedAt) / 1000

        if (time >= motion.duration) {
          if (motion.loop) {
            time %= motion.duration
            startedAt = now - time * 1000
          } else {
            time = motion.duration
            motion.finish()
          }
        }

        if (now - lastPublished >= PLAYHEAD_RATE) {
          motion.setCurrentTime(time)
          lastPublished = now
        }
      }

      const signature = `${motion.effect}:${motion.intensity}:${motion.speed}:${motion.spread}:${motion.direction}:${motion.seekToken}:${time.toFixed(3)}`
      if (motion.playing || signature !== lastSignature) {
        renderSceneFrame(canvas, scene, motion, time)
        lastSignature = signature
      }
      frame = requestAnimationFrame(draw)
    }

    frame = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(frame)
      visibility.disconnect()
    }
  }, [motion, result, style])

  return <canvas aria-label="Motion preview" className="pointer-events-none absolute inset-0 h-full w-full rounded-md" ref={canvasRef} />
}
