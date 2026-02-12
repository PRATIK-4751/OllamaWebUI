import React, { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Chat from './components/Chat'
import ThemeToggle from './components/ThemeToggle'
import ModelSelector from './components/ModelSelector'
import config from './config'

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)


  useEffect(() => {
    document.title = config.appTitle
    document.documentElement.style.setProperty('--bg-dark', `url(${config.bgDark})`)
    document.documentElement.style.setProperty('--bg-light', `url(${config.bgLight})`)
  }, [])

  return (
    <div className="flex h-screen bg-background text-foreground bg-themed">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex-1 flex flex-col relative">
        <div className="absolute top-4 right-4 z-50 flex gap-2">
          <ThemeToggle />
        </div>
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-40">
          <ModelSelector />
        </div>
        <Chat sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      </div>
    </div>
  )
}

export default App
