import { observer } from 'mobx-react-lite'
import { useCallback, useEffect, useRef, useState, type DragEvent } from 'react'
import { decodeSource, fetchSource } from '../../../lib/source'
import { useEditorEngine } from '../../../lib/stores/editor/hooks'
import { Resizable } from '../../reusables/resizable'
import { Central } from './central'
import { LeftPanel } from './left-panel'
import { RightPanel } from './right-panel'
import type { SourceImage } from './types'

const initialSource: SourceImage = {
  height: 3403,
  name: '2.jpg',
  size: '0.5 MB',
  url: '/2.jpg',
  width: 3403,
}

// Render the three-part image editor layout.
export const Editor = observer(function Editor() {
  const [panelsCollapsed, setPanelsCollapsed] = useState(false)
  const [showOriginal, setShowOriginal] = useState(false)
  const [source, setSource] = useState<SourceImage | null>(initialSource)
  const editor = useEditorEngine()
  const dragDepthRef = useRef(0)
  const requestRef = useRef(0)

  // Toggle the side panels without changing their editor state.
  const togglePanels = useCallback(() => {
    setPanelsCollapsed((collapsed) => !collapsed)
  }, [])

  // Reveal the source image while the preview control is held.
  const showSource = useCallback(() => {
    setShowOriginal(true)
  }, [])

  // Restore the converted preview after releasing its control.
  const hideSource = useCallback(() => {
    setShowOriginal(false)
  }, [])

  // Keep source details available to linked editor managers.
  useEffect(() => {
    if (!source) return
    editor.layout.setSourceSize(source.width, source.height)
  }, [editor, source])

  // Release uploaded image URLs after replacement or unmount.
  useEffect(() => {
    return () => {
      if (source?.url.startsWith('blob:')) URL.revokeObjectURL(source.url)
    }
  }, [source?.url])

  // Decode and commit only the newest image import request.
  const importFile = useCallback(async (file: File, request = ++requestRef.current) => {
    editor.importer.start()

    try {
      const nextSource = await decodeSource(file)

      if (request !== requestRef.current) {
        URL.revokeObjectURL(nextSource.url)
        return
      }

      setSource(nextSource)
      editor.importer.resolve()
    } catch (error) {
      if (request !== requestRef.current) return
      const message = error instanceof Error ? error.message : 'Image import failed'
      editor.importer.reject(message)
    }
  }, [editor])

  // Load a bundled public image through the standard import path.
  const importLibraryImage = useCallback(async (url: string) => {
    const request = ++requestRef.current
    editor.importer.start()

    try {
      const file = await fetchSource(url)
      if (request !== requestRef.current) return
      await importFile(file, request)
    } catch (error) {
      if (request !== requestRef.current) return
      const message = error instanceof Error ? error.message : 'Image import failed'
      editor.importer.reject(message)
    }
  }, [editor, importFile])

  // Clear the active source and its generated output.
  const deleteSource = useCallback(() => {
    requestRef.current += 1
    editor.importer.resolve()
    editor.preview.clear()
    setSource(null)
  }, [editor])

  // Import the first pasted clipboard image without intercepting text paste.
  useEffect(() => {
    const paste = (event: ClipboardEvent) => {
      const item = Array.from(event.clipboardData?.items ?? []).find((entry) => entry.kind === 'file' && entry.type.startsWith('image/'))
      const file = item?.getAsFile() ?? Array.from(event.clipboardData?.files ?? []).find((entry) => entry.type.startsWith('image/'))
      if (!file) return
      event.preventDefault()
      void importFile(file)
    }

    window.addEventListener('paste', paste)
    return () => window.removeEventListener('paste', paste)
  }, [importFile])

  // Invalidate unfinished imports when the editor unmounts.
  useEffect(() => {
    return () => {
      requestRef.current += 1
    }
  }, [])

  // Show the drop target when image files enter the editor.
  const enterDrop = (event: DragEvent<HTMLElement>) => {
    if (!Array.from(event.dataTransfer.types).includes('Files')) return
    event.preventDefault()
    dragDepthRef.current += 1
    editor.importer.setDragging(true)
  }

  // Keep browser navigation disabled while dragging over the editor.
  const overDrop = (event: DragEvent<HTMLElement>) => {
    if (!Array.from(event.dataTransfer.types).includes('Files')) return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
  }

  // Hide the drop target only after leaving all nested editor elements.
  const leaveDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault()
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1)
    if (dragDepthRef.current === 0) editor.importer.setDragging(false)
  }

  // Import the first dropped image and reset drag state.
  const dropFile = (event: DragEvent<HTMLElement>) => {
    event.preventDefault()
    dragDepthRef.current = 0
    editor.importer.setDragging(false)
    const file = Array.from(event.dataTransfer.files).find((item) => item.type.startsWith('image/'))
    if (file) void importFile(file)
    else editor.importer.reject('Drop an image file')
  }

  return (
    <main
      className="relative flex h-screen min-h-[520px] w-full overflow-hidden bg-bk-60 text-fg-50"
      onDragEnter={enterDrop}
      onDragLeave={leaveDrop}
      onDragOver={overDrop}
      onDrop={dropFile}
    >
      {panelsCollapsed ? null : (
        <Resizable defaultWidth={260} maxWidth={400} minWidth={210} position="left">
          <LeftPanel onCollapse={togglePanels} onDelete={deleteSource} onFileSelect={importFile} onLibrarySelect={importLibraryImage} source={source} />
        </Resizable>
      )}

      <div className="h-full min-w-0 flex-1 overflow-hidden">
        <Central showOriginal={showOriginal} source={source} />
      </div>

      {panelsCollapsed ? null : (
        <Resizable defaultWidth={260} maxWidth={380} minWidth={220} position="right">
          <RightPanel onHideOriginal={hideSource} onShowOriginal={showSource} showOriginal={showOriginal} />
        </Resizable>
      )}

      {panelsCollapsed ? (
        <button
          aria-label="Show panels"
          className="absolute left-2 top-2 z-30 flex h-6 w-5 cursor-pointer items-center justify-center rounded text-fg-60 transition-colors hover:text-fg-30"
          onClick={togglePanels}
          type="button"
        >
          <svg
            aria-hidden="true"
            className="opacity-80"
            fill="none"
            height="14"
            viewBox="0 0 14 14"
            width="14"
          >
            <path
              d="M2.433 2.433C3.117 1.75 4.217 1.75 6.417 1.75L7.583 1.75C9.783 1.75 10.883 1.75 11.567 2.433C12.25 3.117 12.25 4.217 12.25 6.417L12.25 7.583C12.25 9.783 12.25 10.883 11.567 11.567C10.883 12.25 9.783 12.25 7.583 12.25L6.417 12.25C4.217 12.25 3.117 12.25 2.433 11.567C1.75 10.883 1.75 9.783 1.75 7.583L1.75 6.417C1.75 4.217 1.75 3.117 2.433 2.433ZM4.67 9.336L4.67 4.67"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      ) : null}

      {editor.importer.dragging ? (
        <div className="pointer-events-none absolute inset-2 z-50 flex items-center justify-center rounded-lg border border-dashed border-ac-01 bg-bk-60/90">
          <div className="rounded-md border border-bd-50 bg-bk-50 px-5 py-3 text-center shadow-xl">
            <p className="text-[12px] text-fg-40">Drop image to import</p>
            <p className="mt-1 text-[10px] text-fg-70">The current source will be replaced</p>
          </div>
        </div>
      ) : null}
    </main>
  )
})
