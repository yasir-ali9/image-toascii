import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import { Select } from '../../../../../reusables/select'
import { useEditorEngine } from '../../../../../../lib/stores/editor/hooks'
import type { MapPreset } from '../../../../../../lib/stores/editor/output'
import { SectionHeader } from '../section-header'
import { ThresholdControl } from './threshold'

const mapOptions = [
  { label: 'Simple', value: 'simple' },
  { label: 'Detailed', value: 'detailed' },
  { label: 'Custom', value: 'custom' },
]

// Render transform mode and character-map controls.
export const Transform = observer(function Transform() {
  const { output, transform } = useEditorEngine()
  const [expanded, setExpanded] = useState(true)
  const braille = output.mode === 'braille'

  return (
    <section className="border-b border-bd-50">
      <SectionHeader expanded={expanded} onToggle={() => setExpanded((value) => !value)} title="Transform" />
      {expanded ? (
        <div className="space-y-2 px-3 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-14 shrink-0 text-[10px] text-fg-60">Type</span>
            <div className="flex min-w-0 flex-1 overflow-hidden rounded border border-bd-50">
              <button
                aria-pressed={output.mode === 'ascii'}
                className={`grow cursor-pointer px-1 py-[4px] text-center text-[10px] ${output.mode === 'ascii' ? 'bg-bk-30 text-fg-50' : 'bg-bk-40 text-fg-60'}`}
                onClick={() => output.setMode('ascii')}
                type="button"
              >
                Classic
              </button>
              <button
                aria-pressed={output.mode === 'braille'}
                className={`grow cursor-pointer px-1 py-[4px] text-center text-[10px] ${output.mode === 'braille' ? 'bg-bk-30 text-fg-50' : 'bg-bk-40 text-fg-60'}`}
                onClick={() => output.setMode('braille')}
                type="button"
              >
                Braille
              </button>
            </div>
          </div>
          {braille ? (
            <>
              <div className="flex items-center gap-2">
                <span className="w-14 shrink-0 text-[10px] text-fg-60">Dither</span>
                <div className="flex h-[26px] min-w-0 flex-1 overflow-hidden rounded border border-bd-50 bg-bk-40">
                  <button
                    aria-pressed={!transform.dither}
                    className={`flex-1 cursor-pointer text-[10px] ${!transform.dither ? 'bg-bk-30 text-fg-50' : 'text-fg-60'}`}
                    onClick={() => transform.setDither(false)}
                    type="button"
                  >
                    No
                  </button>
                  <button
                    aria-pressed={transform.dither}
                    className={`flex-1 cursor-pointer text-[10px] ${transform.dither ? 'bg-bk-30 text-fg-50' : 'text-fg-60'}`}
                    onClick={() => transform.setDither(true)}
                    type="button"
                  >
                    Yes
                  </button>
                </div>
              </div>
              {!transform.dither ? <ThresholdControl /> : null}
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className="w-14 shrink-0 text-[10px] text-fg-60">Map</span>
                <Select
                  className="min-w-0 flex-1"
                  onChange={(value) => output.setPreset(value as MapPreset)}
                  options={mapOptions}
                  value={output.preset}
                />
              </div>
              <label className="flex items-center gap-2">
                <span className="w-14 shrink-0 text-[10px] text-fg-60">Char</span>
                <input
                  aria-label="Character map"
                  className={`h-[26px] min-w-0 flex-1 rounded border bg-bk-40 px-2 font-mono text-[10px] tracking-wider text-fg-50 outline-none focus:shadow-[0_0_0_2px_rgb(var(--ac-02))] ${
                    output.preset === 'custom' && !output.customMapValid ? 'border-red-500' : 'border-bd-50'
                  }`}
                  onChange={(event) => {
                    output.setCustomMap(event.target.value)
                    if (output.preset !== 'custom') output.setPreset('custom')
                  }}
                  spellCheck={false}
                  title={!output.customMapValid ? 'Enter at least two characters' : 'Characters ordered from darkest to lightest'}
                  value={output.preset === 'custom' ? output.customMap : output.characterMap}
                />
              </label>
            </>
          )}
        </div>
      ) : null}
    </section>
  )
})
