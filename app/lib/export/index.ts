import type { ConversionResult } from '../ascii/types'
import { getFrameSize, renderFrame, type RenderStyle } from '../render'

const EXPORT_SCALE = 1.6

// Escape text and attributes before inserting them into vector markup.
function escapeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

// Format opacity as a compact normalized vector value.
function formatOpacity(value: number) {
  return String(Math.round(value) / 100)
}

// Generate scalable text and cell geometry without bitmap content.
export function createSvg(result: ConversionResult, style: RenderStyle) {
  const { height, width } = getFrameSize(result, style)
  const lines = result.text.split('\n')
  const glyphWidth = Math.max(0.1, style.characterWidth - style.letterSpacing)
  const backgroundOpacity = formatOpacity(style.backgroundOpacity)
  const foregroundOpacity = formatOpacity(style.foregroundOpacity)
  const elements: string[] = []

  if (style.backgroundOpacity > 0) {
    elements.push(`<rect width="${width}" height="${height}" fill="${escapeXml(style.background)}" fill-opacity="${backgroundOpacity}"/>`)
  }

  // Build one vector cell and glyph at each conversion coordinate.
  for (let row = 0; row < result.height; row += 1) {
    const characters = [...(lines[row] ?? '')]

    // Preserve exact column geometry across every row.
    for (let column = 0; column < result.width; column += 1) {
      const index = row * result.width + column
      const color = result.colors?.[index]
      const character = characters[column] ?? ' '
      const x = style.paddingLeft + column * style.characterWidth
      const y = style.paddingTop + row * style.characterHeight

      // Emit source-colored cells only when the background channel is visible.
      if (color && style.colorTarget === 'background' && style.backgroundOpacity > 0) {
        elements.push(`<rect x="${x}" y="${y}" width="${style.characterWidth}" height="${style.characterHeight}" fill="${escapeXml(color)}" fill-opacity="${backgroundOpacity}"/>`)
      }

      // Skip invisible glyph nodes to keep exported markup compact.
      if (character === ' ' || style.foregroundOpacity === 0) continue

      const fill = color && style.colorTarget === 'foreground' ? color : style.foreground
      elements.push(`<text x="${x}" y="${y}" fill="${escapeXml(fill)}" fill-opacity="${foregroundOpacity}" font-family="${escapeXml(style.fontFamily)}" font-size="${style.fontSize}" dominant-baseline="text-before-edge" textLength="${glyphWidth}" lengthAdjust="spacingAndGlyphs" xml:space="preserve">${escapeXml(character)}</text>`)
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${elements.join('')}</svg>`
}

// Rasterize one styled conversion result at the shared export resolution.
function createPngBlob(result: ConversionResult, style: RenderStyle) {
  const canvas = document.createElement('canvas')
  renderFrame(canvas, result, style, undefined, 0, { contentScale: EXPORT_SCALE })

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((value) => {
      if (value) resolve(value)
      else reject(new Error('Could not encode the PNG image'))
    }, 'image/png')
  })
}

// Trigger a browser download for one generated file.
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.download = filename
  link.href = url
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

// Copy generated text with a fallback for restricted clipboard contexts.
export async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return
    } catch {
      // Fall through to the local selection method when permission is denied.
    }
  }

  const input = document.createElement('textarea')
  input.value = text
  input.style.position = 'fixed'
  input.style.opacity = '0'
  document.body.appendChild(input)
  input.select()
  const copied = document.execCommand('copy')
  input.remove()
  if (!copied) throw new Error('Clipboard access was denied')
}

// Download generated output as a UTF-8 text file.
export function downloadText(text: string, filename: string) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  downloadBlob(blob, `${filename}.txt`)
}

// Render the exact text styling into a downloadable PNG.
export async function downloadImage(result: ConversionResult, style: RenderStyle, filename: string) {
  const blob = await createPngBlob(result, style)

  downloadBlob(blob, `${filename}.png`)
}

// Download generated output as native vector markup.
export function downloadSvg(result: ConversionResult, style: RenderStyle, filename: string) {
  const svg = createSvg(result, style)
  downloadBlob(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }), `${filename}.svg`)
}

// Copy a rendered PNG through the browser's image clipboard API.
export async function copyImage(result: ConversionResult, style: RenderStyle) {
  if (!navigator.clipboard?.write || !window.ClipboardItem) throw new Error('Image clipboard access is unavailable')
  const blob = await createPngBlob(result, style)
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
}
