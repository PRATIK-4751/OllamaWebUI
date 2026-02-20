import React, { useState } from 'react'
import { X, ExternalLink, Search } from 'lucide-react'

export default function ImageResults({ images, query }) {
    const [selectedImg, setSelectedImg] = useState(null)

    if (!images || images.length === 0) return null


    return (
        <>
            { }
            <div className="mb-2 animate-fadeIn">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
                    <Search className="h-2.5 w-2.5 text-red-500" />
                    Images for "{query}"
                </p>
                <div className="flex gap-2 flex-wrap">
                    {images.map((img, idx) => (
                        <button
                            key={idx}
                            onClick={() => setSelectedImg(img)}
                            className="relative rounded-lg overflow-hidden h-20 w-20 flex-shrink-0 group border border-border/20 hover:border-red-500/40 transition-all hover:scale-105"
                        >
                            <img
                                src={img.url || img.thumbnail}
                                alt={img.title || ''}
                                className="w-full h-full object-cover"
                                loading="lazy"
                                onError={(e) => { e.target.style.display = 'none' }}
                            />
                        </button>
                    ))}
                </div>
            </div>

            { }
            {selectedImg && (
                <div className="fixed inset-0 z-50 flex items-center justify-center animate-fadeIn" onClick={() => setSelectedImg(null)}>
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
                    <div className="relative max-w-3xl max-h-[80vh] animate-slideUp" onClick={e => e.stopPropagation()}>
                        <img
                            src={selectedImg.url}
                            alt={selectedImg.title || ''}
                            className="max-w-full max-h-[75vh] rounded-2xl shadow-2xl object-contain"
                        />
                        <div className="absolute top-3 right-3 flex gap-2">
                            <a
                                href={selectedImg.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="h-8 w-8 rounded-lg bg-black/50 backdrop-blur flex items-center justify-center text-white/80 hover:text-white transition-colors"
                            >
                                <ExternalLink className="h-4 w-4" />
                            </a>
                            <button
                                onClick={() => setSelectedImg(null)}
                                className="h-8 w-8 rounded-lg bg-black/50 backdrop-blur flex items-center justify-center text-white/80 hover:text-white transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        {selectedImg.title && (
                            <p className="text-sm text-white/70 mt-3 text-center truncate px-4">{selectedImg.title}</p>
                        )}
                    </div>
                </div>
            )}
        </>
    )
}
