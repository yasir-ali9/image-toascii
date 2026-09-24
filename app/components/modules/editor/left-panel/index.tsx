import type { SourceImage } from '../types'
import { Header } from './header'
import { SourcesPanel } from './sources-panel'

type LeftPanelProps = {
  onCollapse: () => void
  onDelete: () => void
  onFileSelect: (file: File) => void
  onLibrarySelect: (url: string) => void
  source: SourceImage | null
}

// Render source navigation and file details.
export function LeftPanel({ onCollapse, onDelete, onFileSelect, onLibrarySelect, source }: LeftPanelProps) {
  return (
    <section className="flex h-full flex-col border-r border-bd-50 bg-bk-50">
      <Header onCollapse={onCollapse} />
      <div className="min-h-0 flex-1 overflow-hidden">
        <SourcesPanel onDelete={onDelete} onFileSelect={onFileSelect} onLibrarySelect={onLibrarySelect} source={source} />
      </div>
      <div className="shrink-0 border-t border-bd-50 px-3 py-2 text-[10px] text-fg-60">
        Tool by{' '}
        <a
          className="cursor-pointer underline underline-offset-2 hover:text-fg-40"
          href="https://www.yasir-ali.com"
          rel="noreferrer"
          target="_blank"
        >
          Yasir Ali
        </a>
      </div>
    </section>
  )
}
