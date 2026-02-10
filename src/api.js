// ===================================
// Ollama Direct API Client
// ===================================

import config from './config'

const OLLAMA_URL = 'http://127.0.0.1:11434'

/**
 * Check if Ollama is reachable
 */
export async function checkOllamaConnection() {
  try {
    const res = await fetch(OLLAMA_URL, { method: 'GET' })
    return res.ok
  } catch {
    return false
  }
}

/**
 * List available models from Ollama
 */
export async function getModels() {
  const res = await fetch(`${OLLAMA_URL}/api/tags`)
  if (!res.ok) throw new Error('Failed to fetch models')
  const data = await res.json()
  return data.models || []
}

/**
 * Stream a chat response from Ollama
 */
export async function streamChat({ model, messages, temperature, num_ctx }, onToken, onDone, onError, signal) {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
        options: {
          temperature: temperature ?? 0.7,
          num_ctx: num_ctx ?? 4096,
        }
      }),
      signal,
    })

    if (!res.ok) {
      const errText = await res.text()
      onError?.(errText || `HTTP ${res.status}`)
      return
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop()

      for (const line of lines) {
        if (!line.trim()) continue
        try {
          const json = JSON.parse(line)
          if (json.message?.content) {
            onToken(json.message.content)
          }
          if (json.done) {
            onDone?.()
            return
          }
        } catch (e) { /* Skip */ }
      }
    }

    if (buffer.trim()) {
      try {
        const json = JSON.parse(buffer)
        if (json.message?.content) {
          onToken(json.message.content)
        }
      } catch (e) { /* Skip */ }
    }

    onDone?.()
  } catch (err) {
    if (err.name === 'AbortError') {
      onDone?.()
    } else {
      onError?.(err.message)
    }
  }
}

/**
 * Convert a File to base64 string
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}