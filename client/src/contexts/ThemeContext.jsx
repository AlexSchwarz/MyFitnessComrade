import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

export const ACCENT_COLORS = [
  { value: 'green', label: 'Green' },
  { value: 'blue', label: 'Blue' },
  { value: 'pink', label: 'Pink' },
  { value: 'purple', label: 'Purple' }
]

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => {
    const saved = localStorage.getItem('theme-mode')
    return saved || 'dark'
  })

  const [accentColor, setAccentColor] = useState(() => {
    const saved = localStorage.getItem('theme-accent')
    return saved || 'green'
  })

  const [lessNumbersMode, setLessNumbersMode] = useState(() => {
    const saved = localStorage.getItem('less-numbers-mode')
    return saved === 'true'
  })

  useEffect(() => {
    localStorage.setItem('theme-mode', mode)
    localStorage.setItem('theme-accent', accentColor)
    localStorage.setItem('less-numbers-mode', lessNumbersMode.toString())
    document.documentElement.setAttribute('data-theme', `${mode}-${accentColor}`)
  }, [mode, accentColor, lessNumbersMode])

  const toggleMode = () => {
    setMode(prev => prev === 'dark' ? 'light' : 'dark')
  }

  const toggleLessNumbersMode = () => {
    setLessNumbersMode(prev => !prev)
  }

  return (
    <ThemeContext.Provider value={{ mode, accentColor, toggleMode, setAccentColor, lessNumbersMode, toggleLessNumbersMode }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
