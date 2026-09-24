import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import { BooleanTabs } from '../../../../../reusables/boolean-tabs'
import { Select } from '../../../../../reusables/select'
import { Slider } from '../../../../../reusables/slider'
import type { MotionDirection, MotionEffect } from '../../../../../../lib/motion'
import { useEditorEngine } from '../../../../../../lib/stores/editor/hooks'
import { SectionHeader } from '../section-header'
import { formatTime, Transport } from './transport'

const EFFECTS: { label: string; value: MotionEffect }[] = [
  { label: 'Digital glitch', value: 'glitch' },
  { label: 'Wave field', value: 'wave' },
  { label: 'Directional reveal', value: 'reveal' },
  { label: 'Glyph pulse', value: 'pulse' },
  { label: 'Scan light', value: 'scan' },
]

const DIRECTIONS: { label: string; value: MotionDirection }[] = [
  { label: 'Forward', value: 'forward' },
  { label: 'Reverse', value: 'reverse' },
  { label: 'Ping-pong', value: 'alternate' },
]

// Render procedural motion, timing, and playback controls.
export const Motion = observer(function Motion() {
  const { motion } = useEditorEngine()
  const [expanded, setExpanded] = useState(true)

  return (
    <section className="border-b border-bd-50">
      <SectionHeader expanded={expanded} onToggle={() => setExpanded((value) => !value)} title="Motion" />
      {expanded ? (
        <div className="space-y-2 px-3 pb-3">
          <BooleanTabs checked={motion.enabled} label="Enabled" onChange={motion.setEnabled} stacked />

          <div>
            <span className="mb-1 block text-[10px] text-fg-60">Effect</span>
            <Select
              className="w-full"
              onChange={(value) => motion.setEffect(value as MotionEffect)}
              options={EFFECTS}
              value={motion.effect}
            />
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between text-[10px] text-fg-60">
              <span>Player</span>
              <span>{formatTime(motion.currentTime)}</span>
            </div>
            <Transport />
          </div>

          <div className="space-y-2">
            <div>
              <div className="mb-1 flex items-center justify-between text-[10px] text-fg-60">
                <span>Duration</span>
                <span>{motion.duration.toFixed(1)}s</span>
              </div>
              <Slider aria-label="Motion duration" max={12} min={0.5} onChange={(event) => motion.setDuration(Number(event.target.value))} step={0.5} value={motion.duration} />
            </div>
            <div>
              <span className="mb-1 block text-[10px] text-fg-60">Frame rate</span>
            <Select
              aria-label="Frame rate"
              className="w-full"
              onChange={(value) => motion.setFps(Number(value))}
              options={[12, 24, 30, 60].map((fps) => ({ label: `${fps} fps`, value: String(fps) }))}
              value={String(motion.fps)}
            />
            </div>
          </div>

          <label className="block pt-0.5">
            <span className="mb-1 flex items-center justify-between text-[10px] text-fg-60">
              <span>Intensity</span>
              <span className="text-[10px] text-fg-60">{motion.intensity}%</span>
            </span>
            <Slider aria-label="Motion intensity" max={100} min={0} onChange={(event) => motion.setIntensity(Number(event.target.value))} value={motion.intensity} />
          </label>

          <label className="block">
            <span className="mb-1 flex items-center justify-between text-[10px] text-fg-60">
              <span>Speed</span>
              <span className="text-[10px] text-fg-60">{motion.speed.toFixed(2)}×</span>
            </span>
            <Slider aria-label="Motion speed" max={3} min={0.25} onChange={(event) => motion.setSpeed(Number(event.target.value))} step={0.05} value={motion.speed} />
          </label>

          <label className="block">
            <span className="mb-1 flex items-center justify-between text-[10px] text-fg-60">
              <span>Cell spread</span>
              <span className="text-[10px] text-fg-60">{motion.spread}%</span>
            </span>
            <Slider aria-label="Cell spread" max={100} min={0} onChange={(event) => motion.setSpread(Number(event.target.value))} value={motion.spread} />
          </label>

          <div>
            <span className="mb-1 block text-[10px] text-fg-60">Direction</span>
            <div className="grid h-[26px] w-full grid-cols-3 overflow-hidden rounded border border-bd-50 bg-bk-40 text-[10px]">
              {DIRECTIONS.map((direction) => (
                <button
                  aria-pressed={motion.direction === direction.value}
                  className={`${motion.direction === direction.value ? 'bg-bk-30 text-fg-50' : 'cursor-pointer text-fg-60'}`}
                  key={direction.value}
                  onClick={() => motion.setDirection(direction.value)}
                  type="button"
                >
                  {direction.label}
                </button>
              ))}
            </div>
          </div>

          <BooleanTabs checked={motion.loop} label="Loop" onChange={motion.setLoop} stacked />
        </div>
      ) : null}
    </section>
  )
})
