import { memo, useLayoutEffect, useMemo, useRef } from 'react'
import type { ConversionResult } from '../../../../../lib/ascii/types'
import type { RenderStyle } from '../../../../../lib/render'
import type { MotionManager } from '../../../../../lib/stores/editor/motion'
import type { OutputMode } from '../../../../../lib/stores/editor/output'
import type { ColorTarget } from '../../../../../lib/stores/editor/style'
import { Motion } from '../motion'

type TextProps = {
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
  lineHeight: number
  motion: MotionManager
  motionEnabled: boolean
  mode: OutputMode
  onMetrics: (mode: OutputMode, width: number, height: number) => void
  paddingBottom: number
  paddingLeft: number
  paddingRight: number
  paddingTop: number
  result: ConversionResult
  scale: number
}

// Mix one color with transparency for DOM preview parity.
function withOpacity(color: string, opacity: number) {
  return `color-mix(in srgb, ${color} ${opacity}%, transparent)`
}

// Render plain or per-cell colored conversion output.
export const Text = memo(function Text({ background, backgroundOpacity, characterHeight, characterWidth, colorTarget, fontFamily, fontSize, foreground, foregroundOpacity, letterSpacing, lineHeight, motion, motionEnabled, mode, onMetrics, paddingBottom, paddingLeft, paddingRight, paddingTop, result, scale }: TextProps) {
  const lines = result.text.split('\n')
  const asciiProbeRef = useRef<HTMLSpanElement>(null)
  const brailleProbeRef = useRef<HTMLSpanElement>(null)
  const renderStyle = useMemo<RenderStyle>(() => ({
    background,
    backgroundOpacity,
    characterHeight,
    characterWidth,
    colorTarget,
    fontFamily,
    fontSize,
    foreground,
    foregroundOpacity,
    letterSpacing: letterSpacing * scale,
    mode,
    paddingBottom,
    paddingLeft,
    paddingRight,
    paddingTop,
  }), [background, backgroundOpacity, characterHeight, characterWidth, colorTarget, fontFamily, fontSize, foreground, foregroundOpacity, letterSpacing, mode, paddingBottom, paddingLeft, paddingRight, paddingTop, scale])

  // Measure both glyph systems after layout and font readiness.
  useLayoutEffect(() => {
    let active = true

    // Publish exact ten-character measurements for both output modes.
    const measure = () => {
      const asciiProbe = asciiProbeRef.current
      const brailleProbe = brailleProbeRef.current
      if (!active || !asciiProbe || !brailleProbe) return

      const asciiBounds = asciiProbe.getBoundingClientRect()
      const brailleBounds = brailleProbe.getBoundingClientRect()
      onMetrics('ascii', asciiBounds.width / 10, asciiBounds.height)
      onMetrics('braille', brailleBounds.width / 10, brailleBounds.height)
    }

    measure()
    void document.fonts?.ready.then(measure)

    return () => {
      active = false
    }
  }, [fontFamily, fontSize, letterSpacing, lineHeight, onMetrics])

  return (
    <div
      className="relative rounded-md border border-bd-50 shadow-[0_6px_18px_rgba(0,0,0,0.08)]"
      style={{
        backgroundColor: motionEnabled ? 'transparent' : withOpacity(background, backgroundOpacity),
        contain: 'layout paint',
        paddingBottom,
        paddingLeft,
        paddingRight,
        paddingTop,
      }}
    >
      <span
        ref={asciiProbeRef}
        aria-hidden="true"
        className="invisible absolute left-0 top-0 whitespace-pre"
        style={{ fontFamily, fontSize, letterSpacing, lineHeight: `${lineHeight}px` }}
      >
        0000000000
      </span>
      <span
        ref={brailleProbeRef}
        aria-hidden="true"
        className="invisible absolute left-0 top-0 whitespace-pre"
        style={{ fontFamily, fontSize, letterSpacing, lineHeight: `${lineHeight}px` }}
      >
        ⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
      </span>
      <pre
        aria-hidden={motionEnabled}
        className="select-text whitespace-pre"
        style={{ color: withOpacity(foreground, foregroundOpacity), fontFamily, fontSize, letterSpacing, lineHeight: `${lineHeight}px`, visibility: motionEnabled ? 'hidden' : 'visible', zoom: scale }}
      >
        {motionEnabled
          ? result.text
          : result.colors
          ? lines.map((line, row) => {
              const rowOffset = row * result.width

              return (
                <span key={row}>
                  {Array.from(line).map((character, column) => {
                    const color = result.colors?.[rowOffset + column]
                    const cellStyle = colorTarget === 'background'
                      ? { backgroundColor: withOpacity(color ?? background, backgroundOpacity) }
                      : undefined
                    const glyphColor = colorTarget === 'foreground' ? color ?? foreground : foreground

                    return (
                      <span key={column} style={cellStyle}>
                        <span style={{ color: withOpacity(glyphColor, foregroundOpacity) }}>{character}</span>
                      </span>
                    )
                  })}
                  {row < lines.length - 1 ? '\n' : null}
                </span>
              )
            })
          : result.text}
      </pre>
      {motionEnabled ? <Motion motion={motion} result={result} style={renderStyle} /> : null}
    </div>
  )
})
