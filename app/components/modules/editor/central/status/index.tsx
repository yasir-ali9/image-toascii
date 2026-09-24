import { observer } from 'mobx-react-lite'
import { useEditorEngine } from '../../../../../lib/stores/editor/hooks'

type StatusProps = {
  fallback: string
}

// Render isolated playback status without refreshing the central editor tree.
export const Status = observer(function Status({ fallback }: StatusProps) {
  const { motion } = useEditorEngine()
  if (!motion.enabled) return <span>{fallback}</span>

  return (
    <span>
      {motion.playing ? 'Playing' : 'Paused'} · {motion.currentTime.toFixed(1)} / {motion.duration.toFixed(1)}s
    </span>
  )
})
