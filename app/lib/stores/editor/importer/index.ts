import { makeAutoObservable } from 'mobx'

// Manage image-import progress, errors, and drop feedback.
export class ImporterManager {
  dragging = false
  error: string | null = null
  loading = false

  // Make import status observable and methods action-bound.
  constructor() {
    makeAutoObservable(this, {}, { autoBind: true })
  }

  // Mark a new image import as active.
  start() {
    this.error = null
    this.loading = true
  }

  // Clear progress after a successful import.
  resolve() {
    this.error = null
    this.loading = false
  }

  // Publish a concise import failure.
  reject(message: string) {
    this.error = message
    this.loading = false
  }

  // Toggle the full-editor drop indicator.
  setDragging(dragging: boolean) {
    this.dragging = dragging
  }
}
