import { memo } from 'react'
import type { EditorPreset } from '../../../../../../lib/presets'

type PresetPreviewProps = {
  preset: EditorPreset
  sourceUrl: string | null
}

// Render one lightweight source thumbnail without running another image conversion.
export const PresetPreview = memo(function PresetPreview({ preset, sourceUrl }: PresetPreviewProps) {
  const filter = [
    preset.colorMode === 'source' ? '' : 'grayscale(1)',
    preset.negative ? 'invert(1)' : '',
    preset.mode === 'braille' ? 'contrast(1.3)' : 'contrast(1.08)',
  ].filter(Boolean).join(' ')

  return (
    <span
      className="relative flex h-8 w-9 shrink-0 overflow-hidden rounded border border-white/10 shadow-inner"
      style={{ backgroundColor: preset.background }}
    >
      {sourceUrl ? (
        <>
          <img
            alt=""
            className="h-full w-full object-cover"
            decoding="async"
            draggable={false}
            loading="lazy"
            src={sourceUrl}
            style={{ filter }}
          />
          {preset.colorMode === 'mono' ? (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-70 mix-blend-color"
              style={{ backgroundColor: preset.foreground }}
            />
          ) : null}
        </>
      ) : (
        <span aria-hidden="true" className="m-auto h-3 w-4 rounded-sm border border-bd-60 bg-bk-40/40" />
      )}
    </span>
  )
})
