import React from 'react'
import { ExternalLink, ChevronDown, ChevronUp, Globe } from 'lucide-react'

export default function SearchResults({ results, isExpanded, onToggle }) {
    if (!results || results.length === 0) return null

    return (
        <div className="mb-3 animate-fadeIn">
            <button
                onClick={onToggle}
                className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors mb-2"
            >
                <Globe className="h-3 w-3 text-red-500" />
                <span>{results.length} Web Sources</span>
                {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>

            {isExpanded && (
                <div className="space-y-1.5 animate-fadeIn">
                    {results.map((r, idx) => (
                        <a
                            key={idx}
                            href={r.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 glass-subtle px-3 py-2 rounded-xl hover:bg-muted/50 transition-all group text-xs"
                        >
                            <div className="w-5 h-5 rounded-md bg-red-500/10 flex items-center justify-center flex-shrink-0">
                                <span className="text-[10px] font-bold text-red-500">{idx + 1}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-foreground truncate group-hover:text-red-500 transition-colors">
                                    {r.title}
                                </p>
                                <p className="text-muted-foreground/60 truncate text-[10px]">{r.url}</p>
                            </div>
                            <ExternalLink className="h-3 w-3 text-muted-foreground/40 flex-shrink-0" />
                        </a>
                    ))}
                </div>
            )}
        </div>
    )
}
