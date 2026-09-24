import { useState, type ReactNode } from 'react'
import { EditorContext } from './hooks'
import { EditorEngine } from './index'

type EditorProviderProps = {
  children: ReactNode
}

// Provide one stable editor engine for the application lifetime.
export function EditorProvider({ children }: EditorProviderProps) {
  const [engine] = useState(() => new EditorEngine())
  return <EditorContext.Provider value={engine}>{children}</EditorContext.Provider>
}
