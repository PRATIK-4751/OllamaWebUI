import React, { useState } from 'react'
import { FolderOpen, File, FileText, FileCode, Image, ChevronRight, ArrowLeft, Plus, X, Folder } from 'lucide-react'

const FILE_ICONS = {
    js: FileCode, jsx: FileCode, ts: FileCode, tsx: FileCode, py: FileCode,
    java: FileCode, cpp: FileCode, c: FileCode, go: FileCode, rs: FileCode,
    html: FileCode, css: FileCode, json: FileCode, yaml: FileCode, yml: FileCode,
    md: FileText, txt: FileText, log: FileText, csv: FileText,
    png: Image, jpg: Image, jpeg: Image, gif: Image, svg: Image, webp: Image,
}

function getIcon(name, isDir) {
    if (isDir) return Folder
    const ext = name.split('.').pop()?.toLowerCase()
    return FILE_ICONS[ext] || File
}

export default function FileBrowser({ isOpen, onClose, onAddToContext }) {
    const [dirHandle, setDirHandle] = useState(null)
    const [entries, setEntries] = useState([])
    const [path, setPath] = useState([])
    const [preview, setPreview] = useState(null)
    const [loading, setLoading] = useState(false)

    const isSupported = typeof window !== 'undefined' && 'showDirectoryPicker' in window

    const openFolder = async () => {
        try {
            const handle = await window.showDirectoryPicker()
            setDirHandle(handle)
            setPath([handle])
            await listEntries(handle)
        } catch (e) {
            // User cancelled
        }
    }

    const listEntries = async (handle) => {
        setLoading(true)
        const items = []
        for await (const [name, entry] of handle.entries()) {
            items.push({ name, kind: entry.kind, handle: entry })
        }
        items.sort((a, b) => {
            if (a.kind !== b.kind) return a.kind === 'directory' ? -1 : 1
            return a.name.localeCompare(b.name)
        })
        setEntries(items)
        setPreview(null)
        setLoading(false)
    }

    const handleClick = async (entry) => {
        if (entry.kind === 'directory') {
            setPath(prev => [...prev, entry.handle])
            await listEntries(entry.handle)
        } else {
            try {
                const file = await entry.handle.getFile()
                if (file.size > 500000) {
                    setPreview({ name: file.name, content: 'File too large to preview (>500KB)', size: file.size })
                    return
                }
                const text = await file.text()
                setPreview({ name: file.name, content: text, size: file.size })
            } catch {
                setPreview({ name: entry.name, content: 'Cannot read this file type', size: 0 })
            }
        }
    }

    const goBack = async () => {
        if (path.length <= 1) return
        const newPath = path.slice(0, -1)
        setPath(newPath)
        await listEntries(newPath[newPath.length - 1])
    }

    const handleAdd = () => {
        if (preview) {
            onAddToContext({ name: preview.name, content: preview.content, pages: null })
            setPreview(null)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center animate-fadeIn">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-2xl max-h-[80vh] glass-strong rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slideUp">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border/20">
                    <div className="flex items-center gap-3">
                        <FolderOpen className="h-5 w-5 text-red-500" />
                        <h3 className="text-lg font-bold text-foreground">File Browser</h3>
                    </div>
                    <button onClick={onClose} className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {!dirHandle ? (
                    /* No folder selected */
                    <div className="flex flex-col items-center justify-center py-16 px-6">
                        {isSupported ? (
                            <>
                                <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center mb-4">
                                    <FolderOpen className="h-8 w-8 text-muted-foreground/40" />
                                </div>
                                <p className="text-sm text-muted-foreground mb-4 text-center">Select a folder to browse your local files</p>
                                <button
                                    onClick={openFolder}
                                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-500 text-white font-bold text-sm shadow-lg shadow-red-500/20 hover:shadow-red-500/30 hover:scale-105 transition-all"
                                >
                                    Open Folder
                                </button>
                            </>
                        ) : (
                            <p className="text-sm text-muted-foreground text-center">
                                File System Access API is not supported in this browser.<br />
                                Please use Chrome or Edge.
                            </p>
                        )}
                    </div>
                ) : (
                    /* File list + preview */
                    <div className="flex flex-1 min-h-0">
                        {/* File list */}
                        <div className="w-1/2 border-r border-border/20 flex flex-col">
                            {/* Breadcrumb */}
                            <div className="flex items-center gap-1 px-3 py-2 border-b border-border/10 text-xs text-muted-foreground overflow-x-auto">
                                {path.length > 1 && (
                                    <button onClick={goBack} className="h-6 w-6 rounded flex items-center justify-center hover:bg-muted/50 flex-shrink-0">
                                        <ArrowLeft className="h-3 w-3" />
                                    </button>
                                )}
                                {path.map((h, i) => (
                                    <span key={i} className="flex items-center gap-1 flex-shrink-0">
                                        {i > 0 && <ChevronRight className="h-3 w-3 opacity-40" />}
                                        <span className={i === path.length - 1 ? 'text-foreground font-medium' : ''}>{h.name}</span>
                                    </span>
                                ))}
                            </div>

                            {/* Entries */}
                            <div className="flex-1 overflow-y-auto p-1">
                                {loading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <div className="w-5 h-5 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
                                    </div>
                                ) : entries.length === 0 ? (
                                    <p className="text-xs text-muted-foreground text-center py-8">Empty folder</p>
                                ) : (
                                    entries.map((entry) => {
                                        const Icon = getIcon(entry.name, entry.kind === 'directory')
                                        return (
                                            <button
                                                key={entry.name}
                                                onClick={() => handleClick(entry)}
                                                className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-left text-sm hover:bg-muted/30 transition-colors ${preview?.name === entry.name ? 'bg-red-500/10 text-red-500' : 'text-foreground'
                                                    }`}
                                            >
                                                <Icon className={`h-4 w-4 flex-shrink-0 ${entry.kind === 'directory' ? 'text-amber-500' : 'text-muted-foreground'}`} />
                                                <span className="truncate">{entry.name}</span>
                                                {entry.kind === 'directory' && <ChevronRight className="h-3 w-3 ml-auto text-muted-foreground/40" />}
                                            </button>
                                        )
                                    })
                                )}
                            </div>
                        </div>

                        {/* Preview */}
                        <div className="w-1/2 flex flex-col">
                            {preview ? (
                                <>
                                    <div className="flex items-center justify-between px-3 py-2 border-b border-border/10">
                                        <span className="text-xs font-medium text-foreground truncate">{preview.name}</span>
                                        <button
                                            onClick={handleAdd}
                                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-gradient-to-r from-red-600 to-red-500 text-white hover:scale-105 transition-all"
                                        >
                                            <Plus className="h-3 w-3" />
                                            Add to Context
                                        </button>
                                    </div>
                                    <pre className="flex-1 overflow-auto p-3 text-xs text-foreground/80 font-mono whitespace-pre-wrap break-words">
                                        {preview.content.slice(0, 10000)}
                                    </pre>
                                </>
                            ) : (
                                <div className="flex items-center justify-center h-full text-muted-foreground/40 text-xs">
                                    Select a file to preview
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
