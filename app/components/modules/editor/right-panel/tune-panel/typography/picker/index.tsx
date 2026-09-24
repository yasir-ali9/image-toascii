import { observer } from 'mobx-react-lite'
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { FALLBACK_FONTS, type FontOption } from '../../../../../../../lib/fonts'
import { useEditorEngine } from '../../../../../../../lib/stores/editor/hooks'
import { FontGroup } from './group'
import { SearchIcon } from './search'

type PickerProps = {
  anchor: RefObject<HTMLButtonElement | null>
  onClose: () => void
  onSelect: (font: FontOption) => void
}

type Position = {
  left: number
  top: number
}

const POPOVER_HEIGHT = 420
const POPOVER_WIDTH = 330

// Render a permission-aware local font browser in a separate popover.
export const Picker = observer(function Picker({ anchor, onClose, onSelect }: PickerProps) {
  const { typography } = useEditorEngine()
  const [position, setPosition] = useState<Position>({ left: 12, top: 12 })
  const [query, setQuery] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  // Position the popover beside the right inspector without clipping it.
  useLayoutEffect(() => {
    const bounds = anchor.current?.getBoundingClientRect()
    if (!bounds) return
    setPosition({
      left: Math.max(12, bounds.left - POPOVER_WIDTH - 8),
      top: Math.max(12, Math.min(bounds.top, window.innerHeight - POPOVER_HEIGHT - 12)),
    })
    searchRef.current?.focus()
  }, [anchor])

  // Close the font browser with the Escape key.
  useEffect(() => {
    const pressKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', pressKey)
    return () => window.removeEventListener('keydown', pressKey)
  }, [onClose])

  const normalizedQuery = query.trim().toLocaleLowerCase()
  const fallbackFonts = useMemo(
    () => FALLBACK_FONTS.filter((font) => font.name.toLocaleLowerCase().includes(normalizedQuery)),
    [normalizedQuery],
  )
  const localFonts = useMemo(
    () => typography.localFonts.filter((font) => font.name.toLocaleLowerCase().includes(normalizedQuery)),
    [normalizedQuery, typography.localFonts],
  )

  return createPortal(
    <div className="fixed inset-0 z-50" onMouseDown={onClose}>
      <section
        aria-label="Fonts"
        aria-modal="true"
        className="fixed flex h-[420px] w-[330px] flex-col overflow-hidden rounded-lg border border-bd-60 bg-bk-50 shadow-[0_18px_55px_rgba(0,0,0,0.35)]"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
        style={position}
      >
        <header className="flex h-9 shrink-0 items-center justify-between px-3">
          <span className="text-[12px] font-medium text-fg-50">Fonts</span>
          <button aria-label="Close fonts" className="flex h-6 w-6 items-center justify-center rounded text-[18px] text-fg-60 hover:bg-bk-40 hover:text-fg-40" onClick={onClose} type="button">×</button>
        </header>

        <div className="px-2 pb-2">
          <label className="flex h-[26px] items-center rounded border border-bd-50 bg-bk-40 focus-within:shadow-[0_0_0_2px_rgb(var(--ac-02))]">
            <span className="flex px-2 text-fg-60"><SearchIcon /></span>
            <input
              className="h-full min-w-0 flex-1 bg-transparent pr-2 text-[11px] text-fg-50 outline-none placeholder:text-fg-70"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search fonts"
              ref={searchRef}
              type="search"
              value={query}
            />
          </label>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <FontGroup fonts={fallbackFonts} onSelect={onSelect} selected={typography.fontId} title="System" />
          <FontGroup fonts={localFonts} onSelect={onSelect} selected={typography.fontId} title="Local" />

          {typography.status === 'loading' ? <p className="px-3 py-4 text-[10px] text-fg-70">Waiting for font permission…</p> : null}
          {typography.status === 'denied' ? <p className="px-3 py-4 text-[10px] leading-relaxed text-fg-70">Local font access was denied. System fallbacks remain available.</p> : null}
          {typography.status === 'unsupported' ? <p className="px-3 py-4 text-[10px] leading-relaxed text-fg-70">This browser does not provide local font discovery. System fallbacks remain available.</p> : null}
          {normalizedQuery && fallbackFonts.length === 0 && localFonts.length === 0 ? <p className="px-3 py-4 text-[10px] text-fg-70">No matching fonts</p> : null}
        </div>
      </section>
    </div>,
    document.body,
  )
})
