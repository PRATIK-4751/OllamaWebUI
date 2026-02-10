import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useChatStore } from '../store/chatStore'
import { streamChat, checkOllamaConnection } from '../api'
import config from '../config'
import Message from './Message'
import ChatInput from './ChatInput'
import TypingIndicator from './TypingIndicator'
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
  } = useChatStore()

  const messagesEndRef = useRef(null)
  const abortRef = useRef(null)

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
    if (images && images.length > 0) userMsg.images = images

    addMessage(userMsg)
    addMessage({ role: 'assistant', content: '' })

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
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-25 blur-[160px] pointer-events-none"
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
                boxShadow: '0 20px 60px -15px rgba(0,0,0,0.3)',
                background: 'rgba(0,0,0,0.2)'
              }}>
              <img
                src={config.logoImage}
                alt={config.appTitle}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-red-500/10 pointer-events-none" />
            </div>
            <div className="absolute inset-0 animate-spin-slow">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-amber-500/60 shadow-lg shadow-amber-500/30" />
            </div>
          </div>

          <h2 className="text-5xl font-bold mb-3 tracking-tight">
            <span className="bg-gradient-to-r from-amber-600 via-red-500 to-rose-500 dark:from-amber-400 dark:via-red-400 dark:to-rose-400 bg-clip-text text-transparent">
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
            <Button onClick={handleNewChat} className="h-14 gap-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 px-10 text-lg font-bold shadow-xl shadow-red-500/20 hover:shadow-red-500/40 transition-all duration-300 hover:-translate-y-1 text-white border-0 rounded-2xl">
              <Plus className="h-6 w-6" />
              Start Chatting
            </Button>
            <Button onClick={onToggleSidebar} variant="outline" className="h-14 gap-2 px-10 text-lg font-bold hover:-translate-y-1 transition-all duration-300 glass rounded-2xl">
              <Menu className="h-6 w-6" />
              History
            </Button>
          </div>

          {/* Subtle Connection Indicator */}
          <div className="mt-12 flex items-center justify-center gap-2 text-xs font-bold tracking-widest uppercase animate-fadeIn">
            {isConnected ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse" />
                <span className="text-emerald-500/80">Ollama Connected</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 text-red-500/70" />
                <span className="text-red-500/60 font-medium">Ollama Not Detected (127.0.0.1:11434)</span>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ========== Chat View ==========
  return (
    <div className="flex-1 flex flex-col h-full pt-16">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/20 glass">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onToggleSidebar} className="h-10 w-10 hover:bg-muted/50 rounded-xl">
            <Menu className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-lg font-bold text-foreground truncate max-w-[200px]">
              {currentChat.title}
            </h2>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{selectedModel}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 rounded-full glass-subtle ${isConnected ? 'text-emerald-500' : 'text-red-500'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
            {isConnected ? 'Connected' : 'Offline'}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {displayMessages.length === 0 && !showTyping && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground animate-fadeIn">
            <div className="w-20 h-20 rounded-3xl glass flex items-center justify-center mb-6 shadow-2xl">
              <MessageSquare className="h-10 w-10 opacity-20" />
            </div>
            <p className="text-xl font-bold mb-1">Begin the Dialogue</p>
            <p className="text-sm opacity-50 font-medium">Your local AI is ready to assist</p>
          </div>
        )}
        {displayMessages.map((msg, idx) => (
          <Message key={idx} role={msg.role} content={msg.content} images={msg.images} />
        ))}
        {showTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-border/20 glass px-4 py-4 sm:px-6">
        <ChatInput onSend={handleSend} onStop={handleStopGeneration} disabled={!isConnected} isLoading={isLoading} />
      </div>
    </div>
  )
}