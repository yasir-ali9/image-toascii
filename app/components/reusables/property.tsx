import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FocusEvent,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { Tooltip } from './tooltip'

type PropertyProps = {
  ariaLabel?: string
  icon?: ReactNode
  label?: string
  max?: number
  min?: number
  onChange?: (value: number) => void
  readOnly?: boolean
  step?: number
  tooltip?: string
  unit?: string
  value: number
}

// Keep a numeric value inside optional bounds.
function clampValue(value: number, min?: number, max?: number) {
  let nextValue = value
  if (min !== undefined) nextValue = Math.max(nextValue, min)
  if (max !== undefined) nextValue = Math.min(nextValue, max)
  return nextValue
}

// Format property values without unnecessary decimal noise.
function formatValue(value: number) {
  return String(Math.round(value * 100) / 100)
}

// Render a compact numeric property field with editor-grade interactions.
export function Property({
  ariaLabel,
  icon,
  label,
  max,
  min,
  onChange,
  readOnly = false,
  step = 1,
  tooltip,
  unit,
  value,
}: PropertyProps) {
  const hasLeadingContent = icon !== undefined || label !== undefined
  const [focused, setFocused] = useState(false)
  const [inputValue, setInputValue] = useState(() => formatValue(value))
  const cancelRef = useRef(false)
  const changeRef = useRef(onChange)
  const pendingRef = useRef<number | null>(null)
  const valueRef = useRef(value)

  valueRef.current = value

  // Keep the latest change handler available to unmount cleanup.
  useEffect(() => {
    changeRef.current = onChange
  }, [onChange])

  // Sync external changes while the user is not editing.
  useEffect(() => {
    if (!focused) {
      setInputValue(formatValue(value))
      pendingRef.current = null
    }
  }, [focused, value])

  // Flush a valid pending edit if the field unmounts while focused.
  useEffect(() => {
    return () => {
      const pendingValue = pendingRef.current
      if (pendingValue !== null && pendingValue !== valueRef.current) {
        changeRef.current?.(pendingValue)
      }
    }
  }, [])

  // Select the complete value for quick replacement.
  const focusInput = (event: FocusEvent<HTMLInputElement>) => {
    setFocused(true)
    event.currentTarget.select()
  }

  // Track free-form input without committing partial numbers.
  const changeInput = (event: ChangeEvent<HTMLInputElement>) => {
    const nextInput = event.target.value
    setInputValue(nextInput)

    const parsedValue = Number(nextInput)
    pendingRef.current = Number.isFinite(parsedValue)
      ? clampValue(parsedValue, min, max)
      : null
  }

  // Validate, clamp, and commit when editing finishes.
  const blurInput = () => {
    setFocused(false)

    if (cancelRef.current) {
      cancelRef.current = false
      pendingRef.current = null
      setInputValue(formatValue(value))
      return
    }

    const parsedValue = Number(inputValue)
    if (!Number.isFinite(parsedValue) || inputValue.trim() === '') {
      pendingRef.current = null
      setInputValue(formatValue(value))
      return
    }

    const nextValue = clampValue(parsedValue, min, max)
    setInputValue(formatValue(nextValue))
    pendingRef.current = null
    if (nextValue !== value) onChange?.(nextValue)
  }

  // Support commit, cancel, and keyboard stepping.
  const pressKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      event.currentTarget.blur()
      return
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      cancelRef.current = true
      event.currentTarget.blur()
      return
    }

    if (readOnly || (event.key !== 'ArrowUp' && event.key !== 'ArrowDown')) return

    event.preventDefault()
    const parsedValue = Number(inputValue)
    const currentValue = Number.isFinite(parsedValue) ? parsedValue : value
    const direction = event.key === 'ArrowUp' ? 1 : -1
    const nextValue = clampValue(currentValue + direction * step, min, max)

    setInputValue(formatValue(nextValue))
    pendingRef.current = null
    onChange?.(nextValue)
  }

  const field = (
    <label className="flex h-[26px] min-w-0 items-center rounded border border-bd-50 bg-bk-40 hover:border-bd-60 focus-within:border-bd-50 focus-within:shadow-[0_0_0_2px_rgb(var(--ac-02))]">
      {hasLeadingContent ? (
        <span className="flex w-6 shrink-0 items-center justify-center text-[10px] font-medium text-fg-60">
          {icon ?? label}
        </span>
      ) : null}
      <input
        aria-label={ariaLabel}
        className={`property-input h-full min-w-0 flex-1 bg-transparent pr-1 text-[11px] text-fg-50 outline-none read-only:cursor-default ${hasLeadingContent ? '' : 'pl-2'}`}
        inputMode="decimal"
        onBlur={blurInput}
        onChange={changeInput}
        onFocus={focusInput}
        onKeyDown={pressKey}
        readOnly={readOnly}
        type="text"
        value={inputValue}
      />
      {unit ? <span className="shrink-0 pr-2 text-[10px] text-fg-70">{unit}</span> : null}
    </label>
  )

  return tooltip ? <Tooltip className="w-full" content={tooltip}>{field}</Tooltip> : field
}
