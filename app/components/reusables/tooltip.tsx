import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

type TooltipProps = {
  children: ReactNode
  className?: string
  content: string
}

type Position = {
  left: number
  top: number
}

// Render a compact portal tooltip that is never clipped by editor panels.
export function Tooltip({ children, className, content }: TooltipProps) {
  const anchorRef = useRef<HTMLSpanElement>(null)
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState<Position>({ left: 0, top: 0 })
  const tooltipRef = useRef<HTMLSpanElement>(null)

  // Enable the document portal after browser hydration.
  useEffect(() => {
    setMounted(true)
  }, [])

  // Place the tooltip above the center of its trigger.
  const show = () => {
    const bounds = anchorRef.current?.getBoundingClientRect()
    if (!bounds) return
    setPosition({ left: bounds.left + bounds.width / 2, top: bounds.top - 7 })
    setOpen(true)
  }

  // Hide the tooltip as soon as its trigger loses focus or hover.
  const hide = () => {
    setOpen(false)
  }

  // Keep the tooltip inside the viewport and flip below near the top edge.
  useLayoutEffect(() => {
    if (!open) return

    const anchor = anchorRef.current?.getBoundingClientRect()
    const tooltip = tooltipRef.current?.getBoundingClientRect()
    if (!anchor || !tooltip) return

    const margin = 8
    const aboveTop = anchor.top - tooltip.height - 7
    const belowTop = anchor.bottom + 7
    const canFitAbove = aboveTop >= margin
    const canFitBelow = belowTop + tooltip.height <= window.innerHeight - margin
    const useAbove = canFitAbove || !canFitBelow
    const rawTop = useAbove ? aboveTop : belowTop
    const top = Math.min(Math.max(rawTop, margin), window.innerHeight - tooltip.height - margin)
    const left = Math.min(
      Math.max(anchor.left + anchor.width / 2, tooltip.width / 2 + margin),
      window.innerWidth - tooltip.width / 2 - margin,
    )

    setPosition({ left, top })
  }, [content, open])

  return (
    <>
      <span ref={anchorRef} className={`inline-flex ${className ?? ''}`} onBlur={hide} onFocus={show} onMouseEnter={show} onMouseLeave={hide}>
        {children}
      </span>
      {mounted && open ? createPortal(
        <span
          ref={tooltipRef}
          className="pointer-events-none fixed z-[9999] -translate-x-1/2 rounded border border-bd-60 bg-bk-30 px-2 py-1 text-[11px] text-fg-50 shadow-sm whitespace-nowrap"
          style={position}
        >
          {content}
        </span>,
        document.body,
      ) : null}
    </>
  )
}
