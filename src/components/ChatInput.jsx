import React, { useState, useRef, useEffect } from 'react'
import { Send, X, FilePlus2, Square, Globe, Mic, MicOff, Link, FileBarChart } from 'lucide-react'
import { fileToBase64, parsePdf, fetchUrlContent } from '../api'
import { useChatStore } from '../store/chatStore'
import { useVoice } from '../hooks/useVoice'
import config from '../config'
import DocumentContext from './DocumentContext'

export default function ChatInput({ onSend, onStop, onAnalyze, disabled = false, isLoading = false }) {
  const [input, setInput] = useState('')
  const [images, setImages] = useState([])
  const [isUploading, setIsUploading] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [urlValue, setUrlValue] = useState('')
  const [isFetchingUrl, setIsFetchingUrl] = useState(false)
  const fileInputRef = useRef(null)
  const textareaRef = useRef(null)

  const { documents, addDocument, removeDocument, webSearchEnabled, setWebSearchEnabled } = useChatStore()
  const { isListening, transcript, isSupported: voiceSupported, startListening, stopListening } = useVoice()

  useEffect(() => {
    if (transcript) {
      setInput(prev => prev + transcript)
    }
  }, [transcript])

  const handleSubmit = (e) => {
    e.preventDefault()
    if ((!input.trim() && images.length === 0) || isLoading || disabled) return

    onSend(input, images.length > 0 ? images : undefined)
    setInput('')
    setImages([])
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleTextareaInput = (e) => {
    setInput(e.target.value)
    const textarea = e.target
    textarea.style.height = 'auto'
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px'
  }

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    setIsUploading(true)

    for (const file of files) {
      try {
        if (file.type === 'application/pdf') {
          // Parse PDF client-side
          const doc = await parsePdf(file)
          addDocument(doc)
        } else if (file.type.startsWith('image/')) {
          const base64 = await fileToBase64(file)
          setImages(prev => [...prev, base64])
        } else if (file.name.endsWith('.csv')) {
          // Read CSV text for LLM context
          const text = await new Promise((resolve) => {
            const reader = new FileReader()
            reader.onload = (e) => resolve(e.target.result)
            reader.readAsText(file)
          })
          // Add to context (truncated)
          addDocument({ name: file.name, content: text.slice(0, 10000), fileObject: file })
        }
      } catch (error) {
        console.error('Failed to process file:', error)
      }
    }

    setIsUploading(false)
    e.target.value = ''
  }

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleUrlFetch = async () => {
    if (!urlValue.trim()) return
    setIsFetchingUrl(true)
    const result = await fetchUrlContent(urlValue.trim())
    if (result) {
      addDocument({ name: result.title || urlValue, content: result.content, pages: null })
    }
    setIsFetchingUrl(false)
    setUrlValue('')
    setShowUrlInput(false)
  }

  const isDisabled = disabled

  return (
    <div className="p-4 transition-all duration-300">
      <DocumentContext documents={documents} onRemove={removeDocument} />

      {images.length > 0 && (
        <div className="flex gap-3 mb-4 flex-wrap animate-fadeIn">
          {images.map((img, idx) => (
            <div key={idx} className="relative group animate-scaleIn">
              <img
                src={`data:image/jpeg;base64,${img}`}
                alt="Preview"
                className="w-20 h-20 rounded-xl object-cover border border-border/50 shadow-md transition-transform duration-300 group-hover:scale-105"
              />
              <button
                onClick={() => removeImage(idx)}
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg hover:scale-110"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {showUrlInput && (
        <div className="flex gap-2 mb-3 animate-fadeIn">
          <input
            type="text"
            value={urlValue}
            onChange={(e) => setUrlValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleUrlFetch()}
            placeholder="Paste URL to fetch content..."
            className="flex-1 px-3 py-2 rounded-xl glass text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-red-500/30"
            autoFocus
          />
          <button
            onClick={handleUrlFetch}
            disabled={isFetchingUrl || !urlValue.trim()}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-red-500 text-white text-sm font-bold disabled:opacity-40 hover:scale-105 transition-all"
          >
            {isFetchingUrl ? '...' : 'Fetch'}
          </button>
          <button onClick={() => setShowUrlInput(false)} className="px-2 py-2 rounded-xl hover:bg-muted/50 text-muted-foreground">
            <X size={16} />
          </button>
        </div>
      )}

      <div className={`relative rounded-2xl transition-all duration-300 glass ${isFocused
        ? 'border-red-500/30 shadow-lg shadow-red-500/5'
        : 'border-border/30'
        } ${isDisabled ? 'opacity-60' : ''}`}>
        <div className="flex items-end gap-2 p-2">
<<<<<<< HEAD
=======
          {/* Attach button (images + PDFs + CSVs) */}
>>>>>>> 28c663c (Update application with latest changes to backend and frontend)
          {(config.enableImageUpload || config.enablePdfUpload) && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || isDisabled || isLoading}
              className="flex-shrink-0 h-10 w-10 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Attach files (images, PDFs, CSVs)"
            >
              {isUploading ? (
                <div className="w-5 h-5 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
              ) : (
                <FilePlus2 className="h-5 w-5" />
              )}
            </button>
          )}

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept={`${config.enableImageUpload ? 'image/*,' : ''}${config.enablePdfUpload ? 'application/pdf,' : ''}.csv`}
            multiple
            className="hidden"
          />

          {config.enableWebSearch && (
            <button
              type="button"
              onClick={() => setWebSearchEnabled(!webSearchEnabled)}
              className={`flex-shrink-0 h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-200 ${webSearchEnabled
                ? 'bg-red-500/15 text-red-500 ring-1 ring-red-500/30'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
                }`}
              title={webSearchEnabled ? 'Web search ON' : 'Web search OFF'}
            >
              <Globe className="h-5 w-5" />
            </button>
          )}

          {config.enableWebSearch && (
            <button
              type="button"
              onClick={() => setShowUrlInput(!showUrlInput)}
              className="flex-shrink-0 h-10 w-10 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all duration-200"
              title="Fetch URL content"
            >
              <Link className="h-5 w-5" />
            </button>
          )}






          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleTextareaInput}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={disabled ? 'Ollama not connected...' : isUploading ? 'Uploading...' : isListening ? 'Listening...' : 'Message Ollama...'}
            disabled={isDisabled}
            rows={1}
            className="flex-1 bg-transparent border-0 outline-none resize-none py-2.5 px-2 text-base text-foreground placeholder:text-muted-foreground/60 disabled:cursor-not-allowed min-h-[40px] max-h-[200px]"
            style={{ scrollbarWidth: 'thin' }}
          />

          {config.enableVoice && voiceSupported && (
            <button
              type="button"
              onClick={isListening ? stopListening : startListening}
              className={`flex-shrink-0 h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-200 ${isListening
                ? 'bg-red-500/20 text-red-500 ring-2 ring-red-500/40 animate-pulse'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
                }`}
              title={isListening ? 'Stop listening' : 'Voice input'}
            >
              {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </button>
          )}

          {isLoading ? (
            <button
              onClick={onStop}
              className="flex-shrink-0 h-10 w-10 rounded-xl flex items-center justify-center bg-red-500/20 text-red-500 hover:bg-red-500/30 transition-all duration-300 hover:scale-105 active:scale-95"
              title="Stop generation"
            >
              <Square className="h-4 w-4 fill-current" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={(!input.trim() && images.length === 0) || isDisabled || isUploading}
              className={`flex-shrink-0 h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed ${input.trim() || images.length > 0
                ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg shadow-red-500/20 hover:shadow-red-500/30 hover:scale-105 active:scale-95'
                : 'text-muted-foreground hover:bg-muted/80'
                }`}
            >
              <Send className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      <div className="text-[11px] text-muted-foreground/40 mt-2.5 text-center font-medium tracking-wide">
        Press Enter to send · Shift+Enter for new line
        {webSearchEnabled && <span className="text-red-500/60 ml-2">· Web Search ON</span>}
      </div>
    </div>
  )
}