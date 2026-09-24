import { observer } from 'mobx-react-lite'
import { EDITOR_PRESETS } from '../../../../../../lib/presets'
import { useEditorEngine } from '../../../../../../lib/stores/editor/hooks'
import type { SourceImage } from '../../../types'
import { PresetPreview } from './preview'

type PresetsProps = {
  source: SourceImage | null
}

// Render curated converter looks with compact live-style previews.
export const Presets = observer(function Presets({ source }: PresetsProps) {
  const editor = useEditorEngine()

  return (
    <div className="min-h-0 flex-1 overflow-y-auto pb-2">
      <div className="flex items-center justify-between px-3 pb-2 pt-3">
        <span className="text-[12px] text-fg-50">Presets</span>
        <span className="text-[10px] text-fg-70">{EDITOR_PRESETS.length}</span>
      </div>

      <div className="space-y-px px-2">
        {EDITOR_PRESETS.map((preset) => {
          const selected = editor.matchesPreset(preset)

          return (
            <button
              aria-pressed={selected}
              className={`flex min-h-11 w-full cursor-pointer items-center gap-2 rounded border px-1.5 py-1 text-left transition-colors ${
                selected
                  ? 'border-bd-60 bg-bk-30'
                  : 'border-transparent hover:border-bd-50 hover:bg-bk-40'
              }`}
              key={preset.id}
              onClick={() => editor.applyPreset(preset)}
              type="button"
            >
              <PresetPreview preset={preset} sourceUrl={source?.url ?? null} />

              <span className="min-w-0 flex-1">
                <span className={`block truncate text-[11px] ${selected ? 'text-fg-40' : 'text-fg-50'}`}>
                  {preset.name}
                </span>
                <span className="block truncate text-[9px] leading-tight text-fg-70">
                  {preset.description}
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
})
