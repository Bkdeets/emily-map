import type { Place } from '../../shared/types'
import { formatMiles } from '../lib/geo'

interface Props {
  items: { item: Place; miles: number }[]
  label: string
  onSelect: (place: Place) => void
}

/** Floating, swipeable row of the nearest places, like Google Maps' Explore. */
export function NearbyBar({ items, label, onSelect }: Props) {
  if (!items.length) return null
  return (
    <div className="pb-safe pointer-events-none absolute inset-x-0 bottom-0 z-10">
      <p className="pointer-events-none mb-1.5 ml-4 inline-block rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-semibold text-stone-600 shadow">
        {label}
      </p>
      <div className="no-scrollbar pointer-events-auto flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-4">
        {items.map(({ item, miles }) => (
          <button
            key={item.id}
            onClick={() => onSelect(item)}
            className="flex w-[72%] max-w-72 shrink-0 snap-start items-center gap-3 rounded-2xl bg-white p-2 text-left shadow-lg"
          >
            {item.photos[0] ? (
              <img src={item.photos[0].url} alt="" loading="lazy" className="h-16 w-16 shrink-0 rounded-xl bg-stone-100 object-cover" />
            ) : (
              <div className="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-green-50 text-2xl">📍</div>
            )}
            <div className="min-w-0">
              <p className="truncate font-semibold text-stone-900">{item.name}</p>
              <p className="flex items-center gap-1.5 text-xs text-stone-500">
                <span
                  className={`inline-block h-2.5 w-2.5 rounded-full ${item.status === 'visited' ? 'bg-place' : 'border-2 border-place'}`}
                />
                {item.status === 'visited' ? 'Been there' : 'Want to go'} · {formatMiles(miles)}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
