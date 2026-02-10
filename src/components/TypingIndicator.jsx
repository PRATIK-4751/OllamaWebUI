import React from 'react'
import { Sparkles } from 'lucide-react'

export default function TypingIndicator() {
    return (
        <div className="flex items-center gap-3 py-2 px-1 animate-fadeIn">
            <div className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl glass">
                <Sparkles className="h-3.5 w-3.5 text-red-500 animate-pulse mr-1" />
                <div className="typing-dots flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-500/60"
                        style={{ animation: 'typingBounce 1.4s ease-in-out infinite', animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-red-500/60"
                        style={{ animation: 'typingBounce 1.4s ease-in-out infinite', animationDelay: '200ms' }} />
                    <span className="w-2 h-2 rounded-full bg-red-500/60"
                        style={{ animation: 'typingBounce 1.4s ease-in-out infinite', animationDelay: '400ms' }} />
                </div>
                <span className="text-xs text-muted-foreground ml-1.5 font-medium">Thinking...</span>
            </div>
        </div>
    )
}
