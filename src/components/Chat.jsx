import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useChatStore } from '../store/chatStore'
import { streamChat, checkOllamaConnection } from '../api'
import config from '../config'
import Message from './Message'
import ChatInput from './ChatInput'
import TypingIndicator from './TypingIndicator'
import { Button } from './ui/button'
import { MessageSquare, Menu, Plus, Loader2, Zap, Brain, Shield, AlertCircle } from 'lucide-react'

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
  } = useChatStore()

  const messagesEndRef = useRef(null)
  const abortRef = useRef(null)

  // Check Ollama connection on mount and periodically
  useEffect(() => {
    const check = async () => {
      const ok = await checkOllamaConnection()
      setIsConnected(ok)
    }
    check()
    const interval = setInterval(check, 10000)
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

    const userMsg = { role: 'user', content }
    if (images && images.length > 0) {
      userMsg.images = images
    }
    addMessage(userMsg)
    addMessage({ role: 'assistant', content: '' })

    // Build message history with system prompt
    const history = [
      { role: 'system', content: config.systemPrompt || 'You are a helpful AI assistant.' },
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
        updateLastMessage(`\n\n⚠️ Error: ${error}`)
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

  const showTyping = isLoading && messages.length > 0 &&
    messages[messages.length - 1]?.role === 'assistant' &&
    messages[messages.length - 1]?.content === ''

  const displayMessages = messages.filter((msg, idx) => {
    if (msg.role === 'assistant' && msg.content === '' && idx === messages.length - 1) return false
    return true
  })

  // ========== Welcome Screen ==========
  if (!currentChat) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 transition-all duration-500 relative overflow-hidden">
        {/* Warm ambient glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-20 blur-[160px] pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(180,100,50,0.4) 0%, rgba(220,38,38,0.2) 40%, transparent 70%)' }}
        />

        <div className="text-center max-w-lg animate-fadeIn relative z-10">
          {/* Logo with Renaissance frame effect */}
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
            <div className="absolute inset-0 animate-spin-slow-reverse">
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-red-400/70 shadow-lg shadow-red-400/30" />
            </div>
          </div>

          <h2 className="text-4xl font-bold mb-3">
            <span className="bg-gradient-to-r from-amber-600 via-red-500 to-rose-500 dark:from-amber-400 dark:via-red-400 dark:to-rose-400 bg-clip-text text-transparent">
              {config.appTitle}
            </span>
          </h2>
          <p className="text-muted-foreground mb-10 text-lg leading-relaxed">
            {config.appSubtitle}
          </p>

          <div className="grid grid-cols-3 gap-3 mb-10">
            <div className="glass-card p-4 rounded-xl hover:-translate-y-1 cursor-default transition-all duration-300">
              <Zap className="h-6 w-6 text-amber-500 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground font-medium">{config.feature1Label}</p>
            </div>
            <div className="glass-card p-4 rounded-xl hover:-translate-y-1 cursor-default transition-all duration-300">
              <Brain className="h-6 w-6 text-red-400 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground font-medium">{config.feature2Label}</p>
            </div>
            <div className="glass-card p-4 rounded-xl hover:-translate-y-1 cursor-default transition-all duration-300">
              <Shield className="h-6 w-6 text-emerald-400 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground font-medium">{config.feature3Label}</p>
            </div>
          </div>

          <div className="flex gap-3 justify-center flex-wrap">
            <Button onClick={handleNewChat} className="gap-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 px-7 py-5 text-base font-semibold shadow-lg shadow-red-500/20 hover:shadow-red-500/30 transition-all duration-300 hover:-translate-y-0.5 text-white border-0">
              <Plus className="h-5 w-5" />
              New Chat
            </Button>
            <Button onClick={onToggleSidebar} variant="outline" className="gap-2 px-7 py-5 text-base font-semibold hover:-translate-y-0.5 transition-all duration-300 glass">
              <Menu className="h-5 w-5" />
              History
            </Button>
          </div>

          {/* Connection status & Troubleshooting */}
          {!isConnected && (
            <div className="mt-8 glass-card rounded-2xl p-6 animate-fadeIn max-w-md mx-auto text-left border-red-500/20 shadow-2xl shadow-red-500/5">
              <div className="flex items-center gap-2 text-red-500 mb-4">
                <AlertCircle className="h-5 w-5" />
                <span className="font-bold text-lg">Ollama Not Detected</span>
              </div>

              <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
                <p>This app runs entirely in your browser and needs a direct connection to Ollama on your machine.</p>

                <div className="space-y-2">
                  <p className="font-bold text-foreground text-xs uppercase tracking-widest">Step 1: Enable CORS (Required for Vercel)</p>
                  <p>Open Terminal/PowerShell and run this exact command to allow the connection:</p>
                  <div className="bg-black/40 p-3 rounded-lg border border-white/10 font-mono text-[11px] break-all select-all text-red-400">
                    $env:OLLAMA_ORIGINS="*"; ollama serve
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="font-bold text-foreground text-xs uppercase tracking-widest">Step 2: Fix HTTPS Blocking</p>
                  <p>If you are on <b>Vercel (HTTPS)</b>, your browser blocks <b>localhost (HTTP)</b> by default.</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Click the <b>Site Settings (sliders icon)</b> in your URL bar.</li>
                    <li>Find <b>"Insecure Content"</b> and set it to <b>"Allow"</b>.</li>
                    <li>Refresh the page.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
          {isConnected && (
            <div className="mt-8 flex items-center justify-center gap-2 text-sm text-emerald-500 animate-fadeIn">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Ollama connected
            </div>
          )}
        </div>
      </div>
    )
  }

  // ========== Chat View ==========
  return (
    <div className="flex-1 flex flex-col h-full pt-16">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/30 glass">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onToggleSidebar} className="h-10 w-10 hover:bg-muted/50">
            <Menu className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-base font-semibold text-foreground truncate max-w-[200px] sm:max-w-xs">
              {currentChat.title}
            </h2>
            <p className="text-xs text-muted-foreground">{selectedModel}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isConnected ? (
            <div className="flex items-center gap-1.5 text-xs text-emerald-500 glass-subtle px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Connected
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-red-500 glass-subtle px-2.5 py-1 rounded-full">
              <AlertCircle className="h-3 w-3" />
              Ollama offline
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {displayMessages.length === 0 && !showTyping && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground animate-fadeIn">
            <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center mb-4">
              <MessageSquare className="h-8 w-8 opacity-30" />
            </div>
            <p className="text-lg font-medium mb-1">No messages yet</p>
            <p className="text-sm opacity-60">Send a message to start chatting</p>
          </div>
        )}
        {displayMessages.map((msg, idx) => (
          <Message key={idx} role={msg.role} content={msg.content} images={msg.images} />
        ))}
        {showTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-border/30 glass">
        <ChatInput onSend={handleSend} onStop={handleStopGeneration} disabled={!isConnected} isLoading={isLoading} />
      </div>
    </div>
  )
}