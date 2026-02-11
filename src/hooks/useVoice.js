/**
 * useVoice — Custom hook for Voice Input (STT) and Text-to-Speech (TTS)
 * Uses Web Speech API (Chrome/Edge/Safari)
 */
import { useState, useRef, useCallback } from 'react'

export function useVoice() {
    const [isListening, setIsListening] = useState(false)
    const [transcript, setTranscript] = useState('')
    const [isSpeaking, setIsSpeaking] = useState(false)
    const recognitionRef = useRef(null)

    const isSupported = typeof window !== 'undefined' &&
        ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

    const startListening = useCallback(() => {
        if (!isSupported) return

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
        const recognition = new SpeechRecognition()
        recognition.continuous = true
        recognition.interimResults = true
        recognition.lang = 'en-US'

        recognition.onresult = (event) => {
            let final = ''
            let interim = ''
            for (let i = 0; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                    final += event.results[i][0].transcript
                } else {
                    interim += event.results[i][0].transcript
                }
            }
            setTranscript(final || interim)
        }

        recognition.onend = () => setIsListening(false)
        recognition.onerror = () => setIsListening(false)

        recognitionRef.current = recognition
        recognition.start()
        setIsListening(true)
        setTranscript('')
    }, [isSupported])

    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop()
            setIsListening(false)
        }
    }, [])

    const speak = useCallback((text) => {
        if (!window.speechSynthesis) return
        window.speechSynthesis.cancel()

        // Strip markdown for cleaner speech
        const clean = text
            .replace(/```[\s\S]*?```/g, 'code block')
            .replace(/`([^`]+)`/g, '$1')
            .replace(/[#*_~>|-]/g, '')
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
            .trim()

        const utterance = new SpeechSynthesisUtterance(clean)
        utterance.rate = 1.0
        utterance.pitch = 1.0
        utterance.onstart = () => setIsSpeaking(true)
        utterance.onend = () => setIsSpeaking(false)
        utterance.onerror = () => setIsSpeaking(false)

        window.speechSynthesis.speak(utterance)
    }, [])

    const stopSpeaking = useCallback(() => {
        window.speechSynthesis?.cancel()
        setIsSpeaking(false)
    }, [])

    return {
        isListening,
        transcript,
        isSpeaking,
        isSupported,
        startListening,
        stopListening,
        speak,
        stopSpeaking,
    }
}
