// ===================================
// Ollama Direct API Client
// ===================================
// Talks directly to user's local Ollama instance.
// No backend server needed!

import config from './config'

const OLLAMA_URL = config.ollamaUrl

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
 * @param {Object} params - Chat parameters
 * @param {string} params.model - Model name
 * @param {Array} params.messages - Message history [{role, content, images?}]
 * @param {number} params.temperature - Temperature
 * @param {number} params.num_ctx - Context window size
 * @param {function} onToken - Callback for each token
 * @param {function} onDone - Callback when done
 * @param {function} onError - Callback on error
 * @param {AbortSignal} signal - AbortController signal to cancel streaming
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

      // Process complete JSON lines
      const lines = buffer.split('\n')
      buffer = lines.pop() // Keep incomplete line in buffer

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
        } catch (e) {
          // Skip malformed JSON lines
        }
      }
    }

    // Process any remaining buffer
    if (buffer.trim()) {
      try {
        const json = JSON.parse(buffer)
        if (json.message?.content) {
          onToken(json.message.content)
        }
      } catch (e) {
        // Skip
      }
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
 * Convert a File to base64 string (for image uploads)
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      // Remove the data:image/...;base64, prefix
      const base64 = reader.result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}