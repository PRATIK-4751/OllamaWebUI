import React, { useState, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import CodeBlock from './CodeBlock'
import config from '../config'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Bot, User, Copy, Check } from 'lucide-react'

export default function Message({ role, content, images }) {
  const isUser = role === 'user'
  const [copiedMsg, setCopiedMsg] = useState(false)

  const handleCopyMessage = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedMsg(true)
      setTimeout(() => setCopiedMsg(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }, [content])

  return (
    <div className={`message-row flex ${isUser ? 'justify-end' : 'justify-start'} mb-6 animate-slideUp group/msg`}>
      <div className={`flex gap-3 max-w-4xl ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar with classical frame */}
        <Avatar className={`flex-shrink-0 w-9 h-9 transition-transform duration-300 group-hover/msg:scale-105 ${isUser
            ? 'ring-2 ring-red-500/30 shadow-lg shadow-red-500/10'
            : 'ring-2 ring-amber-600/20 dark:ring-amber-400/15 shadow-lg shadow-amber-500/10'
          }`}>
          <AvatarImage
            src={isUser ? config.userAvatar : config.aiAvatar}
            alt={isUser ? 'You' : 'AI'}
            className="object-cover"
          />
          <AvatarFallback className={`text-white ${isUser
              ? 'bg-gradient-to-br from-red-500 to-rose-600'
              : 'bg-gradient-to-br from-amber-700 to-amber-900'
            }`}>
            {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
          </AvatarFallback>
        </Avatar>

        {/* Message Bubble */}
        <div className="relative">
          <div className={`rounded-2xl px-5 py-3.5 transition-all duration-300 ${isUser
              ? 'bg-gradient-to-br from-red-500 to-rose-600 text-white rounded-br-md shadow-lg shadow-red-500/10'
              : 'glass rounded-bl-md shadow-md hover:shadow-lg'
            }`}>
            {/* Images */}
            {images && images.length > 0 && (
              <div className="flex gap-2 mb-3 flex-wrap">
                {images.map((img, idx) => (
                  <img
                    key={idx}
                    src={`data:image/jpeg;base64,${img}`}
                    alt="Uploaded"
                    className="max-w-xs max-h-40 rounded-lg object-cover border border-white/10 shadow-md transition-transform duration-300 hover:scale-105"
                  />
                ))}
              </div>
            )}

            {/* Content */}
            <div className={`prose prose-sm max-w-none ${isUser ? 'prose-invert' : 'dark:prose-invert'}`}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '')
                    if (!inline && match) {
                      return <CodeBlock language={match[1]}>{children}</CodeBlock>
                    }
                    return (
                      <code className={`${isUser ? 'bg-white/15' : 'bg-red-500/10 text-red-600 dark:text-red-400'} px-1.5 py-0.5 rounded-md text-[0.85em] font-mono font-medium`} {...props}>
                        {children}
                      </code>
                    )
                  },
                  table({ children }) {
                    return (
                      <div className="overflow-x-auto my-4 rounded-lg border border-border/50">
                        <table className="min-w-full divide-y divide-border">{children}</table>
                      </div>
                    )
                  },
                  th({ children }) {
                    return <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider bg-muted/50">{children}</th>
                  },
                  td({ children }) {
                    return <td className="px-4 py-2.5 text-sm border-t border-border/30">{children}</td>
                  },
                  blockquote({ children }) {
                    return (
                      <blockquote className="border-l-4 border-amber-600/40 dark:border-amber-400/30 bg-amber-500/5 pl-4 py-2 my-3 rounded-r-lg italic text-muted-foreground">
                        {children}
                      </blockquote>
                    )
                  },
                  a({ href, children }) {
                    return (
                      <a href={href} target="_blank" rel="noopener noreferrer"
                        className="text-red-500 hover:text-red-400 underline underline-offset-2 decoration-red-500/30 hover:decoration-red-500/60 transition-colors">
                        {children}
                      </a>
                    )
                  },
                  li({ children }) {
                    return <li className="my-0.5">{children}</li>
                  },
                  hr() {
                    return <hr className="my-4 border-border/50" />
                  },
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          </div>

          {/* Copy button on hover */}
          {!isUser && content && (
            <div className="absolute -bottom-8 left-0 opacity-0 group-hover/msg:opacity-100 transition-all duration-200 flex gap-1">
              <button
                onClick={handleCopyMessage}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs text-muted-foreground hover:text-foreground glass-subtle transition-all duration-200 hover:shadow-sm"
              >
                {copiedMsg ? (
                  <><Check className="h-3 w-3 text-emerald-500" /><span className="text-emerald-500">Copied</span></>
                ) : (
                  <><Copy className="h-3 w-3" /><span>Copy</span></>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}