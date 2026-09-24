import { Header } from './header'
import { TunePanel } from './tune-panel'

type RightPanelProps = {
  onHideOriginal: () => void
  onShowOriginal: () => void
  showOriginal: boolean
}

// Render visual controls for the upcoming conversion engine.
export function RightPanel({ onHideOriginal, onShowOriginal, showOriginal }: RightPanelProps) {
  return (
    <section className="flex h-full flex-col border-l border-bd-50 bg-bk-50">
      <Header onHideOriginal={onHideOriginal} onShowOriginal={onShowOriginal} showOriginal={showOriginal} />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <TunePanel />
      </div>
    </section>
  )
}
