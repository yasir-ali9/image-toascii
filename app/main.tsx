import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/inter'
import './index.css'
import Root from './app.tsx'
import { EditorProvider } from './lib/stores/editor/provider.tsx'
import { ThemeProvider } from './lib/theme/provider.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <EditorProvider>
        <Root />
      </EditorProvider>
    </ThemeProvider>
  </StrictMode>,
)
