import React from 'react'
import { FileBarChart, Table } from 'lucide-react'

export default function AnalysisResults({ data, onClose }) {
    if (!data) return null

    return (
        <div className="w-full max-w-4xl mx-auto mt-4 mb-8 glass rounded-2xl overflow-hidden border border-border/50 animate-fadeIn">
            {/* Header */}
            <div className="bg-gradient-to-r from-violet-600/20 to-indigo-600/20 px-6 py-4 flex items-center justify-between border-b border-border/10">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-violet-500/20 rounded-lg">
                        <FileBarChart className="h-5 w-5 text-violet-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-foreground">Data Analysis</h3>
                        <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">
                            {data.filename} · {data.info.rows} Rows · {data.info.columns.length} Cols
                        </p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                >
                    ✕
                </button>
            </div>

            <div className="p-6 space-y-8">
                {/* Statistical Summary */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                        <Table className="h-4 w-4 text-violet-400" />
                        <h4 className="text-sm font-bold uppercase tracking-wide text-foreground/80">
                            Statistical Summary
                        </h4>
                    </div>
                    <div className="overflow-x-auto rounded-xl border border-border/30 bg-background/30 p-4">
                        <pre className="text-xs font-mono text-muted-foreground whitespace-pre">
                            {data.info.summary}
                        </pre>
                    </div>
                </div>

                {/* Visualizations */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {data.plots.map((plot, idx) => (
                        <div key={idx} className="glass-subtle rounded-xl p-4 border border-border/20 transition-all hover:border-violet-500/30 group">
                            <h4 className="text-xs font-bold uppercase tracking-wide text-center mb-3 text-muted-foreground group-hover:text-violet-400 transition-colors">
                                {plot.title}
                            </h4>
                            <div className="rounded-lg overflow-hidden bg-white/5">
                                <img
                                    src={`data:image/png;base64,${plot.image}`}
                                    alt={plot.title}
                                    className="w-full h-auto object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
