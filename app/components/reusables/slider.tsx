import type { InputHTMLAttributes, ReactNode } from 'react'
import './slider.css'

type SliderProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  fieldVariant?: 'default' | 'plain'
  valueControl?: ReactNode
  valuePosition?: 'inside' | 'outside'
}

// Render the shared neutral range control used by editor inspectors.
export function Slider({ className, fieldVariant = 'default', valueControl, valuePosition = 'inside', ...props }: SliderProps) {
  const showInsideValue = valueControl && valuePosition === 'inside'
  const showOutsideValue = valueControl && valuePosition === 'outside'

  return (
    <div className={`slider-group ${className ?? ''}`}>
      <div className={`slider-field slider-field-${fieldVariant}`}>
        <input {...props} className="slider" type="range" />
        {showInsideValue ? <div className="slider-trailing">{valueControl}</div> : null}
      </div>
      {showOutsideValue ? <div className="slider-value-outside">{valueControl}</div> : null}
    </div>
  )
}
