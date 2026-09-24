type SectionHeaderProps = {
  expanded: boolean
  onToggle: () => void
  title: string
}

// Render the shared title-only collapsible section header.
export function SectionHeader({ expanded, onToggle, title }: SectionHeaderProps) {
  return (
    <div className="flex w-full items-center px-3 py-2">
      <button
        className={`cursor-default select-none text-[12px] transition-colors ${
          expanded ? 'text-fg-50' : 'text-fg-60 hover:text-fg-50'
        }`}
        onClick={onToggle}
        type="button"
      >
        {title}
      </button>
    </div>
  )
}
