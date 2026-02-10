import React, { useEffect, useState, useRef } from 'react'
import { ChevronDown, Cpu, Check, RefreshCw } from 'lucide-react'
import { useChatStore } from '../store/chatStore'
import { getModels } from '../api'
import { cn } from '../lib/utils'

export default function ModelSelector() {
  const [isOpen, setIsOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { models, setModels, selectedModel, setSelectedModel } = useChatStore()
  const dropdownRef = useRef(null)

  useEffect(() => {
    loadModels()
  }, [])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const loadModels = async () => {
    setIsRefreshing(true)
    try {
      const data = await getModels()
      setModels(data)
      if (data.length > 0 && !data.find(m => m.name === selectedModel)) {
        setSelectedModel(data[0].name)
      }
    } catch (error) {
      console.error('Failed to load models:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleSelect = (model) => {
    setSelectedModel(model.name)
    setIsOpen(false)
  }

  const formatSize = (bytes) => {
    if (!bytes) return ''
    const gb = bytes / (1024 * 1024 * 1024)
    return gb >= 1 ? `${gb.toFixed(1)}GB` : `${Math.round(bytes / (1024 * 1024))}MB`
  }

  const selectedModelInfo = models.find(m => m.name === selectedModel)

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300",
          "glass shadow-md hover:shadow-lg",
          isOpen && "border-red-500/30 shadow-lg shadow-red-500/5"
        )}
      >
        <div className="w-6 h-6 rounded-lg bg-red-500/10 flex items-center justify-center">
          <Cpu className="h-3.5 w-3.5 text-red-500" />
        </div>
        <span className="truncate max-w-32 text-foreground">
          {selectedModelInfo ? selectedModelInfo.name.split(':')[0] : 'Select Model'}
        </span>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-300", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-80 glass-strong rounded-2xl shadow-2xl z-50 overflow-hidden animate-scaleIn">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/20">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Models</span>
            <button
              onClick={(e) => { e.stopPropagation(); loadModels(); }}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-red-500 transition-colors"
              title="Refresh models"
            >
              <RefreshCw className={cn("h-3 w-3", isRefreshing && "animate-spin")} />
              Refresh
            </button>
          </div>

          <div className="p-2 max-h-64 overflow-y-auto">
            {models.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-8">
                <Cpu className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p>No models available</p>
                <p className="text-xs mt-1 opacity-60">Make sure Ollama is running</p>
              </div>
            ) : (
              models.map((model) => (
                <button
                  key={model.name}
                  onClick={() => handleSelect(model)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all duration-200",
                    selectedModel === model.name
                      ? "bg-red-500/10 border border-red-500/20"
                      : "hover:bg-muted/30 border border-transparent"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold",
                      selectedModel === model.name
                        ? "bg-red-500/15 text-red-500"
                        : "bg-muted/30 text-muted-foreground"
                    )}>
                      {model.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className={cn(
                        "text-sm font-medium",
                        selectedModel === model.name ? "text-red-500" : "text-foreground"
                      )}>
                        {model.name}
                      </div>
                      <div className="text-[11px] text-muted-foreground/60 flex gap-1.5 mt-0.5">
                        {model.details?.parameter_size && <span>{model.details.parameter_size}</span>}
                        {model.size && <><span>·</span><span>{formatSize(model.size)}</span></>}
                        {model.details?.family && <><span>·</span><span>{model.details.family}</span></>}
                      </div>
                    </div>
                  </div>
                  {selectedModel === model.name && (
                    <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center">
                      <Check className="h-3 w-3 text-red-500" />
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}