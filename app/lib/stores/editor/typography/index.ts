import { makeAutoObservable, runInAction } from 'mobx'
import { FALLBACK_FONTS, getFontFamily, type FontOption } from '../../../fonts'

type FontData = {
  family: string
  fullName: string
  postscriptName: string
  style: string
}

type FontWindow = Window & {
  queryLocalFonts?: () => Promise<FontData[]>
}

export type FontStatus = 'denied' | 'granted' | 'idle' | 'loading' | 'unsupported'

// Keep one typography value inside its editor range.
function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Math.round(value * 10) / 10))
}

// Manage text metrics and permission-gated local font discovery.
export class TypographyManager {
  fontFamily = FALLBACK_FONTS[0].family
  fontId = FALLBACK_FONTS[0].id
  fontName = FALLBACK_FONTS[0].name
  fontSize = 10
  letterSpacing = 0
  lineHeight = 10
  localFonts: FontOption[] = []
  status: FontStatus = 'idle'

  // Observe compact settings while leaving a potentially large catalog plain.
  constructor() {
    makeAutoObservable(this, { localFonts: false }, { autoBind: true })
  }

  // Request the installed font catalog from a supporting browser.
  async loadLocalFonts() {
    if (this.status === 'loading' || this.status === 'granted') return
    const query = (window as FontWindow).queryLocalFonts

    if (!query) {
      this.status = 'unsupported'
      return
    }

    this.status = 'loading'

    try {
      const results = await query.call(window)
      const families = new Map<string, FontOption>()

      // Keep one searchable preview row per discovered font family.
      for (const font of results) {
        const name = font.family.trim()
        if (!name || families.has(name.toLocaleLowerCase())) continue
        families.set(name.toLocaleLowerCase(), {
          family: getFontFamily(name),
          id: `local-${font.postscriptName || name}`,
          name,
          source: 'local',
        })
      }

      const localFonts = Array.from(families.values()).sort((left, right) => left.name.localeCompare(right.name))

      runInAction(() => {
        this.localFonts = localFonts
        this.status = 'granted'
      })
    } catch {
      runInAction(() => {
        this.status = 'denied'
      })
    }
  }

  // Select a font from the fallback or granted local catalog.
  setFont(font: FontOption) {
    this.fontFamily = font.family
    this.fontId = font.id
    this.fontName = font.name
  }

  // Set preview and export glyph size.
  setFontSize(value: number) {
    this.fontSize = clamp(value, 6, 32)
  }

  // Set baseline-to-baseline row distance.
  setLineHeight(value: number) {
    this.lineHeight = clamp(value, 6, 48)
  }

  // Set horizontal spacing added to each character cell.
  setLetterSpacing(value: number) {
    this.letterSpacing = clamp(value, -4, 12)
  }
}
