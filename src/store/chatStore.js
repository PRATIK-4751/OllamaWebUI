import { create } from 'zustand'
import config from '../config'




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




export const useChatStore = create((set, get) => ({

  chats: loadChatsFromStorage(),


  currentChat: null,


  messages: [],


  models: [],


  selectedModel: config.defaultModel,


  temperature: 0.7,
  contextWindow: 4096,


  isLoading: false,


  isConnected: false,


  documents: [],


  webSearchEnabled: false,



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

  renameChat: (chatId, newTitle) => {
    const chats = get().chats.map(c =>
      c.id === chatId ? { ...c, title: newTitle } : c
    )
    saveChatsToStorage(chats)
    set({ chats })
    if (get().currentChat?.id === chatId) {
      set({ currentChat: { ...get().currentChat, title: newTitle } })
    }
  },

  setCurrentChat: (chat) => {
    if (chat) {

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


  persistMessages: () => {
    get()._persistMessages(get().messages)
  },

  _persistMessages: (messages) => {
    const { currentChat, chats } = get()
    if (!currentChat) return


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


  setModels: (models) => set({ models }),
  setSelectedModel: (model) => set({ selectedModel: model }),


  setIsLoading: (loading) => set({ isLoading: loading }),
  setIsConnected: (connected) => set({ isConnected: connected }),


  setTemperature: (temp) => set({ temperature: temp }),
  setContextWindow: (ctx) => set({ contextWindow: ctx }),


  addDocument: (doc) => set({ documents: [...get().documents, doc] }),
  removeDocument: (idx) => set({ documents: get().documents.filter((_, i) => i !== idx) }),
  clearDocuments: () => set({ documents: [] }),


  setWebSearchEnabled: (enabled) => set({ webSearchEnabled: enabled }),


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
