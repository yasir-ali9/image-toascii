type HeaderProps = {
  onCollapse: () => void
}

// Render the source panel header controls.
export function Header({ onCollapse }: HeaderProps) {
  return (
    <div className="flex h-[37px] shrink-0 items-center justify-between border-b border-bd-50 bg-bk-40 px-2 text-[10px] text-fg-60">
      <span className="flex items-center whitespace-nowrap">
        <span className="cursor-default rounded px-1 py-0.5 text-[11px] font-medium text-fg-50 transition-colors hover:bg-bk-30 hover:text-fg-30">Convert pixels to text</span>
      </span>
      <button
        aria-label="Collapse panels"
        className="flex h-6 w-5 cursor-pointer items-center justify-center rounded text-fg-60 transition-colors hover:text-fg-30"
        onClick={onCollapse}
        type="button"
      >
        <svg
          aria-hidden="true"
          className="opacity-80"
          fill="none"
          height="14"
          viewBox="0 0 14 14"
          width="14"
        >
          <path
            d="M2.433 2.433C3.117 1.75 4.217 1.75 6.417 1.75L7.583 1.75C9.783 1.75 10.883 1.75 11.567 2.433C12.25 3.117 12.25 4.217 12.25 6.417L12.25 7.583C12.25 9.783 12.25 10.883 11.567 11.567C10.883 12.25 9.783 12.25 7.583 12.25L6.417 12.25C4.217 12.25 3.117 12.25 2.433 11.567C1.75 10.883 1.75 9.783 1.75 7.583L1.75 6.417C1.75 4.217 1.75 3.117 2.433 2.433ZM4.67 9.336L4.67 4.67"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  )
}
