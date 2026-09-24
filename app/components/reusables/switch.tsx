type SwitchProps = {
  checked: boolean
  disabled?: boolean
  label: string
  onChange: (checked: boolean) => void
}

// Render a compact labeled switch.
export function Switch({ checked, disabled = false, label, onChange }: SwitchProps) {
  return (
    <div className={`flex items-center justify-between gap-3 py-1.5 ${disabled ? 'opacity-45' : ''}`}>
      <span className="text-[11px] text-fg-50">{label}</span>
      <button
        aria-checked={checked}
        aria-label={label}
        className={`relative h-4 w-7 rounded-full transition-colors disabled:cursor-not-allowed ${
          checked ? 'bg-ac-01' : 'bg-bk-30'
        }`}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        role="switch"
        type="button"
      >
        <span
          className={`absolute top-0.5 h-3 w-3 rounded-full bg-white shadow-sm transition-transform ${
            checked ? 'translate-x-3.5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  )
}
