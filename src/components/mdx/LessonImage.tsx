'use client'
import { useState, useEffect } from 'react'
import { X, ZoomIn } from 'lucide-react'

const Placeholder = ({ alt }: { alt: string }) => (
  <div className="my-6 bg-gray-50 border border-dashed border-gray-300 rounded-xl p-8 text-center">
    <div className="text-3xl mb-2">🖼</div>
    <p className="text-sm font-medium text-gray-700">Diagram</p>
    <p className="text-xs text-gray-500 mt-1 italic">{alt}</p>
  </div>
)

export default function LessonImage({ src, alt }: { src: string; alt: string }) {
  const [broken, setBroken] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open])

  if (!src || src === 'PLACEHOLDER' || broken) {
    return <Placeholder alt={alt} />
  }

  return (
    <>
      <figure className="my-6 group relative cursor-zoom-in" onClick={() => setOpen(true)}>
        <img
          src={src}
          alt={alt}
          onError={() => setBroken(true)}
          className="w-full h-auto rounded-xl border border-gray-100 group-hover:brightness-95 transition-all"
        />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-black/40 rounded-full p-2">
            <ZoomIn className="w-5 h-5 text-white" />
          </div>
        </div>
        {alt && <figcaption className="text-xs text-gray-400 text-center mt-2">{alt}</figcaption>}
      </figure>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setOpen(false)}
        >
          <button
            onClick={() => setOpen(false)}
            className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          <img
            src={src}
            alt={alt}
            onClick={e => e.stopPropagation()}
            className="max-w-full max-h-[90vh] rounded-xl shadow-2xl object-contain"
          />
          {alt && (
            <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm text-center px-4">
              {alt}
            </p>
          )}
        </div>
      )}
    </>
  )
}
