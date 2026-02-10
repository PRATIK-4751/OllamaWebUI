import { useCallback } from 'react'
import { useChatStore } from '../store/chatStore'
import { createChat as createChatApi, getChatHistory } from '../api'

export function useChat() {
  const {
    currentChat,
    setCurrentChat,
    setMessages,
    addMessage,
    updateLastMessage,
    setIsLoading,
    selectedModel,
    isLoading
  } = useChatStore()

  const createChat = useCallback(async (title = 'New Chat') => {
    try {
      setIsLoading(true)
      const chat = await createChatApi({
        title,
        model: selectedModel
      })
      
      setCurrentChat(chat)
      setMessages([])
      setIsLoading(false)
      return chat
    } catch (error) {
      console.error('Failed to create chat:', error)
      setIsLoading(false)
      throw error
    }
  }, [selectedModel, setCurrentChat, setMessages, setIsLoading])

  const loadChatHistory = useCallback(async (chatId) => {
    try {
      setIsLoading(true)
      const history = await getChatHistory(chatId)
      setMessages(history.messages || [])
      setIsLoading(false)
    } catch (error) {
      console.error('Failed to load chat history:', error)
      setIsLoading(false)
    }
  }, [setMessages, setIsLoading])

  const sendMessage = useCallback((content, images = []) => {
    if (!currentChat || isLoading) return

    // Add user message
    addMessage({
      role: 'user',
      content,
      images
    })

    // Add empty assistant message
    addMessage({
      role: 'assistant',
      content: ''
    })
  }, [currentChat, isLoading, addMessage])

  return {
    currentChat,
    createChat,
    loadChatHistory,
    sendMessage,
    updateLastMessage,
    isLoading
  }
}