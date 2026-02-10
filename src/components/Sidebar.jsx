import React, { useState, useRef } from 'react'
import { Plus, Trash2, MessageSquare, X, Search, Download, Upload, Trash } from 'lucide-react'
import { useChatStore } from '../store/chatStore'
import { Button } from './ui/button'
import config from '../config'

export default function Sidebar({ isOpen, onToggle }) {
  const {
    chats,
    currentChat,
    createChat,
    deleteChat,
    setCurrentChat,
    selectedModel,
    exportChats,
    importChats,
    clearAllChats,
  } = useChatStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [deletingId, setDeletingId] = useState(null)
  const importRef = useRef(null)

  const handleNewChat = () => {
    createChat('New Chat')
  }

  const handleDeleteChat = (e, chatId) => {
    e.stopPropagation()
    setDeletingId(chatId)
    deleteChat(chatId)
    setTimeout(() => setDeletingId(null), 300)
  }

  const handleSelectChat = (chat) => {
    setCurrentChat(chat)
  }

  const handleImport = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const success = importChats(reader.result)
      if (success) {
        alert('Chats imported successfully!')
      } else {
        alert('Failed to import chats. Invalid format.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleClearAll = () => {
    if (window.confirm('Delete ALL chats? This cannot be undone.')) {
      clearAllChats()
    }
  }

  const filteredChats = chats.filter(chat =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  if (!isOpen) {
    return (
      <div className="absolute top-4 left-4 z-50 animate-fadeIn">
        <button
          onClick={onToggle}
          className="glass h-11 w-11 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center text-foreground"
        >
          <MessageSquare className="h-5 w-5" />
        </button>
      </div>
    )
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-fadeIn"
        onClick={onToggle}
      />

      {/* Sidebar */}
      <div className="fixed left-0 top-0 bottom-0 w-80 glass-strong flex flex-col h-full shadow-2xl z-50 animate-slideRight">
        {/* Header */}
        <div className="p-4 border-b border-border/20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground">
              Conversations
            </h2>
            <div className="flex gap-1.5">
              <Button
                onClick={handleNewChat}
                size="sm"
                className="h-9 px-3 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white border-0 shadow-md shadow-red-500/15 hover:shadow-red-500/25 transition-all duration-300 hover:scale-105"
                title="Create new chat"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                New
              </Button>
              <button
                onClick={onToggle}
                className="h-9 w-9 rounded-lg flex items-center justify-center hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Search */}
          {config.enableChatSearch && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search chats..."
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-muted/30 border border-border/20 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-red-500/30 focus:bg-muted/50 transition-all duration-200"
              />
            </div>
          )}
        </div>

        {/* Chat list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground/50">
              <MessageSquare className="h-8 w-8 mb-2 opacity-40" />
              <p className="text-sm">{searchQuery ? 'No matches found' : 'No conversations yet'}</p>
            </div>
          ) : (
            filteredChats.map((chat, idx) => (
              <div
                key={chat.id}
                onClick={() => handleSelectChat(chat)}
                className={`group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 animate-fadeIn ${currentChat?.id === chat.id
                    ? 'bg-red-500/10 border border-red-500/20 shadow-sm'
                    : 'hover:bg-muted/30 border border-transparent'
                  } ${deletingId === chat.id ? 'opacity-50 scale-95' : ''}`}
                style={{ animationDelay: `${idx * 30}ms` }}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${currentChat?.id === chat.id
                    ? 'bg-red-500/15 text-red-500'
                    : 'bg-muted/30 text-muted-foreground'
                  }`}>
                  <MessageSquare size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className={`block truncate text-sm font-medium ${currentChat?.id === chat.id ? 'text-red-500' : 'text-foreground'
                    }`}>
                    {chat.title}
                  </span>
                  <span className="block text-[11px] text-muted-foreground/60 mt-0.5">
                    {chat.model?.split(':')[0]} · {formatDate(chat.updated_at)} · {chat.messages?.length || 0} msgs
                  </span>
                </div>
                <button
                  onClick={(e) => handleDeleteChat(e, chat.id)}
                  className="opacity-0 group-hover:opacity-100 h-8 w-8 rounded-lg flex items-center justify-center hover:bg-red-500/10 hover:text-red-500 transition-all duration-200 flex-shrink-0 text-muted-foreground"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer with Export/Import */}
        <div className="p-4 border-t border-border/20 space-y-3">
          <div className="flex gap-2">
            <button
              onClick={exportChats}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all duration-200"
              title="Export all chats as JSON"
            >
              <Download className="h-3.5 w-3.5" />
              Export
            </button>
            <button
              onClick={() => importRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all duration-200"
              title="Import chats from JSON"
            >
              <Upload className="h-3.5 w-3.5" />
              Import
            </button>
            <input
              ref={importRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImport}
            />
            <button
              onClick={handleClearAll}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all duration-200"
              title="Clear all chats"
            >
              <Trash className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-[11px] text-muted-foreground/50 font-medium tracking-wider uppercase">
              {config.appTitle}
            </div>
            <div className="text-[11px] text-muted-foreground/40">
              {chats.length} chat{chats.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}