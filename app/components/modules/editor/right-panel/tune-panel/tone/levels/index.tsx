import { useCallback, useEffect, useRef, useState } from 'react'
import { Slider } from '../../../../../../reusables/slider'

const TONE_DELAY = 100

type ToneLevelProps = {
  label: string
  onChange: (value: number) => void
  value: number
}

// Keep the displayed tone percentage inside the supported range.
function clampTone(value: number) {
  return Math.min(100, Math.max(-100, Math.round(value)))
}

// Format positive adjustments with an explicit direction.
function formatTone(value: number) {
  return value > 0 ? `+${value}` : String(value)
}

// Render one responsive tone slider with a deferred conversion commit.
export function ToneLevel({ label, onChange, value }: ToneLevelProps) {
  const [draft, setDraft] = useState(value)
  const draftRef = useRef(value)
  const timerRef = useRef<number | null>(null)

  // Commit the latest local value after active dragging pauses.
  const commit = useCallback(() => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    timerRef.current = null
    onChange(draftRef.current)
  }, [onChange])

  // Update local feedback immediately while delaying conversion work.
  const updateDraft = useCallback((nextValue: number) => {
    const nextDraft = clampTone(nextValue)
    draftRef.current = nextDraft
    setDraft(nextDraft)

    if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(commit, TONE_DELAY)
  }, [commit])

  // Sync values changed by presets or other editor controls.
  useEffect(() => {
    if (timerRef.current !== null) return
    draftRef.current = value
    setDraft(value)
  }, [value])

  // Commit a pending adjustment before this control unmounts.
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) commit()
    }
  }, [commit])

  return (
    <label className="block">
      <span className="mb-1 flex items-center justify-between text-[10px] text-fg-60">
        <span>{label}</span>
        <span>{formatTone(draft)}</span>
      </span>
      <Slider
        aria-label={label}
        max={100}
        min={-100}
        onChange={(event) => updateDraft(Number(event.target.value))}
        value={draft}
      />
    </label>
  )
}
