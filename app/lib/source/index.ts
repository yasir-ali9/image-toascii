import type { SourceImage } from '../../components/modules/editor/types'

// Format imported byte sizes for the source details panel.
function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

// Resolve a useful filename from a remote URL and content type.
function getRemoteName(url: URL, type: string) {
  if (url.protocol !== 'data:') {
    const segment = url.pathname.split('/').filter(Boolean).at(-1)
    if (segment) return decodeURIComponent(segment)
  }

  const extension = type.split('/')[1]?.split('+')[0] || 'png'
  return `remote-image.${extension}`
}

// Decode one local image file into editor-ready source metadata.
export function decodeSource(file: File) {
  return new Promise<SourceImage>((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Choose an image file'))
      return
    }

    const url = URL.createObjectURL(file)
    const image = new Image()

    // Commit metadata after browser image decoding succeeds.
    image.onload = () => {
      resolve({
        height: image.naturalHeight,
        name: file.name || 'pasted-image.png',
        size: formatSize(file.size),
        url,
        width: image.naturalWidth,
      })
    }

    // Release invalid image data before rejecting it.
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('This image could not be decoded'))
    }

    image.src = url
  })
}

// Fetch a remote image into a local file safe for canvas conversion.
export async function fetchSource(value: string) {
  let url: URL

  try {
    url = new URL(value, window.location.origin)
  } catch {
    throw new Error('Enter a valid image URL')
  }

  if (!['data:', 'http:', 'https:'].includes(url.protocol)) {
    throw new Error('Use an HTTP, HTTPS, or data image URL')
  }

  let response: Response

  try {
    response = await fetch(url, { credentials: 'omit' })
  } catch {
    throw new Error('This host blocks direct browser imports. Download and drop the image instead')
  }

  if (!response.ok) throw new Error(`Image request failed with status ${response.status}`)

  const blob = await response.blob()
  if (!blob.type.startsWith('image/')) throw new Error('The URL did not return an image')

  return new File([blob], getRemoteName(url, blob.type), { type: blob.type })
}
