import { observer } from 'mobx-react-lite'
import { Slider } from '../../../../../../reusables/slider'
import { useEditorEngine } from '../../../../../../../lib/stores/editor/hooks'

// Format a compact playhead timestamp.
export function formatTime(value: number) {
  return `${value.toFixed(1)}s`
}

// Render the frequently changing playhead in an isolated observer.
export const Transport = observer(function Transport() {
  const { motion } = useEditorEngine()

  // Toggle playback without refreshing sibling controls.
  const togglePlayback = () => {
    if (motion.playing) motion.pause()
    else motion.play()
  }

  return (
    <div className="flex h-[26px] items-center gap-1 rounded border border-bd-50 bg-bk-40 px-1">
      <button
        aria-label={motion.playing ? 'Pause motion' : 'Play motion'}
        className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded text-[10px] text-fg-40 hover:bg-bk-30"
        onClick={togglePlayback}
        type="button"
      >
        {motion.playing ? (
          <svg aria-hidden="true" height="12" viewBox="0 0 12 12" width="12">
            <path d="M3 2a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1zm5 0a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z" fill="currentColor" />
          </svg>
        ) : '▶'}
      </button>
      <Slider
        aria-label="Motion playhead"
        className="min-w-0 flex-1"
        fieldVariant="plain"
        max={motion.duration}
        min={0}
        onChange={(event) => motion.seek(Number(event.target.value))}
        step={1 / motion.fps}
        value={motion.currentTime}
      />
    </div>
  )
})
