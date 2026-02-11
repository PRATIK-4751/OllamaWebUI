import React from 'react'
import { FileText, X, FileBarChart } from 'lucide-react'

export default function DocumentContext({ documents, onRemove }) {
    if (!documents || documents.length === 0) return null

    return (
        <div className="flex gap-2 mb-3 flex-wrap animate-fadeIn">

            {
                documents.map((doc, idx) => (
                    <div
                        key={idx}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium group animate-scaleIn border ${doc.name.endsWith('.csv') ? 'bg-violet-500/10 border-violet-500/30 text-violet-300' : 'glass-subtle border-transparent'}`}
                    >
                        {doc.name.endsWith('.csv') ? (
                            <FileBarChart className="h-3.5 w-3.5 text-violet-500" />
                        ) : (
                            <FileText className="h-3.5 w-3.5 text-red-500" />
                        )}
                        <span className="text-foreground max-w-32 truncate">{doc.name}</span>
                        <span className="text-muted-foreground/60">
                            {doc.pages ? `${doc.pages}p` : ''} · {(doc.content.length / 1000).toFixed(1)}k chars
                        </span>
                        <button
                            onClick={() => onRemove(idx)}
                            className="opacity-0 group-hover:opacity-100 h-4 w-4 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center hover:bg-red-500/30 transition-all"
                        >
                            <X className="h-2.5 w-2.5" />
                        </button>
                    </div>
                ))
            }
        </div>
    )
}
