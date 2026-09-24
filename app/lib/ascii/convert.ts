import type { ConversionOptions, ConversionResult } from './types'

const BRAILLE_BITS = [0x1, 0x8, 0x2, 0x10, 0x4, 0x20, 0x40, 0x80]
const DITHER_THRESHOLD = 128

type ConvertedText = {
  colors: string[] | null
  text: string
}

// Load a browser-readable image source.
function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.decoding = 'async'

    // Resolve only after the image pixels are ready.
    image.onload = () => resolve(image)

    // Reject invalid or unsupported image data.
    image.onerror = () => reject(new Error('Could not decode this image'))
    image.src = source
  })
}

// Match Go's standard grayscale luminance conversion.
function getLuminance(red: number, green: number, blue: number) {
  return (19595 * red + 38470 * green + 7471 * blue + 32768) >> 16
}

// Apply deterministic source brightness and contrast before text conversion.
function adjustTone(pixels: Uint8ClampedArray, brightness: number, contrast: number) {
  if (brightness === 0 && contrast === 0) return

  const brightnessOffset = brightness * 2.55
  const contrastFactor = 1 + contrast / 100

  // Adjust RGB channels while preserving each pixel's source alpha.
  for (let offset = 0; offset < pixels.length; offset += 4) {
    pixels[offset] = (pixels[offset] - 128) * contrastFactor + 128 + brightnessOffset
    pixels[offset + 1] = (pixels[offset + 1] - 128) * contrastFactor + 128 + brightnessOffset
    pixels[offset + 2] = (pixels[offset + 2] - 128) * contrastFactor + 128 + brightnessOffset
  }
}

// Map one grayscale value to the selected character table.
function getCharacter(luminance: number, map: string[], negative: boolean) {
  const lastIndex = map.length - 1
  const index =
    luminance === 255
      ? lastIndex
      : Math.trunc((luminance / 255) * map.length)

  return map[negative ? lastIndex - index : index]
}

// Resolve one display color from original or grayscale pixel data.
function getColor(pixels: Uint8ClampedArray, offset: number, options: ConversionOptions) {
  if (options.colorMode === 'mono') return null

  let red = pixels[offset]
  let green = pixels[offset + 1]
  let blue = pixels[offset + 2]

  if (options.colorMode === 'grayscale') {
    const luminance = getLuminance(red, green, blue)
    red = luminance
    green = luminance
    blue = luminance
  }

  if (options.negative) {
    red = 255 - red
    green = 255 - green
    blue = 255 - blue
  }

  return `rgb(${red} ${green} ${blue})`
}

// Quantize RGB pixels with Floyd–Steinberg error diffusion.
function ditherPixels(pixels: Uint8ClampedArray, width: number, height: number) {
  const values = new Float32Array(width * height * 3)
  const result = new Uint8Array(width * height)

  // Copy source RGB values into a mutable error buffer.
  for (let index = 0; index < result.length; index += 1) {
    const sourceOffset = index * 4
    const valueOffset = index * 3
    values[valueOffset] = pixels[sourceOffset]
    values[valueOffset + 1] = pixels[sourceOffset + 1]
    values[valueOffset + 2] = pixels[sourceOffset + 2]
  }

  // Spread three-channel quantization error into one neighbor.
  const spread = (index: number, red: number, green: number, blue: number, weight: number) => {
    const offset = index * 3
    values[offset] += red * weight
    values[offset + 1] += green * weight
    values[offset + 2] += blue * weight
  }

  // Quantize each RGB pixel and diffuse its error to unvisited neighbors.
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x
      const offset = index * 3
      const red = values[offset]
      const green = values[offset + 1]
      const blue = values[offset + 2]
      const nextValue = red + green + blue < 382.5 ? 0 : 255
      const redError = red - nextValue
      const greenError = green - nextValue
      const blueError = blue - nextValue
      result[index] = nextValue

      if (x + 1 < width) spread(index + 1, redError, greenError, blueError, 7 / 16)
      if (y + 1 >= height) continue
      if (x > 0) spread(index + width - 1, redError, greenError, blueError, 3 / 16)
      spread(index + width, redError, greenError, blueError, 5 / 16)
      if (x + 1 < width) spread(index + width + 1, redError, greenError, blueError, 1 / 16)
    }
  }

  return result
}

