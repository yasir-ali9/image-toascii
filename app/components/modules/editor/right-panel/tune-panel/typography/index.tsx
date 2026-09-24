import { observer } from 'mobx-react-lite'
import { useRef, useState } from 'react'
import { Property } from '../../../../../reusables/property'
import type { FontOption } from '../../../../../../lib/fonts'
import { useEditorEngine } from '../../../../../../lib/stores/editor/hooks'
import { Picker } from './picker'
import { SectionHeader } from '../section-header'

// Render font selection and text metric controls.
export const Typography = observer(function Typography() {
  const { typography } = useEditorEngine()
  const [expanded, setExpanded] = useState(true)
  const [pickerOpen, setPickerOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Open the picker and request local font access from the user gesture.
  const openPicker = () => {
    setPickerOpen(true)
    void typography.loadLocalFonts()
  }

  // Select one font and return to the inspector.
  const selectFont = (font: FontOption) => {
    typography.setFont(font)
    setPickerOpen(false)
  }

  return (
    <section className="border-b border-bd-50">
      <SectionHeader expanded={expanded} onToggle={() => setExpanded((value) => !value)} title="Typography" />
      {expanded ? (
        <div className="px-3 pb-3">
          <div className="mb-1 text-[10px] text-fg-60">Font</div>
          <button
            className="flex h-[26px] w-full items-center rounded border border-bd-50 bg-bk-40 px-2 text-left hover:bg-bk-30"
            onClick={openPicker}
            ref={buttonRef}
            type="button"
          >
            <span className="mr-2 text-[14px] text-fg-50" style={{ fontFamily: typography.fontFamily }}>Ag</span>
            <span className="min-w-0 flex-1 truncate text-[11px] text-fg-50">{typography.fontName}</span>
          </button>

          <div className="mt-2">
            <span className="mb-1 block text-[10px] text-fg-60">Metrics</span>
            <div className="grid grid-cols-3 gap-1">
              <Property label="S" max={32} min={6} onChange={typography.setFontSize} tooltip="Font size" value={typography.fontSize} />
              <Property label="H" max={48} min={6} onChange={typography.setLineHeight} tooltip="Line height" value={typography.lineHeight} />
              <Property label="LS" max={12} min={-4} onChange={typography.setLetterSpacing} step={0.1} tooltip="Letter spacing" value={typography.letterSpacing} />
            </div>
          </div>
        </div>
      ) : null}

      {pickerOpen ? <Picker anchor={buttonRef} onClose={() => setPickerOpen(false)} onSelect={selectFont} /> : null}
    </section>
  )
})
