import { useState, useRef, useCallback } from 'react'

export function useVoice() {
    const [isListening, setIsListening] = useState(false)
    const [finalTranscript, setFinalTranscript] = useState('')
    const [interimTranscript, setInterimTranscript] = useState('')
    const [isSpeaking, setIsSpeaking] = useState(false)
    const recognitionRef = useRef(null)
    const processedCountRef = useRef(0)

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
            let newFinal = ''
            let interim = ''
            for (let i = processedCountRef.current; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                    newFinal += event.results[i][0].transcript
                    processedCountRef.current = i + 1
                } else {
                    interim += event.results[i][0].transcript
                }
            }
            if (newFinal) {
                setFinalTranscript(prev => prev + newFinal)
            }
            setInterimTranscript(interim)
        }

        recognition.onend = () => {
            setIsListening(false)
            setInterimTranscript('')
        }
        recognition.onerror = () => {
            setIsListening(false)
            setInterimTranscript('')
        }

        recognitionRef.current = recognition
        processedCountRef.current = 0
        setFinalTranscript('')
        setInterimTranscript('')
        recognition.start()
        setIsListening(true)
    }, [isSupported])

    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop()
            setIsListening(false)
            setInterimTranscript('')
        }
    }, [])

    const clearTranscript = useCallback(() => {
        setFinalTranscript('')
        setInterimTranscript('')
    }, [])

    const speak = useCallback((text) => {
        if (!window.speechSynthesis) return
        window.speechSynthesis.cancel()

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
        finalTranscript,
        interimTranscript,
        isSpeaking,
        isSupported,
        startListening,
        stopListening,
        clearTranscript,
        speak,
        stopSpeaking,
    }
}
