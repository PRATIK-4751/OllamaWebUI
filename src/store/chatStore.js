import { create } from 'zustand'
import config from '../config'

// ===================================
// localStorage helpers
// ===================================
const STORAGE_KEY = 'ollama-webui-chats'

function loadChatsFromStorage() {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

function saveChatsToStorage(chats) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chats))
  } catch (e) {
    console.warn('Failed to save chats to localStorage:', e)
  }
}

// ===================================
// Chat Store (Zustand + localStorage)
// ===================================
export const useChatStore = create((set, get) => ({
  // Chats list (persisted in localStorage)
  chats: loadChatsFromStorage(),

  // Current active chat
  currentChat: null,

  // Messages for current chat
  messages: [],

  // Available models
  models: [],

  // Selected model
  selectedModel: config.defaultModel,

  // Settings
  temperature: 0.7,
  contextWindow: 4096,

  // Loading state
  isLoading: false,

  // Connection state
  isConnected: false,

  // --- Chat actions ---

  createChat: (title) => {
    const chat = {
      id: crypto.randomUUID(),
      title: title || 'New Chat',
      model: get().selectedModel,
      messages: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    const chats = [chat, ...get().chats]
    saveChatsToStorage(chats)
    set({ chats, currentChat: chat, messages: [] })
    return chat
  },

  deleteChat: (chatId) => {
    const chats = get().chats.filter(c => c.id !== chatId)
    saveChatsToStorage(chats)
    const updates = { chats }
    if (get().currentChat?.id === chatId) {
      updates.currentChat = null
      updates.messages = []
    }
    set(updates)
  },

  setCurrentChat: (chat) => {
    if (chat) {
      // Load messages from the chat object
      const storedChat = get().chats.find(c => c.id === chat.id)
      set({
        currentChat: storedChat || chat,
        messages: storedChat?.messages || []
      })
    } else {
      set({ currentChat: null, messages: [] })
    }
  },

  addMessage: (message) => {
    const messages = [...get().messages, message]
    set({ messages })
    // Persist to chat
    get()._persistMessages(messages)
  },

  updateLastMessage: (token) => {
    const messages = [...get().messages]
    const lastMsg = messages[messages.length - 1]
    if (lastMsg && lastMsg.role === 'assistant') {
      messages[messages.length - 1] = {
        ...lastMsg,
        content: lastMsg.content + token,
      }
      set({ messages })
    }
  },

  // Persist final messages to localStorage when streaming is done
  persistMessages: () => {
    get()._persistMessages(get().messages)
  },

  _persistMessages: (messages) => {
    const { currentChat, chats } = get()
    if (!currentChat) return

    // Auto-title from first user message
    let title = currentChat.title
    if (title === 'New Chat' && messages.length > 0) {
      const firstUserMsg = messages.find(m => m.role === 'user')
      if (firstUserMsg) {
        title = firstUserMsg.content.slice(0, 50) + (firstUserMsg.content.length > 50 ? '...' : '')
      }
    }

    const updatedChats = chats.map(c =>
      c.id === currentChat.id
        ? { ...c, messages, title, updated_at: new Date().toISOString() }
        : c
    )
    saveChatsToStorage(updatedChats)
    set({
      chats: updatedChats,
      currentChat: { ...currentChat, title, messages }
    })
  },

  setMessages: (messages) => set({ messages }),
  setChats: (chats) => set({ chats }),

  // --- Model actions ---
  setModels: (models) => set({ models }),
  setSelectedModel: (model) => set({ selectedModel: model }),

  // --- UI state ---
  setIsLoading: (loading) => set({ isLoading: loading }),
  setIsConnected: (connected) => set({ isConnected: connected }),

  // --- Settings ---
  setTemperature: (temp) => set({ temperature: temp }),
  setContextWindow: (ctx) => set({ contextWindow: ctx }),

  // --- Export / Import ---
  exportChats: () => {
    const data = JSON.stringify(get().chats, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ollama-webui-chats-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  },

  importChats: (jsonString) => {
    try {
      const imported = JSON.parse(jsonString)
      if (!Array.isArray(imported)) throw new Error('Invalid format')
      const existing = get().chats
      const merged = [...imported, ...existing]
      // Deduplicate by ID
      const unique = merged.filter((chat, idx, arr) =>
        arr.findIndex(c => c.id === chat.id) === idx
      )
      saveChatsToStorage(unique)
      set({ chats: unique })
      return true
    } catch (e) {
      console.error('Import failed:', e)
      return false
    }
  },

  clearAllChats: () => {
    localStorage.removeItem(STORAGE_KEY)
    set({ chats: [], currentChat: null, messages: [] })
  },
}))