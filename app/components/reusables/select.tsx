import { useEffect, useLayoutEffect, useRef, useState } from 'react'

export type SelectOption = {
  disabled?: boolean
  label: string
  value: string
}

type SelectProps = {
  className?: string
  disabled?: boolean
  onChange: (value: string) => void
  options: SelectOption[]
  value: string
}

// Render a compact editor select with selected and menu states.
export function Select({ className = '', disabled = false, onChange, options, value }: SelectProps) {
  const selectRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [placement, setPlacement] = useState<'bottom' | 'top'>('bottom')
  const selected = options.find((option) => option.value === value)

  // Flip the menu above its trigger when the viewport has insufficient space below.
  useLayoutEffect(() => {
    if (!open) return

    // Recalculate placement after scrolling or resizing the editor.
    const updatePlacement = () => {
      const trigger = selectRef.current?.getBoundingClientRect()
      if (!trigger) return

      const estimatedHeight = Math.min(260, options.length * 34 + 8)
      const spaceBelow = window.innerHeight - trigger.bottom
      setPlacement(spaceBelow < estimatedHeight && trigger.top > estimatedHeight ? 'top' : 'bottom')
    }

    updatePlacement()
    window.addEventListener('resize', updatePlacement)
    window.addEventListener('scroll', updatePlacement, true)
    return () => {
      window.removeEventListener('resize', updatePlacement)
      window.removeEventListener('scroll', updatePlacement, true)
    }
  }, [open, options.length])

  // Close the menu when pointer input lands outside its trigger or options.
  useEffect(() => {
    if (!open) return

    // Ignore pointer input inside the select itself.
    const closeOutside = (event: PointerEvent) => {
      if (!selectRef.current?.contains(event.target as Node)) setOpen(false)
    }

    document.addEventListener('pointerdown', closeOutside)
    return () => document.removeEventListener('pointerdown', closeOutside)
  }, [open])

  // Commit one option and close its menu.
  const choose = (nextValue: string) => {
    if (options.find((option) => option.value === nextValue)?.disabled) return
    onChange(nextValue)
    setOpen(false)
  }

  return (
    <div ref={selectRef} className={`relative ${className}`}>
      <button
        aria-expanded={open}
        className={`flex h-[26px] w-full items-center justify-between gap-2 rounded border px-2 text-left text-[11px] ${
          disabled
            ? 'cursor-not-allowed border-bd-50 bg-bk-40 text-fg-60 opacity-60'
            : `cursor-pointer border-bd-50 bg-bk-40 text-fg-50 ${open ? 'shadow-[0_0_0_2px_rgb(var(--ac-02))]' : ''}`
        }`}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <span className="truncate">{selected?.label}</span>
        <svg aria-hidden="true" className={`shrink-0 text-fg-60 transition-transform ${open ? 'rotate-180' : ''}`} height="11" viewBox="0 0 12 12" width="11">
          <path d="m3 4.5 3 3 3-3" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" />
        </svg>
      </button>
      {open ? (
        <div className={`absolute left-0 z-50 flex min-w-full flex-col rounded-lg border border-bd-50 bg-bk-40 p-1 shadow-lg ${placement === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'}`}>
          {options.map((option) => {
            const selectedOption = option.value === value

            return (
              <button
                className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-[11px] ${option.disabled ? 'cursor-not-allowed text-fg-70 opacity-50' : 'cursor-pointer text-fg-50 hover:bg-bk-30'}`}
                disabled={option.disabled}
                key={option.value}
                onClick={() => choose(option.value)}
                type="button"
              >
                <span className="flex h-3 w-3 shrink-0 items-center justify-center">
                  {selectedOption ? (
                    <svg aria-hidden="true" height="12" viewBox="0 0 12 12" width="12">
                      <path d="M10 3 4.5 8.5 2 6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" />
                    </svg>
                  ) : null}
                </span>
                <span>{option.label}</span>
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
