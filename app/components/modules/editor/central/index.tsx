import { observer } from 'mobx-react-lite'
import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import { convertImage } from '../../../../lib/ascii/convert'
import { copyImage, copyText } from '../../../../lib/export'
import type { RenderStyle } from '../../../../lib/render'
import { useEditorEngine } from '../../../../lib/stores/editor/hooks'
import { ContextMenu, type ContextMenuItem } from '../../../reusables/context-menu'
import type { SourceImage } from '../types'
import { Text } from './text'

type CentralProps = {
  showOriginal: boolean
  source: SourceImage | null
}

const MAX_ZOOM = 4
const MIN_ZOOM = 0.25
const PREVIEW_DELAY = 80
const ZOOM_RATE = 0.0015

// Keep preview zoom inside useful editor limits.
function clampZoom(value: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value))
}

// Render the generated text in the central workspace.
export const Central = observer(function Central({ showOriginal, source }: CentralProps) {
  const editor = useEditorEngine()
  const { exporter, layout, motion, output, preview, style, transform, typography } = editor
  const workspaceRef = useRef<HTMLDivElement>(null)
  const zoomRef = useRef(1)
  const [contextMenu, setContextMenu] = useState({ open: false, x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)

  // Build the shared still-image style used by clipboard and export actions.
  const renderStyle = useMemo<RenderStyle>(() => ({
    background: style.background,
    backgroundOpacity: style.backgroundOpacity,
    characterHeight: layout.previewCharacterHeight,
    characterWidth: layout.previewCharacterWidth,
    colorTarget: style.colorTarget,
    fontFamily: typography.fontFamily,
    fontSize: typography.fontSize,
    foreground: style.foreground,
    foregroundOpacity: style.foregroundOpacity,
    letterSpacing: typography.letterSpacing * layout.previewScale,
    mode: output.mode,
    paddingBottom: layout.paddingBottom,
    paddingLeft: layout.paddingLeft,
    paddingRight: layout.paddingRight,
    paddingTop: layout.paddingTop,
  }), [layout.paddingBottom, layout.paddingLeft, layout.paddingRight, layout.paddingTop, layout.previewCharacterHeight, layout.previewCharacterWidth, layout.previewScale, output.mode, style.background, style.backgroundOpacity, style.colorTarget, style.foreground, style.foregroundOpacity, typography.fontFamily, typography.fontSize, typography.letterSpacing])

  // Copy the generated plain text and preserve export status feedback.
  const copyPreviewText = useCallback(async () => {
    if (!preview.result) return

    try {
      await copyText(preview.result.text)
      exporter.setStatus('copied')
    } catch {
      exporter.setStatus('failed')
    }
  }, [exporter, preview.result])

  // Copy a rendered PNG using the same output style as file export.
  const copyPreviewImage = useCallback(async () => {
    if (!preview.result) return

    try {
      await copyImage(preview.result, renderStyle)
      exporter.setStatus('copied')
    } catch {
      exporter.setStatus('failed')
    }
  }, [exporter, preview.result, renderStyle])

  // Open the workspace menu at the native pointer location.
  const showContextMenu = useCallback((event: MouseEvent<HTMLDivElement>) => {
    event.preventDefault()
    setContextMenu({ open: true, x: event.clientX, y: event.clientY })
  }, [])

  // Hide all context-menu levels after selection or dismissal.
  const hideContextMenu = useCallback(() => {
    setContextMenu((current) => ({ ...current, open: false }))
  }, [])

  // Move the preview zoom by one small context-menu step.
  const changeZoom = useCallback((factor: number) => {
    const nextZoom = clampZoom(zoomRef.current * factor)
    if (nextZoom === zoomRef.current) return

    zoomRef.current = nextZoom
    setZoom(nextZoom)
  }, [])

  const contextItems = useMemo<ContextMenuItem[]>(() => [
    {
      disabled: !preview.result || preview.loading,
      label: 'Copy as',
      submenu: [
        { disabled: !preview.result || preview.loading, label: 'PNG', onSelect: () => void copyPreviewImage() },
        { disabled: !preview.result || preview.loading, label: 'Text', onSelect: () => void copyPreviewText() },
      ],
    },
    { separator: true },
    { label: 'Flip horizontally', onSelect: () => transform.setFlipX(!transform.flipX) },
    { label: 'Flip vertically', onSelect: () => transform.setFlipY(!transform.flipY) },
    { label: 'Zoom in', onSelect: () => changeZoom(1.1) },
    { label: 'Zoom out', onSelect: () => changeZoom(1 / 1.1) },
    { label: 'Fit to screen', onSelect: layout.fitToPreview },
  ], [changeZoom, copyPreviewImage, copyPreviewText, layout.fitToPreview, preview.loading, preview.result, transform])

  // Keep the store aware of the space available for fitting output.
  useEffect(() => {
    const workspace = workspaceRef.current
    if (!workspace) return

    const observer = new ResizeObserver(([entry]) => {
      if (entry) layout.setViewport(entry.contentRect.width, entry.contentRect.height)
    })

    observer.observe(workspace)
    return () => observer.disconnect()
  }, [layout])

  // Intercept modifier-wheel input only inside the preview workspace.
  useEffect(() => {
    const workspace = workspaceRef.current
    if (!workspace) return

    // Scale only the art wrapper while blocking browser-level page zoom.
    const zoomPreview = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return
      event.preventDefault()

      const nextZoom = clampZoom(zoomRef.current * Math.exp(-event.deltaY * ZOOM_RATE))
      if (nextZoom === zoomRef.current) return

      zoomRef.current = nextZoom
      setZoom(nextZoom)
    }

    workspace.addEventListener('wheel', zoomPreview, { passive: false })
    return () => workspace.removeEventListener('wheel', zoomPreview)
  }, [])

  // Select cached glyph geometry before converting another output mode.
  useEffect(() => {
    layout.setCharacterMode(output.mode)
  }, [layout, output.mode])

  // Regenerate the text whenever the source or output size changes.
  useEffect(() => {
    let cancelled = false

    if (!source) {
      preview.clear()
      return () => {
        cancelled = true
      }
    }

    preview.start()

    // Run the first conversion stage and commit only the latest request.
    const updatePreview = async () => {
      try {
        const result = await convertImage(source.url, layout.width, layout.height, {
          brightness: style.brightness,
          colorMode: style.colorMode,
          contrast: style.contrast,
          dither: transform.dither,
          flipX: transform.flipX,
          flipY: transform.flipY,
          map: output.characterMap,
          mode: output.mode,
          negative: style.negative,
          threshold: transform.threshold,
        })
        if (!cancelled) preview.resolve(result)
      } catch (error) {
        if (cancelled) return
        const message = error instanceof Error ? error.message : 'Could not convert this image'
        preview.reject(message)
      }
    }

    // Defer CPU-heavy pixel conversion until rapid inspector interactions settle.
    const conversionTimer = window.setTimeout(() => {
      void updatePreview()
    }, PREVIEW_DELAY)

    // Ignore an older conversion after the source changes.
    return () => {
      cancelled = true
      window.clearTimeout(conversionTimer)
    }
  }, [
    layout.height,
    layout.width,
    output.characterMap,
    output.mode,
    preview,
    source,
    style.brightness,
    style.colorMode,
    style.contrast,
    style.negative,
    transform.dither,
    transform.flipX,
    transform.flipY,
    transform.threshold,
  ])

  return (
    <section className="flex h-full flex-col bg-bk-60">
      <div ref={workspaceRef} className="relative flex min-h-0 flex-1 items-center justify-center overflow-auto bg-bk-60 p-10" onContextMenu={showContextMenu}>
        {showOriginal && source ? (
          <div className="shrink-0" style={{ zoom }}>
            <div
              className="box-border overflow-hidden rounded-md border border-bd-50 shadow-[0_6px_18px_rgba(0,0,0,0.08)]"
              style={{
                height: layout.height * layout.previewCharacterHeight + layout.paddingTop + layout.paddingBottom + 2,
                width: layout.width * layout.previewCharacterWidth + layout.paddingLeft + layout.paddingRight + 2,
              }}
            >
              <img alt="Original image" className="block h-full w-full object-contain" src={source.url} />
            </div>
          </div>
        ) : preview.result ? (
          <div className="shrink-0" style={{ zoom }}>
            <Text
              background={style.background}
              backgroundOpacity={style.backgroundOpacity}
              characterHeight={layout.previewCharacterHeight}
              characterWidth={layout.previewCharacterWidth}
              colorTarget={style.colorTarget}
              foreground={style.foreground}
              foregroundOpacity={style.foregroundOpacity}
              fontFamily={typography.fontFamily}
              fontSize={typography.fontSize}
              letterSpacing={typography.letterSpacing}
              lineHeight={typography.lineHeight}
              mode={output.mode}
              motion={motion}
              motionEnabled={motion.enabled}
              onMetrics={layout.setCharacterMetrics}
              paddingBottom={layout.paddingBottom}
              paddingLeft={layout.paddingLeft}
              paddingRight={layout.paddingRight}
              paddingTop={layout.paddingTop}
              result={preview.result}
              scale={layout.previewScale}
            />
          </div>
        ) : preview.loading ? (
          <span className="text-[11px] text-fg-60">Converting image…</span>
        ) : preview.error ? (
          <span className="text-[11px] text-red-500">{preview.error}</span>
        ) : null}
      </div>
      <ContextMenu
        isOpen={contextMenu.open}
        items={contextItems}
        onClose={hideContextMenu}
        position={{ x: contextMenu.x, y: contextMenu.y }}
      />
    </section>
  )
})
