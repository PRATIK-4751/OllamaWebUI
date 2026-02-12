import React, { useState, useEffect } from 'react'
import { Moon, Sun } from 'lucide-react'
import config from '../config'

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    let initialTheme = savedTheme

    if (!initialTheme) {
      if (config.defaultTheme === 'system') {
        initialTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      } else {
        initialTheme = config.defaultTheme
      }
    }

    setIsDark(initialTheme === 'dark')
    document.documentElement.classList.toggle('light', initialTheme === 'light')
  }, [])

  const toggleTheme = () => {
    const newTheme = !isDark ? 'dark' : 'light'
    setIsDark(!isDark)
    document.documentElement.classList.toggle('light', !isDark === false)
    localStorage.setItem('theme', newTheme)
  }

  return (
    <button
      onClick={toggleTheme}
      className="relative h-9 w-9 rounded-xl glass shadow-md flex items-center justify-center transition-all duration-300 hover:shadow-lg hover:border-red-500/20 hover:scale-105 active:scale-95 group"
      aria-label="Toggle theme"
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <Sun className={`h-4 w-4 absolute transition-all duration-500 ${isDark ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100 text-amber-500'}`} />
      <Moon className={`h-4 w-4 absolute transition-all duration-500 ${isDark ? 'opacity-100 rotate-0 scale-100 text-red-400' : 'opacity-0 -rotate-90 scale-0'}`} />
    </button>
  )
}
