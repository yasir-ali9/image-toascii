import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import { Property } from '../../../../../reusables/property'
import { useEditorEngine } from '../../../../../../lib/stores/editor/hooks'
import { SectionHeader } from '../section-header'

// Render sizing and outer-spacing controls in compact property groups.
export const Layout = observer(function Layout() {
  const { layout } = useEditorEngine()
  const [expanded, setExpanded] = useState(true)

  return (
    <section className="border-b border-bd-50">
      <SectionHeader
        expanded={expanded}
        onToggle={() => setExpanded((value) => !value)}
        title="Layout"
      />
      {expanded ? (
        <div className="px-3 pb-3">
          <div className="mb-1 text-[10px] text-fg-60">Dimensions</div>
          <div className="grid grid-cols-[1fr_1fr_26px] gap-1">
            <Property label="W" max={300} min={1} onChange={layout.setWidth} unit="CH" value={layout.width} />
            <Property label="H" max={300} min={1} onChange={layout.setHeight} unit="CH" value={layout.height} />
            <button
              aria-label={layout.locked ? 'Unlock aspect ratio' : 'Lock aspect ratio'}
              aria-pressed={layout.locked}
              className={`flex h-[26px] items-center justify-center rounded border border-bd-50 ${
                layout.locked ? 'bg-bk-30 text-fg-50' : 'bg-bk-40 text-fg-60 hover:bg-bk-30'
              }`}
              onClick={layout.toggleLocked}
              type="button"
            >
              <svg aria-hidden="true" height="13" viewBox="0 0 18 18" width="13">
                <rect fill="none" height="8" rx="1.5" stroke="currentColor" width="10" x="4" y="7" />
                <path
                  d={layout.locked ? 'M6.5 7V5.5a2.5 2.5 0 0 1 5 0V7' : 'M11.5 7V5.5a2.5 2.5 0 0 0-5 0'}
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          <div className="mt-2">
            <div className="mb-1 text-[10px] text-fg-60">Padding</div>
            <div className="grid grid-cols-[1fr_1fr_26px] gap-1">
              <Property label="X" max={256} min={0} onChange={layout.setPaddingX} unit="PX" value={layout.paddingLeft} />
              <Property label="Y" max={256} min={0} onChange={layout.setPaddingY} unit="PX" value={layout.paddingTop} />
              <button
                aria-label={layout.paddingLinked ? 'Unlink padding' : 'Link padding'}
                aria-pressed={layout.paddingLinked}
                className={`flex h-[26px] items-center justify-center rounded border border-bd-50 ${
                  layout.paddingLinked ? 'bg-bk-30 text-fg-50' : 'bg-bk-40 text-fg-60 hover:bg-bk-30'
                }`}
                onClick={layout.togglePaddingLinked}
                type="button"
              >
                <svg aria-hidden="true" height="12" viewBox="0 0 18 18" width="12">
                  <path d="M7 6H5.5a3 3 0 0 0 0 6H7M11 6h1.5a3 3 0 0 1 0 6H11M6.5 9h5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
                </svg>
              </button>
            </div>
          </div>

        </div>
      ) : null}
    </section>
  )
})
