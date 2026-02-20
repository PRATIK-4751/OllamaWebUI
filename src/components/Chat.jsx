import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useChatStore } from '../store/chatStore'
import { streamChat, checkOllamaConnection, getWorkingUrl, searchWeb, searchImages, analyzeCsv } from '../api'
import config from '../config'
import Message from './Message'
import ChatInput from './ChatInput'
import TypingIndicator from './TypingIndicator'
import SearchResults from './SearchResults'
import ImageResults from './ImageResults'
import AnalysisResults from './AnalysisResults'
import PromptTemplates from './PromptTemplates'
import FileBrowser from './FileBrowser'
import { Button } from './ui/button'
import { MessageSquare, Menu, Plus, Zap, Brain, Shield, AlertCircle, Download, Edit2, ArrowDown } from 'lucide-react'

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
    renameChat,
  } = useChatStore()

  const messagesEndRef = useRef(null)
  const scrollRef = useRef(null)
  const abortRef = useRef(null)
  const [searchResults, setSearchResults] = useState(null)
  const [searchExpanded, setSearchExpanded] = useState(false)
  const [imageResults, setImageResults] = useState(null)
  const [imageQuery, setImageQuery] = useState('')
  const [fileBrowserOpen, setFileBrowserOpen] = useState(false)
  const [analysisData, setAnalysisData] = useState(null)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isRenaming, setIsRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState('')
  const [tokensPerSec, setTokensPerSec] = useState(0)
  const lastTokenTime = useRef(0)
  const tokenCount = useRef(0)

  useEffect(() => {
    const check = async () => {
      const ok = await checkOllamaConnection()
      setIsConnected(ok)
    }
    check()
    const interval = setInterval(check, 8000)
    return () => clearInterval(interval)
  }, [setIsConnected])

  // Power user shortcuts for speed
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+Shift+N → New Chat
      if (e.ctrlKey && e.shiftKey && e.key === 'N') {
        e.preventDefault()
        handleNewChat()
      }
      // Ctrl+B → Toggle Sidebar
      if (e.ctrlKey && e.key === 'b') {
        e.preventDefault()
        onToggleSidebar()
      }
      // Escape → Stop Generation
      if (e.key === 'Escape' && isLoading) {
        handleStopGeneration()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isLoading])

  // Letting the conversation flow naturally
  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
      setShowScrollButton(scrollHeight - scrollTop - clientHeight > 300)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Catching files dropped into the chat
  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = async (e) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)

    for (const file of files) {
      // Basic support for adding files to context via drag-drop
      // This reuses the logic from FileBrowser/ChatInput
      if (file.type.startsWith('image/') || file.type === 'application/pdf' || file.name.endsWith('.csv') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
        addDocument({
          name: file.name,
          type: file.type,
          size: file.size,
          fileObject: file
        })
      }
    }
  }

  // Giving the chat a fresh new name
  const handleRename = (e) => {
    e.preventDefault()
    if (currentChat && renameValue.trim()) {
      renameChat(currentChat.id, renameValue.trim())
      setIsRenaming(false)
    }
  }

  // Saving your thoughts for later
  const handleExport = () => {
    if (!currentChat) return
    const content = messages.map(m => `### ${m.role === 'user' ? 'User' : 'Assistant'}\n\n${m.content}`).join('\n\n')
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${currentChat.title || 'chat'}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  useEffect(() => {
    scrollToBottom()
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
    setAnalysisData(null)

    const userMsg = { role: 'user', content, timestamp: new Date().toISOString() }
    if (images && images.length > 0) {
      userMsg.images = images
    }
    addMessage(userMsg)
    addMessage({ role: 'assistant', content: '', timestamp: new Date().toISOString() })

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
          searchContext = data.results.map((r, i) =>
            `[${i + 1}] "${r.title}"\nSource: ${r.url}\n${r.content || r.snippet}`
          ).join('\n\n')
        }
      } catch (e) {
        console.error('Search failed:', e)
      }
    }

    if (webSearchEnabled) {
      try {
        const imgData = await searchImages(content)
        if (imgData.images && imgData.images.length > 0) {
          setImageResults(imgData.images.slice(0, 6))
          setImageQuery(content)
        }
      } catch (e) {
        console.error('Image search failed:', e)
      }
    }

    const now = new Date()
    const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    const dateContext = `\nToday is ${dateStr}, ${timeStr}.`

    const systemContent = searchContext
      ? `You are a helpful AI assistant with live web access. Today is ${dateStr}. You have just searched the web for the user's question. The search results are provided below. You MUST answer ONLY using the information from these search results. DO NOT make up facts. DO NOT use your training knowledge if it conflicts with the search results. Summarize the key facts from the search results and cite sources.${docContext}`
      : (config.systemPrompt || 'You are a helpful AI assistant.') + dateContext + docContext


    let finalUserContent = userMsg.content
    if (documents.length > 0) {
      const relevantDocs = documents.map(d => `--- FILE: ${d.name} ---\n${d.content.slice(0, 8000)}`).join('\n\n')
      finalUserContent = `${relevantDocs}\n\nQuestion: ${userMsg.content}`
    }

    // Build message history with RAG-style injection for search results
    const history = [
      { role: 'system', content: systemContent },
      ...messages,
    ]

    // Inject search results as a context block right before the user question
    if (searchContext) {
      history.push({
        role: 'user',
        content: `Search the web for: ${content}`
      })
      history.push({
        role: 'assistant',
        content: `I found the following information from the web:\n\n${searchContext}\n\nLet me now answer your question based on these search results.`
      })
      history.push({
        role: 'user',
        content: `Based on those search results, answer: ${finalUserContent}`
      })
    } else {
      history.push({ ...userMsg, content: finalUserContent })
    }

    const mappedHistory = history.map(m => ({
      role: m.role,
      content: m.content,
      ...(m.images ? { images: m.images } : {}),
    }))

    abortRef.current = new AbortController()


    const analysisKeywords = ['plot', 'graph', 'chart', 'analyze', 'visualization', 'heatmap', 'histogram', 'trend', 'visualise']
    const hasAnalysisKeyword = analysisKeywords.some(kw => content.toLowerCase().includes(kw))


    const csvDoc = documents.find(d => d.name.endsWith('.csv') && d.fileObject)

    if (hasAnalysisKeyword && csvDoc) {
      handleAnalyze(csvDoc.fileObject)
    }

    await streamChat(
      {
        model: selectedModel,
        messages: mappedHistory,
        temperature,
        num_ctx: contextWindow,
      },
      (token) => {
        updateLastMessage(token)

        // Measuring thought speed (t/s)
        const now = Date.now()
        if (now - lastTokenTime.current > 1000) {
          setTokensPerSec(tokenCount.current)
          tokenCount.current = 0
          lastTokenTime.current = now
        } else {
          tokenCount.current++
        }
      },
      () => {
        setIsLoading(false)
        persistMessages()
        setTokensPerSec(0)
        tokenCount.current = 0
      },
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

  const handleRegenerate = () => {
    // Find the last user message to re-send
    const lastUserIdx = [...messages].reverse().findIndex(m => m.role === 'user')
    if (lastUserIdx === -1) return
    const lastUser = messages[messages.length - 1 - lastUserIdx]
    // Remove last assistant message(s) after that user message
    const trimmedMessages = messages.slice(0, messages.length - lastUserIdx)
    // We can't easily modify store messages directly, so just re-send
    handleSend(lastUser.content, lastUser.images)
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

  const handleAnalyze = async (file) => {
    try {
      setIsLoading(true)
      const data = await analyzeCsv(file)
      setAnalysisData(data)
      setIsLoading(false)
    } catch (e) {
      console.error('Analysis failed:', e)
      setIsLoading(false)
      updateLastMessage(`Error analyzing data: ${e.message}`)
    }
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
    <div
      className="flex-1 flex flex-col h-full pt-16 relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="drag-overlay animate-fadeIn">
          <div className="text-center animate-bounce">
            <Plus className="h-16 w-16 mx-auto mb-4 text-primary" />
            <h3 className="text-2xl font-bold">Drop files to add to context</h3>
            <p className="text-muted-foreground">Images, PDFs, CSVs, Text</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between px-6 py-4 border-b border-border/10 glass z-10 transition-all duration-300">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onToggleSidebar} className="h-10 w-10 hover:bg-muted/50 rounded-xl">
            <Menu className="h-5 w-5" />
          </Button>
          <div className="group relative">
            {isRenaming ? (
              <form onSubmit={handleRename} className="flex items-center gap-2">
                <input
                  autoFocus
                  type="text"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={() => setIsRenaming(false)}
                  className="bg-transparent border-b border-primary outline-none font-bold text-lg min-w-[200px]"
                />
              </form>
            ) : (
              <div
                className="flex items-center gap-2 cursor-pointer"
                onDoubleClick={() => {
                  setRenameValue(currentChat.title)
                  setIsRenaming(true)
                }}
              >
                <h2 className="text-lg font-bold text-foreground truncate max-w-[200px] sm:max-w-xs group-hover:text-primary transition-colors">
                  {currentChat.title}
                </h2>
                <Edit2 className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
              </div>
            )}
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold flex items-center gap-2">
              {selectedModel}
              {isLoading && tokensPerSec > 0 && (
                <span className="text-emerald-500 animate-pulse tokens-indicator">
                  · {tokensPerSec} t/s
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <Button variant="ghost" size="sm" onClick={handleExport} className="h-8 w-8 p-0 rounded-full hover:bg-muted/50" title="Export Chat">
              <Download className="h-4 w-4" />
            </Button>
          )}

          {isConnected ? (
            <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase text-emerald-500 glass-subtle px-3 py-1.5 rounded-full shadow-sm shadow-emerald-500/10">
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

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-6 space-y-4 scroll-smooth"
      >
        {displayMessages.length === 0 && !showTyping && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground animate-fadeIn">
            <div className="w-20 h-20 rounded-3xl glass flex items-center justify-center mb-6 shadow-2xl">
              <MessageSquare className="h-10 w-10 opacity-20" />
            </div>
            <p className="text-xl font-bold mb-1">Begin the Dialogue</p>
            <p className="text-sm opacity-50 font-medium tracking-wide">Your local AI is ready to assist</p>

            { }
            {config.enablePromptTemplates && (
              <div className="mt-8">
                <PromptTemplates onSelect={handleTemplateSelect} />
              </div>
            )}
          </div>
        )}

        {displayMessages.map((msg, idx) => (
          <React.Fragment key={idx}>
            <Message
              role={msg.role}
              content={msg.content}
              images={msg.images}
              timestamp={msg.timestamp}
              isLast={msg.role === 'assistant' && idx === displayMessages.length - 1}
              onRegenerate={msg.role === 'assistant' && idx === displayMessages.length - 1 && !isLoading ? handleRegenerate : undefined}
            />
            { }
            {idx === displayMessages.length - 1 && analysisData && (
              <AnalysisResults data={analysisData} onClose={() => setAnalysisData(null)} />
            )}
            { }
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

      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-24 right-8 bg-primary/90 text-primary-foreground p-3 rounded-full shadow-lg hover:shadow-primary/30 transition-all duration-300 animate-scroll-bounce hover:scale-110 z-20 backdrop-blur-sm"
        >
          <ArrowDown className="h-5 w-5" />
        </button>
      )}

      <div className="border-t border-border/10 glass px-4 py-4 sm:px-6">
        <ChatInput
          onSend={handleSend}
          onStop={handleStopGeneration}
          onAnalyze={handleAnalyze}
          disabled={!isConnected}
          isLoading={isLoading}
          onOpenFileBrowser={() => setFileBrowserOpen(true)}
        />
      </div>

      { }
      <FileBrowser
        isOpen={fileBrowserOpen}
        onClose={() => setFileBrowserOpen(false)}
        onAddToContext={handleFileAdd}
      />
    </div>
  )
}
