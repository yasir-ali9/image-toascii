export type FontOption = {
  family: string
  id: string
  name: string
  source: 'fallback' | 'local'
}

export const FALLBACK_FONTS: FontOption[] = [
  {
    family: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    id: 'system-mono',
    name: 'System monospace',
    source: 'fallback',
  },
  { family: 'Consolas, monospace', id: 'consolas', name: 'Consolas', source: 'fallback' },
  { family: '"Cascadia Mono", monospace', id: 'cascadia-mono', name: 'Cascadia Mono', source: 'fallback' },
  { family: '"Courier New", monospace', id: 'courier-new', name: 'Courier New', source: 'fallback' },
  { family: '"Lucida Console", monospace', id: 'lucida-console', name: 'Lucida Console', source: 'fallback' },
  { family: '"Segoe UI Mono", monospace', id: 'segoe-ui-mono', name: 'Segoe UI Mono', source: 'fallback' },
]

// Quote a discovered family name for safe CSS use.
export function getFontFamily(name: string) {
  return `"${name.replaceAll('"', '\\"')}", monospace`
}
