import { useTheme } from '../../../../../lib/theme/context'

type HeaderProps = {
  onHideOriginal: () => void
  onShowOriginal: () => void
  showOriginal: boolean
}

// Reserve a quiet panel header with only its lower divider.
export function Header({ onHideOriginal, onShowOriginal, showOriginal }: HeaderProps) {
  const { toggleTheme } = useTheme()

  return (
    <div className="flex h-[37px] shrink-0 items-center justify-between border-b border-bd-50 bg-bk-40 px-2">
      <button
        aria-label="Hold to show original image"
        aria-pressed={showOriginal}
        className="flex h-6 w-6 cursor-pointer items-center justify-center rounded text-fg-60 transition-colors hover:text-fg-30"
        onLostPointerCapture={onHideOriginal}
        onPointerCancel={onHideOriginal}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId)
          onShowOriginal()
        }}
        onPointerUp={onHideOriginal}
        type="button"
      >
        <svg aria-hidden="true" className="opacity-80" fill="none" height="15" viewBox="0 0 16 16" width="15">
          <path d="M1.5 8S3.75 3.75 8 3.75 14.5 8 14.5 8 12.25 12.25 8 12.25 1.5 8 1.5 8Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" />
          <circle cx="8" cy="8" r="1.75" stroke="currentColor" strokeWidth="1.25" />
        </svg>
      </button>
      <button
        aria-label="Toggle theme"
        className="flex h-6 w-6 cursor-pointer items-center justify-center rounded text-[13px] font-medium text-fg-60 transition-colors hover:text-fg-30"
        onClick={toggleTheme}
        type="button"
      >
        <span className="opacity-80">◩</span>
      </button>
    </div>
  )
}
