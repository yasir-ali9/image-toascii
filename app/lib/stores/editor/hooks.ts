import { createContext, useContext } from 'react'
import type { EditorEngine } from './index'

export const EditorContext = createContext<EditorEngine | null>(null)

// Read the current editor engine from context.
export function useEditorEngine() {
  const engine = useContext(EditorContext)
  if (!engine) throw new Error('useEditorEngine must be used within EditorProvider')
  return engine
}
