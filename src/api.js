// ===================================
// Ollama Direct API Client + Backend API
// ===================================
// Talks directly to user's local Ollama instance.
// Uses FastAPI backend for web search & URL fetching.

import config from './config'

// Store the working URL (default to config value or 127.0.0.1)
let WORKING_URL = config.ollamaUrl

/**
 * Check if Ollama is reachable
 */
export async function checkOllamaConnection() {
  const targets = ['http://127.0.0.1:11434', 'http://localhost:11434', WORKING_URL]
  const uniqueTargets = [...new Set(targets)]

  for (const url of uniqueTargets) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 2000)
      const res = await fetch(url, { method: 'GET', signal: controller.signal })
      clearTimeout(timeoutId)
      if (res.ok) {
        WORKING_URL = url
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

// ===================================
// Backend API (FastAPI)
// ===================================

/**
 * Web search via FastAPI backend
 */
export async function searchWeb(query) {
  try {
    const res = await fetch(`${config.backendUrl}/api/search?q=${encodeURIComponent(query)}`)
    if (!res.ok) throw new Error(`Search failed: ${res.status}`)
    return await res.json()
  } catch (err) {
    console.error('Web search error:', err)
    return { query, results: [] }
  }
}

/**
 * Fetch URL content via FastAPI backend
 */
export async function fetchUrlContent(url) {
  try {
    const res = await fetch(`${config.backendUrl}/api/url/fetch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    })
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`)
    return await res.json()
  } catch (err) {
    console.error('URL fetch error:', err)
    return null
  }
}

/**
 * Search for images via FastAPI backend
 */
export async function searchImages(query) {
  try {
    const res = await fetch(`${config.backendUrl}/api/images?q=${encodeURIComponent(query)}`)
    if (!res.ok) throw new Error(`Image search failed: ${res.status}`)
    return await res.json()
  } catch (err) {
    console.error('Image search error:', err)
    return { query, images: [] }
  }
}

/**
 * Parse PDF by uploading to FastAPI backend (uses PyMuPDF server-side)
 */
export async function parsePdf(file) {
  try {
    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch(`${config.backendUrl}/api/pdf/parse`, {
      method: 'POST',
      body: formData,
    })

    if (!res.ok) throw new Error(`PDF parse failed: ${res.status}`)
    return await res.json()
  } catch (err) {
    console.error('PDF parse error:', err)
    throw err
  }
}

