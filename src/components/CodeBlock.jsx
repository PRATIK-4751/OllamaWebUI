import React, { useState, useCallback } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Copy, Check, Terminal, FileCode2 } from 'lucide-react'

const LANGUAGE_LABELS = {
    js: 'JavaScript',
    jsx: 'JSX',
    ts: 'TypeScript',
    tsx: 'TSX',
    py: 'Python',
    python: 'Python',
    javascript: 'JavaScript',
    typescript: 'TypeScript',
    html: 'HTML',
    css: 'CSS',
    json: 'JSON',
    bash: 'Bash',
    sh: 'Shell',
    shell: 'Shell',
    sql: 'SQL',
    java: 'Java',
    cpp: 'C++',
    c: 'C',
    go: 'Go',
    rust: 'Rust',
    ruby: 'Ruby',
    php: 'PHP',
    swift: 'Swift',
    kotlin: 'Kotlin',
    yaml: 'YAML',
    yml: 'YAML',
    xml: 'XML',
    markdown: 'Markdown',
    md: 'Markdown',
    dockerfile: 'Dockerfile',
    graphql: 'GraphQL',
    r: 'R',
    scala: 'Scala',
    dart: 'Dart',
    lua: 'Lua',
    powershell: 'PowerShell',
    toml: 'TOML',
}

const customTheme = {
    ...oneDark,
    'pre[class*="language-"]': {
        ...oneDark['pre[class*="language-"]'],
        background: 'transparent',
        margin: 0,
        padding: '1rem 1.25rem',
        fontSize: '0.85rem',
        lineHeight: '1.7',
    },
    'code[class*="language-"]': {
        ...oneDark['code[class*="language-"]'],
        background: 'transparent',
        fontSize: '0.85rem',
        lineHeight: '1.7',
    },
}

export default function CodeBlock({ language, children }) {
    const [copied, setCopied] = useState(false)
    const code = String(children).replace(/\n$/, '')
    const lang = language || 'text'
    const label = LANGUAGE_LABELS[lang.toLowerCase()] || lang.toUpperCase()

    const handleCopy = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(code)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            console.error('Failed to copy:', err)
        }
    }, [code])

    return (
        <div className="code-block-wrapper group my-4 rounded-xl overflow-hidden border border-white/[0.06] shadow-lg">
            {}
            <div className="code-block-header flex items-center justify-between px-4 py-2.5"
                style={{
                    background: 'linear-gradient(135deg, rgba(30,30,46,0.95) 0%, rgba(24,24,37,0.98) 100%)',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                }}
            >
                <div className="flex items-center gap-2.5">
                    {}
                    <div className="flex gap-1.5 mr-2">
                        <span className="w-3 h-3 rounded-full bg-[#ff5f57] shadow-[0_0_6px_rgba(255,95,87,0.4)]" />
                        <span className="w-3 h-3 rounded-full bg-[#febc2e] shadow-[0_0_6px_rgba(254,188,46,0.4)]" />
                        <span className="w-3 h-3 rounded-full bg-[#28c840] shadow-[0_0_6px_rgba(40,200,64,0.4)]" />
                    </div>
                    <div className="flex items-center gap-1.5">
                        {lang === 'bash' || lang === 'shell' || lang === 'sh' ? (
                            <Terminal className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                            <FileCode2 className="h-3.5 w-3.5 text-red-400" />
                        )}
                        <span className="text-xs font-medium tracking-wide"
                            style={{ color: 'rgba(166,172,205,0.8)' }}
                        >
                            {label}
                        </span>
                    </div>
                </div>

                <button
                    onClick={handleCopy}
                    className="copy-btn flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-all duration-200"
                    style={{
                        color: copied ? '#28c840' : 'rgba(166,172,205,0.7)',
                        background: copied ? 'rgba(40,200,64,0.1)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${copied ? 'rgba(40,200,64,0.2)' : 'rgba(255,255,255,0.06)'}`,
                    }}
                    title="Copy code"
                >
                    {copied ? (
                        <>
                            <Check className="h-3.5 w-3.5" />
                            <span className="font-medium">Copied!</span>
                        </>
                    ) : (
                        <>
                            <Copy className="h-3.5 w-3.5" />
                            <span className="font-medium opacity-0 group-hover:opacity-100 transition-opacity">Copy</span>
                        </>
                    )}
                </button>
            </div>

            {}
            <div className="code-block-body overflow-x-auto"
                style={{
                    background: 'linear-gradient(180deg, rgba(22,22,35,0.98) 0%, rgba(18,18,28,1) 100%)',
                }}
            >
                <SyntaxHighlighter
                    style={customTheme}
                    language={lang}
                    PreTag="div"
                    showLineNumbers={code.split('\n').length > 3}
                    lineNumberStyle={{
                        color: 'rgba(100,110,140,0.35)',
                        fontSize: '0.75rem',
                        minWidth: '2.5em',
                        paddingRight: '1em',
                        userSelect: 'none',
                    }}
                    wrapLines={true}
                    lineProps={() => ({
                        style: {
                            wordBreak: 'break-all',
                            whiteSpace: 'pre-wrap',
                        },
                    })}
                >
                    {code}
                </SyntaxHighlighter>
            </div>
        </div>
    )
}
