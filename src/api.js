// ===================================
// Ollama Direct API Client
// ===================================
// Talks directly to user's local Ollama instance.
// No backend server needed!

import config from './config'

// Store the working URL (default to config value or 127.0.0.1)
let WORKING_URL = config.ollamaUrl

/**
 * Check if Ollama is reachable
 * Tries both localhost and 127.0.0.1 if current one fails
 */
export async function checkOllamaConnection() {
  // Always try 127.0.0.1 first as it's more reliable for bypassing DNS blocks on Vercel
  const targets = ['http://127.0.0.1:11434', 'http://localhost:11434', WORKING_URL]

  // Create a Set to remove duplicates
  const uniqueTargets = [...new Set(targets)]

  for (const url of uniqueTargets) {
    try {
      // Use a shorter timeout for detection
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 2000)

      const res = await fetch(url, {
        method: 'GET',
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (res.ok) {
        WORKING_URL = url // Update working URL
        return true
      }
    } catch (err) {
      // Continue to next target
    }
  }
  return false
}

export function getWorkingUrl() {
  return WORKING_URL
}

/**
 * List available models from Ollama
 */
export async function getModels() {
  const url = WORKING_URL
  const res = await fetch(`${url}/api/tags`)
  if (!res.ok) throw new Error('Failed to fetch models')
  const data = await res.json()
  return data.models || []
}

/**
 * Stream a chat response from Ollama
 */
export async function streamChat({ model, messages, temperature, num_ctx }, onToken, onDone, onError, signal) {
  const url = WORKING_URL
  try {
    const res = await fetch(`${url}/api/chat`, {
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
        } catch (e) {
          // Skip
        }
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