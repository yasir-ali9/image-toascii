import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import { Select, type SelectOption } from '../../../../../reusables/select'
import { createMotionCode } from '../../../../../../lib/code'
import { copyImage, copyText, downloadBlob, downloadImage, downloadSvg, downloadText } from '../../../../../../lib/export'
import type { RenderStyle } from '../../../../../../lib/render'
import { useEditorEngine } from '../../../../../../lib/stores/editor/hooks'
import { downloadVideo } from '../../../../../../lib/video'
import { SectionHeader } from '../section-header'

type CopyType = 'image' | 'text'
type ExportKind = 'image' | 'svg' | 'text' | 'video' | 'code'

const COPY_OPTIONS: SelectOption[] = [
  { label: 'PNG', value: 'image' },
  { label: 'TXT', value: 'text' },
]

const EXPORT_OPTIONS: SelectOption[] = [
  { label: 'PNG', value: 'image' },
  { label: 'SVG', value: 'svg' },
  { label: 'TXT', value: 'text' },
  { disabled: true, label: 'MP4', value: 'video' },
  { label: 'HTML', value: 'code' },
]

// Render copy and file export controls for the current preview.
export const Export = observer(function Export() {
  const editor = useEditorEngine()
  const { exporter, layout, motion, output, preview, style, typography } = editor
  const [expanded, setExpanded] = useState(true)
  const [copyType, setCopyType] = useState<CopyType>('image')
  const [exportKind, setExportKind] = useState<ExportKind>('image')
  const exporting = exporter.status === 'exporting'
  const disabled = preview.loading || !preview.result || exporting
  const exportOptions = EXPORT_OPTIONS.map((option) => option.value === 'video' ? { ...option, disabled: !motion.enabled } : option)

  // Collect one render style shared by still, code, and video exports.
  const renderStyle: RenderStyle = {
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
  }

  // Copy the selected current preview representation.
  const runCopy = async () => {
    if (!preview.result) return

    try {
      if (copyType === 'image') await copyImage(preview.result, renderStyle)
      else await copyText(preview.result.text)
      exporter.setStatus('copied')
    } catch {
      exporter.setStatus('failed')
    }
  }

  // Download the current text result with a fresh file code.
  const saveText = () => {
    if (!preview.result) return
    try {
      downloadText(preview.result.text, exporter.createFilename())
      exporter.setStatus('downloaded')
    } catch {
      exporter.setStatus('failed')
    }
  }

  // Render and download the current styled result as PNG.
  const saveImage = async () => {
    if (!preview.result) return
    try {
      await downloadImage(preview.result, renderStyle, exporter.createFilename())
      exporter.setStatus('downloaded')
    } catch {
      exporter.setStatus('failed')
    }
  }

  // Generate and download the current result as native vector markup.
  const saveSvg = () => {
    if (!preview.result) return
    try {
      downloadSvg(preview.result, renderStyle, exporter.createFilename())
      exporter.setStatus('downloaded')
    } catch {
      exporter.setStatus('failed')
    }
  }

  // Download the self-contained canvas animation as editable HTML.
  const saveCode = () => {
    if (!preview.result) return
    try {
      const code = createMotionCode(preview.result, renderStyle, motion.snapshot)
      downloadBlob(new Blob([code], { type: 'text/html;charset=utf-8' }), `${exporter.createFilename()}.html`)
      exporter.setStatus('downloaded')
    } catch {
      exporter.setStatus('failed')
    }
  }

  // Encode and download the configured motion as a real MP4 file.
  const saveVideo = async () => {
    if (!preview.result || exporting) return
    exporter.startVideo()

    try {
      await downloadVideo(preview.result, renderStyle, motion.snapshot, exporter.createFilename(), {
        cancelled: () => exporter.cancelRequested,
        progress: exporter.setProgress,
      })
      exporter.setStatus('downloaded')
    } catch (error) {
      const cancelled = error instanceof Error && error.message === 'Video export cancelled'
      if (cancelled) exporter.finishCancellation()
      else exporter.fail(error instanceof Error ? error.message : 'Video export could not be completed')
    }
  }

  // Run the selected file export action.
  const runExport = async () => {
    if (exportKind === 'image') await saveImage()
    else if (exportKind === 'svg') saveSvg()
    else if (exportKind === 'text') saveText()
    else if (exportKind === 'video') await saveVideo()
    else saveCode()
  }

  return (
    <section className="border-b border-bd-50">
      <SectionHeader expanded={expanded} onToggle={() => setExpanded((value) => !value)} title="Export" />
      {expanded ? (
        <div className="space-y-2 px-3 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-14 shrink-0 text-[10px] text-fg-60">Copy</span>
            <div className="flex min-w-0 flex-1 items-center gap-1">
              <Select className="min-w-0 flex-1" onChange={(value) => setCopyType(value as CopyType)} options={COPY_OPTIONS} value={copyType} />
              <button className="h-[26px] w-16 shrink-0 cursor-pointer rounded bg-bk-30 text-[10px] text-fg-50 hover:bg-bk-20 disabled:cursor-not-allowed disabled:opacity-40" disabled={disabled} onClick={() => void runCopy()} type="button">
                Copy
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-14 shrink-0 text-[10px] text-fg-60">Export</span>
            <div className="flex min-w-0 flex-1 items-center gap-1">
              <Select className="min-w-0 flex-1" onChange={(value) => setExportKind(value as ExportKind)} options={exportOptions} value={exportKind} />
              <button
                className="h-[26px] w-16 shrink-0 cursor-pointer rounded bg-bk-30 text-[10px] text-fg-50 hover:bg-bk-20 disabled:cursor-not-allowed disabled:opacity-40"
                disabled={disabled || (exportKind === 'video' && !motion.enabled) || (exportKind === 'code' && !motion.enabled)}
                onClick={() => void runExport()}
                type="button"
              >
                Export
              </button>
            </div>
          </div>

          {exporting ? (
            <div className="space-y-1.5 rounded border border-bd-50 bg-bk-40 p-2">
              <div className="flex items-center justify-between text-[10px] text-fg-60">
                <span>Encoding video</span>
                <span>{Math.round(exporter.progress * 100)}%</span>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-bk-30">
                <div className="h-full bg-ac-01 transition-[width]" style={{ width: `${exporter.progress * 100}%` }} />
              </div>
              <button className="h-6 w-full cursor-pointer rounded text-[10px] text-fg-60 hover:bg-bk-30 hover:text-fg-40" onClick={exporter.cancelVideo} type="button">
                Cancel export
              </button>
            </div>
          ) : null}

          {exporter.status !== 'idle' && exporter.status !== 'exporting' ? (
            <p className={`text-[10px] ${exporter.status === 'failed' ? 'text-red-500' : 'text-fg-70'}`}>
              {exporter.status === 'copied'
                ? 'Copied to clipboard'
                : exporter.status === 'downloaded'
                  ? 'Download started'
                  : exporter.status === 'cancelled'
                    ? 'Video export cancelled'
                    : exporter.message || 'Export could not be completed'}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  )
})
