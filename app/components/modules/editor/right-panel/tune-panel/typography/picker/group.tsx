import type { FontOption } from '../../../../../../../lib/fonts'

type GroupProps = {
  fonts: FontOption[]
  onSelect: (font: FontOption) => void
  selected: string
  title: string
}

// Render a group of real font-family previews.
export function FontGroup({ fonts, onSelect, selected, title }: GroupProps) {
  if (fonts.length === 0) return null

  return (
    <div>
      <div className="px-3 py-1 text-[10px] text-fg-60">{title}</div>
      {fonts.map((font) => (
        <button
          className={`flex min-h-9 w-full items-center gap-3 px-3 text-left hover:bg-bk-40 ${selected === font.id ? 'bg-bk-40' : ''}`}
          key={font.id}
          onClick={() => onSelect(font)}
          style={{ contentVisibility: 'auto', fontFamily: font.family }}
          type="button"
        >
          <span className="min-w-0 flex-1 truncate text-[16px] text-fg-50">{font.name}</span>
          {selected === font.id ? (
            <svg aria-label="Selected" className="shrink-0 text-fg-50" height="12" viewBox="0 0 12 12" width="12">
              <path d="M10 3 4.5 8.5 2 6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" />
            </svg>
          ) : null}
        </button>
      ))}
    </div>
  )
}
