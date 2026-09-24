import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'

type ResizableProps = {
  children: ReactNode
  defaultWidth?: number
  minWidth?: number
  maxWidth?: number
  position: 'left' | 'right'
}

// Keep a side panel within its configured bounds.
function clampWidth(width: number, minWidth: number, maxWidth: number) {
  return Math.min(Math.max(width, minWidth), maxWidth)
}

// Render a horizontally resizable editor panel.
export function Resizable({
  children,
  defaultWidth = 280,
  minWidth = 200,
  maxWidth = 400,
  position,
}: ResizableProps) {
  const [width, setWidth] = useState(defaultWidth)
  const [resizing, setResizing] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  // Begin tracking pointer movement from the resize hit area.
  const startResize = useCallback((event: ReactPointerEvent) => {
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    setResizing(true)
  }, [])

  // Update the panel width while the pointer is captured.
  const resize = useCallback(
    (event: ReactPointerEvent) => {
      if (!resizing || !panelRef.current) return

      const rect = panelRef.current.getBoundingClientRect()
      const nextWidth =
        position === 'left' ? event.clientX - rect.left : rect.right - event.clientX

      setWidth(clampWidth(nextWidth, minWidth, maxWidth))
    },
    [maxWidth, minWidth, position, resizing],
  )

  // Finish resizing and restore normal selection behavior.
  const stopResize = useCallback(() => setResizing(false), [])

  useEffect(() => {
    document.body.style.cursor = resizing ? 'ew-resize' : ''
    document.body.style.userSelect = resizing ? 'none' : ''

    // Restore global document styles when resizing ends.
    return () => {
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [resizing])

  return (
    <div
      className="relative shrink-0 overflow-hidden bg-bk-50"
      ref={panelRef}
      style={{ width, minWidth, maxWidth }}
    >
      {children}
      <div
        className={`absolute inset-y-0 z-20 w-1 cursor-ew-resize ${
          position === 'left' ? 'right-0' : 'left-0'
        }`}
        onPointerCancel={stopResize}
        onPointerDown={startResize}
        onPointerMove={resize}
        onPointerUp={stopResize}
        role="separator"
      />
    </div>
  )
}
