import React from 'react'
import { Search, FileText, Lightbulb, Languages, Bug, Sparkles, BarChart3, Mail } from 'lucide-react'
import promptTemplates from '../data/promptTemplates'

const ICON_MAP = { Search, FileText, Lightbulb, Languages, Bug, Sparkles, BarChart3, Mail }

export default function PromptTemplates({ onSelect }) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-2xl animate-fadeIn">
            {promptTemplates.map((t, idx) => {
                const Icon = ICON_MAP[t.icon]
                return (
                    <button
                        key={t.id}
                        onClick={() => onSelect(t.prompt)}
                        className="glass-card p-4 rounded-2xl text-left hover:-translate-y-1 transition-all duration-300 group animate-fadeIn"
                        style={{ animationDelay: `${idx * 50}ms` }}
                    >
                        {Icon && <Icon className="h-5 w-5 text-red-500/70 mb-2 group-hover:text-red-500 transition-colors" />}
                        <p className="text-sm font-bold text-foreground group-hover:text-red-500 transition-colors truncate">
                            {t.title}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                            {t.description}
                        </p>
                    </button>
                )
            })}
        </div>
    )
}
