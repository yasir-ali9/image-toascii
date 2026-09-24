import { makeAutoObservable } from 'mobx'
import type { ConversionResult } from '../../../ascii/types'

// Share the latest conversion result without deeply observing its pixel data.
export class PreviewManager {
  error: string | null = null
  loading = true
  result: ConversionResult | null = null

  // Make preview status observable while leaving the heavy result unobserved.
  constructor() {
    makeAutoObservable(this, { result: false }, { autoBind: true })
  }

  // Clear stale output before a conversion begins.
  start() {
    this.error = null
    this.loading = true
  }

  // Remove rendered output when no source image is available.
  clear() {
    this.error = null
    this.loading = false
    this.result = null
  }

  // Publish the latest successful conversion.
  resolve(result: ConversionResult) {
    this.error = null
    this.loading = false
    this.result = result
  }

  // Publish a conversion failure.
  reject(message: string) {
    this.error = message
    this.loading = false
    this.result = null
  }
}
