import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import { Color } from '../../../../../reusables/color'
import { BooleanTabs } from '../../../../../reusables/boolean-tabs'
import { Property } from '../../../../../reusables/property'
import { useEditorEngine } from '../../../../../../lib/stores/editor/hooks'
import { SectionHeader } from '../section-header'
import { ToneLevel } from './levels'

// Render color and tone controls.
export const Tone = observer(function Tone() {
  const { style } = useEditorEngine()
  const [expanded, setExpanded] = useState(true)

  return (
    <section className="border-b border-bd-50">
      <SectionHeader expanded={expanded} onToggle={() => setExpanded((value) => !value)} title="Tone" />
      {expanded ? (
        <div className="space-y-2 px-3 pb-3">
          <BooleanTabs checked={style.sourceColors} label="Source" onChange={style.setSourceColors} />
          <BooleanTabs checked={style.grayscale} label="Grayscale" onChange={style.setGrayscale} />
          <BooleanTabs checked={style.negative} label="Negative" onChange={style.setNegative} />

          <div className="flex items-center gap-2">
            <span className="w-14 shrink-0 text-[10px] text-fg-60">Foreground</span>
            <Color label="Foreground" onChange={style.setForeground} opacity={style.foregroundOpacity} showLabel={false} value={style.foreground} />
            <div className="w-[62px] shrink-0">
              <Property ariaLabel="Foreground opacity" max={100} min={0} onChange={style.setForegroundOpacity} unit="%" value={style.foregroundOpacity} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-14 shrink-0 text-[10px] text-fg-60">Background</span>
            <Color label="Background" onChange={style.setBackground} opacity={style.backgroundOpacity} showLabel={false} value={style.background} />
            <div className="w-[62px] shrink-0">
              <Property ariaLabel="Background opacity" max={100} min={0} onChange={style.setBackgroundOpacity} unit="%" value={style.backgroundOpacity} />
            </div>
          </div>

          <ToneLevel label="Brightness" onChange={style.setBrightness} value={style.brightness} />
          <ToneLevel label="Contrast" onChange={style.setContrast} value={style.contrast} />
        </div>
      ) : null}
    </section>
  )
})
