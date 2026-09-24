type ColorProps = {
  label: string
  onChange: (value: string) => void
  opacity?: number
  showLabel?: boolean
  value: string
}

// Render a compact native color picker with a precise value preview.
export function Color({ label, onChange, opacity = 100, showLabel = true, value }: ColorProps) {
  return (
    <label className="flex h-[26px] min-w-0 flex-1 items-center gap-2 rounded border border-bd-50 bg-bk-40 px-2 focus-within:shadow-[0_0_0_2px_rgb(var(--ac-02))]">
      {showLabel ? <span className="w-20 shrink-0 text-[10px] text-fg-60">{label}</span> : null}
      <span className="relative h-3 w-3 shrink-0 overflow-hidden rounded-full border border-bd-60 bg-[conic-gradient(#fff_0_25%,#c8c8c8_0_50%,#fff_0_75%,#c8c8c8_0)] bg-size-[6px_6px]">
        <span className="absolute inset-0" style={{ backgroundColor: value, opacity: opacity / 100 }} />
        <input
          aria-label={`${label} color picker`}
          className="absolute inset-0 cursor-pointer opacity-0"
          onChange={(event) => onChange(event.target.value)}
          type="color"
          value={value}
        />
      </span>
      <input
        aria-label={`${label} hex value`}
        className="min-w-0 flex-1 bg-transparent text-[10px] text-fg-50 outline-none"
        onChange={(event) => onChange(event.target.value)}
        onFocus={(event) => event.currentTarget.select()}
        spellCheck={false}
        type="text"
        value={value}
      />
    </label>
  )
}
