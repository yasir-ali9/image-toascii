import { observer } from 'mobx-react-lite'
import { useCallback, useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react'
import { Slider } from '../../../../../../reusables/slider'
import { useEditorEngine } from '../../../../../../../lib/stores/editor/hooks'

const THRESHOLD_DELAY = 100

// Keep threshold values inside the byte range before updating local feedback.
function clampThreshold(value: number) {
  return Math.min(255, Math.max(0, Math.round(value)))
}

// Render an immediately responsive threshold control while deferring conversion work.
export const ThresholdControl = observer(function ThresholdControl() {
  const { transform } = useEditorEngine()
  const [draft, setDraft] = useState(transform.threshold)
  const draftRef = useRef(draft)
  const timerRef = useRef<number | null>(null)

  // Commit the latest draft once active slider interaction pauses.
  const commit = useCallback(() => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    timerRef.current = null
    transform.setThreshold(draftRef.current)
  }, [transform])

  // Stage rapid range updates locally so the preview conversion is not run per input event.
  const updateDraft = useCallback((value: number) => {
    const nextValue = clampThreshold(value)
    draftRef.current = nextValue
    setDraft(nextValue)

    if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(commit, THRESHOLD_DELAY)
  }, [commit])

  // Sync settings changed by a preset or another editor control.
  useEffect(() => {
    if (timerRef.current !== null) return
    draftRef.current = transform.threshold
    setDraft(transform.threshold)
  }, [transform.threshold])

  // Never leave a staged threshold behind when this control unmounts.
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) commit()
    }
  }, [commit])

  // Update from the editable value field without accepting non-numeric text.
  const changeValue = (event: ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value)
    if (Number.isFinite(value)) updateDraft(value)
  }

  // Commit direct text entry when the value field loses focus.
  const blurValue = () => commit()

  // Commit direct text entry on Enter without moving focus unexpectedly.
  const pressValueKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') commit()
  }

  return (
    <div className="flex items-center gap-2">
      <span className="w-14 shrink-0 text-[10px] text-fg-60">Threshold</span>
      <Slider
        aria-label="Braille threshold"
        className="min-w-0 flex-1"
        max={255}
        min={0}
        onChange={(event) => updateDraft(Number(event.target.value))}
        valueControl={(
          <input
            aria-label="Braille threshold value"
            className="h-6 w-10 rounded border border-bd-50 bg-bk-40 px-2 text-center text-[10px] text-fg-50 outline-none focus:shadow-[0_0_0_2px_rgb(var(--ac-02))]"
            inputMode="numeric"
            onBlur={blurValue}
            onChange={changeValue}
            onFocus={(event) => event.currentTarget.select()}
            onKeyDown={pressValueKey}
            type="text"
            value={draft}
          />
        )}
        valuePosition="outside"
        value={draft}
      />
    </div>
  )
})
