import type { Place } from '../../shared/types'
import { formatMiles } from '../lib/geo'
import { PhotoStrip } from './PhotoStrip'

interface Props {
  place: Place
  pulse: boolean
  milesAway: number | null
  onClose: () => void
  onEdit?: () => void
}

export function PlaceCard({ place, pulse, milesAway, onClose, onEdit }: Props) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center">
      <article
        key={place.id + String(pulse)}
        className={`sheet-in pointer-events-auto pb-safe max-h-[78dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white shadow-[0_-4px_24px_rgb(0_0_0/0.15)] ${pulse ? 'card-pulse' : ''}`}
      >
        <div className="sticky top-0 z-10 flex justify-center bg-white pt-2 pb-1">
          <button onClick={onClose} aria-label="Close" className="h-1.5 w-10 rounded-full bg-stone-300" />
        </div>
        <div className="space-y-3 px-4 pb-5">
          {pulse && (
            <p className="rounded-full bg-green-50 px-3 py-1 text-center text-sm font-medium text-green-700">
              You're close to this one 💚
            </p>
          )}
          <PhotoStrip photos={place.photos} />
          <header className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl leading-tight font-semibold text-stone-900">
                {place.emoji && <span className="mr-1.5">{place.emoji}</span>}
                {place.name}
              </h2>
              <p className="mt-0.5 text-sm text-stone-500">
                {[place.status === 'wishlist' ? 'Want to go' : place.date, milesAway !== null ? `${formatMiles(milesAway)} away` : null]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            </div>
            <button onClick={onClose} aria-label="Close" className="-mr-1 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-stone-100 text-stone-500">
              ✕
            </button>
          </header>
          {place.description && <p className="leading-relaxed whitespace-pre-line text-stone-700">{place.description}</p>}
          {onEdit && (
            <button onClick={onEdit} className="w-full rounded-xl border border-stone-200 py-2 text-sm font-medium text-stone-600">
              Edit this place
            </button>
          )}
        </div>
      </article>
    </div>
  )
}
