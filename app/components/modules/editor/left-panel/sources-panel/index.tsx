import { useRef } from 'react'
import { Tooltip } from '../../../../reusables/tooltip'
import type { SourceImage } from '../../types'
import { libraryImages } from './library'
import { Presets } from './presets'

type SourcesPanelProps = {
  onDelete: () => void
  onFileSelect: (file: File) => void
  onLibrarySelect: (url: string) => void
  source: SourceImage | null
}

// Render the selected source list with reference-style rows.
export function SourcesPanel({ onDelete, onFileSelect, onLibrarySelect, source }: SourcesPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const selectedLibraryImage = libraryImages.find((image) => image.name === source?.name)

  // Forward a replacement image to the editor shell.
  const changeFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) onFileSelect(file)
    event.target.value = ''
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex w-full shrink-0 items-center justify-between px-3 pb-2 pt-3">
        <span className="text-[12px] text-fg-50">Image</span>
        <span className="text-[10px] text-fg-60">{libraryImages.length}</span>
      </div>

      <div className="shrink-0 px-2">
        {source ? (
          <div className="flex min-h-11 w-full items-center gap-2 rounded border border-bd-60 bg-bk-30 px-1.5 py-1 text-left">
            <img
              alt={selectedLibraryImage?.label ?? source.name}
              className="h-8 w-9 shrink-0 rounded border border-white/10 bg-bk-70 object-cover shadow-inner"
              draggable={false}
              src={source.url}
            />
            <span className="min-w-0 flex-1 truncate text-[11px] text-fg-50">{selectedLibraryImage?.label ?? source.name}</span>
            <div className="flex shrink-0 items-center">
              <Tooltip content="Replace image">
                <button
                  aria-label="Replace image"
                  className="flex h-6 w-5 cursor-pointer items-center justify-center rounded text-fg-60 transition-colors hover:bg-bk-20 hover:text-fg-30"
                  onClick={() => inputRef.current?.click()}
                  type="button"
                >
                  <svg aria-hidden="true" className="-translate-y-px opacity-80" height="13" viewBox="0 0 12 12" width="13">
                    <path d="M6 2a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 6 2" fill="currentColor" />
                  </svg>
                </button>
              </Tooltip>
              <Tooltip content="Delete image">
                <button
                  aria-label="Delete image"
                  className="flex h-6 w-5 cursor-pointer items-center justify-center rounded text-fg-60 transition-colors hover:bg-bk-20 hover:text-fg-30"
                  onClick={onDelete}
                  type="button"
                >
                  <svg aria-hidden="true" fill="none" height="12" viewBox="0 0 24 24" width="12">
                    <path d="M20.5 6h-17m15.333 2.5l-.46 6.9c-.177 2.654-.265 3.981-1.13 4.79s-2.196.81-4.856.81h-.774c-2.66 0-3.991 0-4.856-.81c-.865-.809-.954-2.136-1.13-4.79l-.46-6.9M9.17 4a3.001 3.001 0 0 1 5.66 0" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
                  </svg>
                </button>
              </Tooltip>
            </div>
          </div>
        ) : (
          <button
            className="flex h-7 w-full items-center justify-center gap-1.5 rounded border border-bd-50 bg-bk-30 px-2 text-[11px] text-fg-50 transition-colors hover:border-bd-60 hover:bg-bk-20 hover:text-fg-30"
            onClick={() => inputRef.current?.click()}
            type="button"
          >
            <svg aria-hidden="true" height="12" viewBox="0 0 12 12" width="12">
              <path d="M6 2a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 6 2" fill="currentColor" />
            </svg>
            <span>Import Image</span>
          </button>
        )}
        <input accept="image/*" className="hidden" onChange={changeFile} ref={inputRef} type="file" />
      </div>

      <div className="grid shrink-0 grid-cols-4 gap-1 px-2 pt-1">
        {libraryImages.map((image) => {
          const selected = source?.name === image.name

          return (
            <button
              aria-label={`Preview ${image.label}`}
              aria-pressed={selected}
              className="h-10 cursor-pointer overflow-hidden rounded border border-transparent bg-bk-30 p-0.5 transition-colors hover:bg-bk-20"
              key={image.url}
              onClick={() => onLibrarySelect(image.url)}
              type="button"
            >
              <img alt="" className="h-full w-full rounded-sm bg-bk-70 object-cover" draggable={false} src={image.url} />
            </button>
          )
        })}
      </div>

      <Presets source={source} />
    </div>
  )
}
