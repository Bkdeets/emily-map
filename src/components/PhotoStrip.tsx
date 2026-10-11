import { useState } from 'react'
import type { Photo } from '../../shared/types'

export function PhotoStrip({ photos }: { photos: Photo[] }) {
  const [index, setIndex] = useState(0)
  if (!photos.length) return null
  return (
    <div className="relative">
      <div
        className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto rounded-2xl"
        onScroll={(e) => {
          const el = e.currentTarget
          setIndex(Math.round(el.scrollLeft / el.clientWidth))
        }}
      >
        {photos.map((photo, i) => (
          <figure key={photo.url + i} className="w-full shrink-0 snap-center">
            <img src={photo.url} alt={photo.caption ?? ''} loading="lazy" className="aspect-[4/3] w-full bg-stone-100 object-cover" />
            {photo.caption && <figcaption className="px-1 pt-1 text-xs text-stone-500">{photo.caption}</figcaption>}
          </figure>
        ))}
      </div>
      {photos.length > 1 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center gap-1.5">
          {photos.map((_, i) => (
            <span key={i} className={`h-1.5 rounded-full bg-white shadow transition-all ${i === index ? 'w-4' : 'w-1.5 opacity-70'}`} />
          ))}
        </div>
      )}
    </div>
  )
}
