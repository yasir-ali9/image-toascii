import { makeAutoObservable } from 'mobx'

export type ExportStatus = 'cancelled' | 'copied' | 'downloaded' | 'exporting' | 'failed' | 'idle'

// Manage export naming and lightweight action feedback.
export class ExporterManager {
  cancelRequested = false
  message = ''
  progress = 0
  status: ExportStatus = 'idle'

  // Make export settings observable and methods action-bound.
  constructor() {
    makeAutoObservable(this, {}, { autoBind: true })
  }

  // Create one fresh six-digit code for each file export.
  createFilename() {
    const code = Math.floor(Math.random() * 1_000_000).toString().padStart(6, '0')
    return `image-${code}`
  }

  // Publish concise export feedback.
  setStatus(status: ExportStatus) {
    this.status = status
    if (status !== 'failed') this.message = ''
  }

  // Publish one actionable export failure message.
  fail(message = 'Export could not be completed') {
    this.message = message
    this.status = 'failed'
  }

  // Start a cancellable video export with an empty progress value.
  startVideo() {
    this.cancelRequested = false
    this.message = ''
    this.progress = 0
    this.status = 'exporting'
  }

  // Publish bounded frame encoding progress.
  setProgress(progress: number) {
    this.progress = Math.min(1, Math.max(0, progress))
  }

  // Request cancellation at the next safe encoder boundary.
  cancelVideo() {
    if (this.status !== 'exporting') return
    this.cancelRequested = true
  }

  // Finish a cancelled export without showing a failure.
  finishCancellation() {
    this.progress = 0
    this.status = 'cancelled'
  }
}
