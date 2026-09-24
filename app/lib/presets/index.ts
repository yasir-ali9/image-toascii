import type { MapPreset, OutputMode } from '../stores/editor/output'
import type { ColorMode, ColorTarget } from '../stores/editor/style'

export type EditorPreset = {
  background: string
  colorMode: ColorMode
  colorTarget: ColorTarget
  description: string
  dither: boolean
  fontId: string
  fontSize: number
  foreground: string
  id: string
  letterSpacing: number
  lineHeight: number
  map: MapPreset
  mode: OutputMode
  name: string
  negative: boolean
  preview: string
  threshold: number
}

// Keep curated presets stable so the list never reallocates during editor renders.
export const EDITOR_PRESETS: readonly EditorPreset[] = [
  {
    background: '#111111',
    colorMode: 'mono',
    colorTarget: 'foreground',
    description: 'Crisp, balanced monochrome',
    dither: false,
    fontId: 'system-mono',
    fontSize: 10,
    foreground: '#f5f5f5',
    id: 'clean-mono',
    letterSpacing: 0,
    lineHeight: 10,
    map: 'simple',
    mode: 'ascii',
    name: 'Clean mono',
    negative: false,
    preview: '@#*:\n.:+%',
    threshold: 128,
  },
  {
    background: '#0b0d10',
    colorMode: 'mono',
    colorTarget: 'foreground',
    description: 'Fine texture and maximum detail',
    dither: false,
    fontId: 'cascadia-mono',
    fontSize: 9,
    foreground: '#f2efe8',
    id: 'deep-detail',
    letterSpacing: 0,
    lineHeight: 9,
    map: 'detailed',
    mode: 'ascii',
    name: 'Deep detail',
    negative: false,
    preview: 'MW8&\n}i:·',
    threshold: 128,
  },
  {
    background: '#09090b',
    colorMode: 'source',
    colorTarget: 'foreground',
    description: 'Detailed glyphs in source colors',
    dither: false,
    fontId: 'system-mono',
    fontSize: 10,
    foreground: '#ffffff',
    id: 'true-color',
    letterSpacing: 0,
    lineHeight: 10,
    map: 'detailed',
    mode: 'ascii',
    name: 'True color',
    negative: false,
    preview: 'R G B\n#*+=',
    threshold: 128,
  },
  {
    background: '#061107',
    colorMode: 'mono',
    colorTarget: 'foreground',
    description: 'Dense phosphor terminal glow',
    dither: false,
    fontId: 'consolas',
    fontSize: 10,
    foreground: '#79ff6b',
    id: 'terminal-green',
    letterSpacing: 0,
    lineHeight: 10,
    map: 'detailed',
    mode: 'ascii',
    name: 'Terminal green',
    negative: false,
    preview: '01##\n>_::',
    threshold: 128,
  },
  {
    background: '#07121f',
    colorMode: 'mono',
    colorTarget: 'foreground',
    description: 'Cool technical linework',
    dither: false,
    fontId: 'segoe-ui-mono',
    fontSize: 10,
    foreground: '#78d5ff',
    id: 'blueprint',
    letterSpacing: 0.2,
    lineHeight: 10,
    map: 'simple',
    mode: 'ascii',
    name: 'Blueprint',
    negative: false,
    preview: '+---\n|::. ',
    threshold: 128,
  },
  {
    background: '#171411',
    colorMode: 'mono',
    colorTarget: 'foreground',
    description: 'Warm, smooth Braille shading',
    dither: false,
    fontId: 'segoe-ui-mono',
    fontSize: 10,
    foreground: '#f4ead8',
    id: 'soft-braille',
    letterSpacing: 0,
    lineHeight: 10,
    map: 'simple',
    mode: 'braille',
    name: 'Soft Braille',
    negative: false,
    preview: '⣾⣿⣦\n⠈⠻⠿',
    threshold: 144,
  },
  {
    background: '#09090b',
    colorMode: 'source',
    colorTarget: 'foreground',
    description: 'Colorful Floyd–Steinberg dots',
    dither: true,
    fontId: 'system-mono',
    fontSize: 10,
    foreground: '#ffffff',
    id: 'dithered-color',
    letterSpacing: 0,
    lineHeight: 10,
    map: 'simple',
    mode: 'braille',
    name: 'Dithered color',
    negative: false,
    preview: '⡷⣯⢿\n⠛⠶⠤',
    threshold: 128,
  },
]