// Convert resized pixels through the selected density map.
function convertToMappedText(pixels: Uint8ClampedArray, width: number, height: number, options: ConversionOptions): ConvertedText {
  const map = Array.from(options.map)
  const colors = options.colorMode === 'mono' ? null : [] as string[]
  const lines: string[] = []

  // Convert every resized pixel into one character.
  for (let y = 0; y < height; y += 1) {
    let line = ''

    // Build one output row without temporary pixel objects.
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 4
      const luminance = getLuminance(pixels[offset], pixels[offset + 1], pixels[offset + 2])
      line += getCharacter(luminance, map, options.negative)

      const color = getColor(pixels, offset, options)
      if (colors && color) colors.push(color)
    }

    lines.push(line)
  }

  return { colors, text: lines.join('\n') }
}

// Pack each two-by-four pixel cell into one Unicode Braille character.
function convertToBraille(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  options: ConversionOptions,
  dithered: Uint8Array | null,
): ConvertedText {
  const pixelWidth = width * 2
  const colors = options.colorMode === 'mono' ? null : [] as string[]
  const lines: string[] = []

  // Build one row of Braille cells at a time.
  for (let y = 0; y < height; y += 1) {
    let line = ''

    // Evaluate all eight dots inside the current cell.
    for (let x = 0; x < width; x += 1) {
      let dots = 0

      // Set the corresponding bit when a pixel dot is bright enough.
      for (let dotY = 0; dotY < 4; dotY += 1) {
        for (let dotX = 0; dotX < 2; dotX += 1) {
          const pixelX = x * 2 + dotX
          const pixelY = y * 4 + dotY
          const offset = (pixelY * pixelWidth + pixelX) * 4
          const luminance = dithered
            ? dithered[pixelY * pixelWidth + pixelX]
            : getLuminance(pixels[offset], pixels[offset + 1], pixels[offset + 2])
          const threshold = dithered ? DITHER_THRESHOLD : options.threshold
          const visible = options.negative ? luminance <= threshold : luminance >= threshold
          if (visible) dots += BRAILLE_BITS[dotY * 2 + dotX]
        }
      }

      line += String.fromCodePoint(0x2800 + dots)
      const color = getColor(pixels, (y * 4 * pixelWidth + x * 2) * 4, options)
      if (colors && color) colors.push(color)
    }

    lines.push(line)
  }

  return { colors, text: lines.join('\n') }
}

// Convert one static image into monochrome text at explicit character dimensions.
export async function convertImage(
  source: string,
  width: number,
  height: number,
  options: ConversionOptions,
): Promise<ConversionResult> {
  const image = await loadImage(source)
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d', { willReadFrequently: true })

  if (!context) throw new Error('Could not create the image workspace')

  const pixelWidth = options.mode === 'braille' ? width * 2 : width
  const pixelHeight = options.mode === 'braille' ? height * 4 : height

  canvas.width = pixelWidth
  canvas.height = pixelHeight
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  context.clearRect(0, 0, pixelWidth, pixelHeight)
  context.save()
  context.translate(options.flipX ? pixelWidth : 0, options.flipY ? pixelHeight : 0)
  context.scale(options.flipX ? -1 : 1, options.flipY ? -1 : 1)
  context.drawImage(image, 0, 0, pixelWidth, pixelHeight)
  context.restore()

  const pixels = context.getImageData(0, 0, pixelWidth, pixelHeight).data
  adjustTone(pixels, options.brightness, options.contrast)
  const dithered = options.mode === 'braille' && options.dither
    ? ditherPixels(pixels, pixelWidth, pixelHeight)
    : null
  const converted = options.mode === 'braille'
    ? convertToBraille(pixels, width, height, options, dithered)
    : convertToMappedText(pixels, width, height, options)

  return {
    colors: converted.colors,
    height,
    text: converted.text,
    width,
  }
}
