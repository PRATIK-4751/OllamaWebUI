import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useChatStore } from '../store/chatStore'
import { streamChat, checkOllamaConnection, getWorkingUrl, searchWeb, searchImages } from '../api'
import config from '../config'
import Message from './Message'
import ChatInput from './ChatInput'
import TypingIndicator from './TypingIndicator'
import SearchResults from './SearchResults'
import ImageResults from './ImageResults'
import PromptTemplates from './PromptTemplates'
import FileBrowser from './FileBrowser'
import { Button } from './ui/button'
import { MessageSquare, Menu, Plus, Zap, Brain, Shield, AlertCircle } from 'lucide-react'

export default function Chat({ sidebarOpen, onToggleSidebar }) {
  const {
    currentChat,
    messages,
    addMessage,
    updateLastMessage,
    persistMessages,
    createChat,
    selectedModel,
    temperature,
    contextWindow,
    isLoading,
    setIsLoading,
    isConnected,
    setIsConnected,
    documents,
    addDocument,
    webSearchEnabled,
  } = useChatStore()

  const messagesEndRef = useRef(null)
  const abortRef = useRef(null)
  const [searchResults, setSearchResults] = useState(null)
  const [searchExpanded, setSearchExpanded] = useState(false)
  const [imageResults, setImageResults] = useState(null)
  const [imageQuery, setImageQuery] = useState('')
  const [fileBrowserOpen, setFileBrowserOpen] = useState(false)

  useEffect(() => {
    const check = async () => {
      const ok = await checkOllamaConnection()
      setIsConnected(ok)
    }
    check()
    const interval = setInterval(check, 8000)
    return () => clearInterval(interval)
  }, [setIsConnected])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleNewChat = () => {
    createChat('New Chat')
  }

  const handleSend = async (content, images) => {
    if (!currentChat || !isConnected) return

    setIsLoading(true)
    setSearchResults(null)
    setImageResults(null)
    setImageQuery('')

    const userMsg = { role: 'user', content }
    if (images && images.length > 0) {
      userMsg.images = images
    }
    addMessage(userMsg)
    addMessage({ role: 'assistant', content: '' })

    let docContext = ''
    if (documents.length > 0) {
      docContext = '\n\n--- DOCUMENT CONTEXT ---\n' +
        documents.map(d => `[${d.name}]:\n${d.content.slice(0, 6000)}`).join('\n\n') +
        '\n--- END DOCUMENT CONTEXT ---\n\nUse the document context above to answer questions when relevant.'
    }

    let searchContext = ''
    if (webSearchEnabled) {
      try {
        const data = await searchWeb(content)
        if (data.results && data.results.length > 0) {
          setSearchResults(data.results)
          setSearchExpanded(false)
          searchContext = '\n\n--- WEB SEARCH RESULTS ---\n' +
            data.results.map((r, i) => `[${i + 1}] ${r.title}\nURL: ${r.url}\n${r.content || r.snippet}`).join('\n\n') +
            '\n--- END SEARCH RESULTS ---\n\nUse the search results above to provide an informed, up-to-date answer. Cite sources when possible.'
        }
      } catch (e) {
        console.error('Search failed:', e)
      }
    }

    if (webSearchEnabled) {
      try {
        const imgData = await searchImages(content)
        if (imgData.images && imgData.images.length > 0) {
          setImageResults(imgData.images.slice(0, 4))
          setImageQuery(content)
        }
      } catch (e) {
        console.error('Image search failed:', e)
      }
    }

    const now = new Date()
    const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    const dateContext = `\nCurrent date and time: ${dateStr}, ${timeStr}.`
    const systemContent = (config.systemPrompt || 'You are a helpful AI assistant.') + dateContext + docContext + searchContext

    const history = [
      { role: 'system', content: systemContent },
      ...messages,
      userMsg
    ].map(m => ({
      role: m.role,
      content: m.content,
      ...(m.images ? { images: m.images } : {}),
    }))

    abortRef.current = new AbortController()

    await streamChat(
      {
        model: selectedModel,
        messages: history,
        temperature,
        num_ctx: contextWindow,
      },
      (token) => updateLastMessage(token),
      () => { setIsLoading(false); persistMessages() },
      (error) => {
        console.error('Chat error:', error)
        updateLastMessage(`\n\nError: ${error}`)
        setIsLoading(false)
        persistMessages()
      },
      abortRef.current.signal
    )
  }

  const handleStopGeneration = () => {
    if (abortRef.current) {
      abortRef.current.abort()
      setIsLoading(false)
      persistMessages()
    }
  }

  const handleTemplateSelect = (prompt) => {
    if (!currentChat) {
      createChat('New Chat')
    }
    const textarea = document.querySelector('textarea')
    if (textarea) {
      textarea.value = prompt + ' '
      textarea.focus()
      textarea.dispatchEvent(new Event('input', { bubbles: true }))
    }
  }

  const handleFileAdd = (doc) => {
    addDocument(doc)
    setFileBrowserOpen(false)
  }

  const showTyping = isLoading && messages.length > 0 &&
    messages[messages.length - 1]?.role === 'assistant' &&
    messages[messages.length - 1]?.content === ''

  const displayMessages = messages.filter((msg, idx) => {
    if (msg.role === 'assistant' && msg.content === '' && idx === messages.length - 1) return false
    return true
  })

  if (!currentChat) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 transition-all duration-500 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-25 blur-[160px] pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(180,100,50,0.4) 0%, rgba(220,38,38,0.2) 40%, transparent 70%)' }}
        />

        <div className="text-center max-w-lg animate-fadeIn relative z-10">
          <div className="relative w-36 h-36 mx-auto mb-8 group">
            <div className="absolute -inset-3 rounded-3xl animate-warm-glow"
              style={{ border: '2px solid rgba(180,150,100,0.15)' }} />
            <div className="relative w-36 h-36 rounded-3xl overflow-hidden shadow-2xl transition-transform duration-500 group-hover:scale-105"
              style={{
                border: '3px solid rgba(180,150,100,0.2)',
                boxShadow: '0 20px 60px -15px rgba(0,0,0,0.3), inset 0 0 30px rgba(180,150,100,0.05)'
              }}>
              <img
                src={config.logoImage}
                alt={config.appTitle}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-red-500/5 pointer-events-none" />
            </div>
            <div className="absolute inset-0 animate-spin-slow">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-amber-500/70 shadow-lg shadow-amber-500/30" />
            </div>
          </div>

          <h2 className="text-5xl font-bold mb-3 tracking-tight">
            <span className="bg-gradient-to-r from-amber-600 via-red-500 to-rose-500 bg-clip-text text-transparent">
              {config.appTitle}
            </span>
          </h2>
          <p className="text-muted-foreground mb-10 text-lg leading-relaxed opacity-80">
            {config.appSubtitle}
          </p>

          <div className="grid grid-cols-3 gap-4 mb-10">
            <div className="glass-card p-5 rounded-2xl hover:-translate-y-1 transition-all duration-300">
              <Zap className="h-6 w-6 text-amber-500 mx-auto mb-2" />
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{config.feature1Label}</p>
            </div>
            <div className="glass-card p-5 rounded-2xl hover:-translate-y-1 transition-all duration-300">
              <Brain className="h-6 w-6 text-red-400 mx-auto mb-2" />
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{config.feature2Label}</p>
            </div>
            <div className="glass-card p-5 rounded-2xl hover:-translate-y-1 transition-all duration-300">
              <Shield className="h-6 w-6 text-emerald-400 mx-auto mb-2" />
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{config.feature3Label}</p>
            </div>
          </div>




          <div className="flex gap-4 justify-center flex-wrap">
            <Button
              onClick={handleNewChat}
              className="h-14 gap-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 px-10 text-lg font-bold shadow-xl shadow-red-500/20 hover:shadow-red-500/40 transition-all duration-300 hover:-translate-y-1 text-white border-0 rounded-2xl"
            >
              <Plus className="h-6 w-6" />
              Start Chatting
            </Button>
            <Button
              onClick={onToggleSidebar}
              variant="outline"
              className="h-14 gap-2 px-10 text-lg font-bold hover:-translate-y-1 transition-all duration-300 glass rounded-2xl"
            >
              <Menu className="h-6 w-6" />
              History
            </Button>
          </div>

          <div className="mt-12 group relative">
            <div className="flex items-center justify-center gap-3 text-[11px] font-bold tracking-[0.2em] uppercase transition-all duration-500">
              {isConnected ? (
                <div className="flex items-center gap-2 text-emerald-500/80">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                  Local AI Ready
                </div>
              ) : (
                <div className="flex items-center gap-2 text-amber-500/60">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Connecting to {getWorkingUrl().replace('http://', '')}...
                </div>
              )}
            </div>
            {!isConnected && (
              <div className="mt-4 text-[10px] text-muted-foreground/40 max-w-xs mx-auto leading-relaxed animate-fadeIn opacity-0 group-hover:opacity-100 transition-opacity">
                Note: Online browsers may block local AI. Click site settings icon → "Allow Insecure Content" &amp; Refresh.
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full pt-16">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/10 glass">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onToggleSidebar} className="h-10 w-10 hover:bg-muted/50 rounded-xl">
            <Menu className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-lg font-bold text-foreground truncate max-w-[200px] sm:max-w-xs">
              {currentChat.title}
            </h2>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{selectedModel}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isConnected ? (
            <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase text-emerald-500 glass-subtle px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Connected
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase text-amber-500 glass-subtle px-3 py-1.5 rounded-full">
              <div className="w-3 h-3 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
              Detecting...
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {displayMessages.length === 0 && !showTyping && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground animate-fadeIn">
            <div className="w-20 h-20 rounded-3xl glass flex items-center justify-center mb-6 shadow-2xl">
              <MessageSquare className="h-10 w-10 opacity-20" />
            </div>
            <p className="text-xl font-bold mb-1">Begin the Dialogue</p>
            <p className="text-sm opacity-50 font-medium tracking-wide">Your local AI is ready to assist</p>

            {/* Templates in chat view too */}
            {config.enablePromptTemplates && (
              <div className="mt-8">
                <PromptTemplates onSelect={handleTemplateSelect} />
              </div>
            )}
          </div>
        )}

        {displayMessages.map((msg, idx) => (
          <React.Fragment key={idx}>
            <Message role={msg.role} content={msg.content} images={msg.images} />
            {/* Show search results + images after the last assistant message that used search */}
            {msg.role === 'assistant' && idx === displayMessages.length - 1 && (
              <>
                {searchResults && (
                  <SearchResults
                    results={searchResults}
                    isExpanded={searchExpanded}
                    onToggle={() => setSearchExpanded(!searchExpanded)}
                  />
                )}
                {imageResults && (
                  <ImageResults images={imageResults} query={imageQuery} />
                )}
              </>
            )}
          </React.Fragment>
        ))}
        {showTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-border/10 glass px-4 py-4 sm:px-6">
        <ChatInput
          onSend={handleSend}
          onStop={handleStopGeneration}
          disabled={!isConnected}
          isLoading={isLoading}
          onOpenFileBrowser={() => setFileBrowserOpen(true)}
        />
      </div>

      {/* File Browser Modal */}
      <FileBrowser
        isOpen={fileBrowserOpen}
        onClose={() => setFileBrowserOpen(false)}
        onAddToContext={handleFileAdd}
      />
    </div>
  )
}