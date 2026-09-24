import { Export } from './export'
import { Layout } from './layout'
import { Motion } from './motion'
import { Tone } from './tone'
import { Transform } from './transform'
import { Typography } from './typography'

// Compose the detailed tuning sections.
export function TunePanel() {
  return (
    <div className="flex flex-col">
      <Transform />
      <Layout />
      <Typography />
      <Tone />
      <Motion />
      <Export />
    </div>
  )
}
