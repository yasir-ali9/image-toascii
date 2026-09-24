import type { ConversionResult } from '../ascii/types'
import { downloadBlob } from '../export'
import type { MotionSettings } from '../motion'
import { createRenderScene, getFrameSize, renderSceneFrame, type RenderStyle } from '../render'

const BASE_SCALE = 1.6
const MAX_VIDEO_SIDE = 1920

type VideoOptions = {
  cancelled?: () => boolean
  progress?: (value: number) => void
}

// Select a render scale that stays inside practical browser encoder limits.
function getVideoScale(result: ConversionResult, style: RenderStyle) {
  const base = getFrameSize(result, style, { contentScale: BASE_SCALE })
  const ratio = Math.min(1, MAX_VIDEO_SIDE / Math.max(base.width, base.height))
  return BASE_SCALE * ratio
}

// Render, encode, mux, and download one silent H.264 MP4 locally.
export async function downloadVideo(result: ConversionResult, style: RenderStyle, motion: MotionSettings, filename: string, options: VideoOptions = {}) {
  const { BufferTarget, CanvasSource, Mp4OutputFormat, Output, Quality, canEncodeVideo } = await import('mediabunny')
  const canvas = document.createElement('canvas')
  const contentScale = getVideoScale(result, style)
  const frameSize = getFrameSize(result, style, { contentScale, even: true })
  const quality = new Quality('high')
  const supported = await canEncodeVideo('avc', {
    height: frameSize.height,
    quality,
    width: frameSize.width,
  })

  if (!supported) throw new Error('This browser cannot encode H.264 MP4 video')

  const scene = createRenderScene(result, style, { contentScale, even: true })
  renderSceneFrame(canvas, scene, motion, 0)

  const target = new BufferTarget()
  const output = new Output({ format: new Mp4OutputFormat(), target })
  const source = new CanvasSource(canvas, { codec: 'avc', quality })
  output.addVideoTrack(source, { frameRate: motion.fps })
  output.setMetadataTags({ title: filename })
  await output.start()

  const frameDuration = 1 / motion.fps
  const frameCount = Math.max(1, Math.ceil(motion.duration * motion.fps))

  // Encode sequential frames while respecting codec backpressure.
  for (let frame = 0; frame < frameCount; frame += 1) {
    if (options.cancelled?.()) {
      await output.cancel()
      throw new Error('Video export cancelled')
    }

    const timestamp = frame * frameDuration
    renderSceneFrame(canvas, scene, motion, timestamp)
    await source.add(timestamp, frameDuration, { keyFrame: frame % motion.fps === 0 })
    options.progress?.((frame + 1) / frameCount)
  }

  await output.finalize()
  if (!target.buffer) throw new Error('The MP4 encoder returned an empty file')

  downloadBlob(new Blob([target.buffer], { type: 'video/mp4' }), `${filename}.mp4`)
}
