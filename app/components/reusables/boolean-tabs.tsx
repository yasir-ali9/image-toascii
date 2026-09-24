type BooleanTabsProps = {
  checked: boolean
  label: string
  onChange: (checked: boolean) => void
  stacked?: boolean
}

// Render a compact Yes/No control for one boolean setting.
export function BooleanTabs({ checked, label, onChange, stacked = false }: BooleanTabsProps) {
  return (
    <div className={stacked ? 'space-y-1' : 'flex items-center gap-2'}>
      <span className={stacked ? 'block text-[10px] text-fg-60' : 'w-14 shrink-0 text-[10px] text-fg-60'}>{label}</span>
      <div className="flex h-[26px] min-w-0 flex-1 overflow-hidden rounded border border-bd-50 bg-bk-40">
        <button
          aria-pressed={!checked}
          className={`flex-1 cursor-pointer text-[10px] ${!checked ? 'bg-bk-30 text-fg-50' : 'text-fg-60'}`}
          onClick={() => onChange(false)}
          type="button"
        >
          No
        </button>
        <button
          aria-pressed={checked}
          className={`flex-1 cursor-pointer text-[10px] ${checked ? 'bg-bk-30 text-fg-50' : 'text-fg-60'}`}
          onClick={() => onChange(true)}
          type="button"
        >
          Yes
        </button>
      </div>
    </div>
  )
}
