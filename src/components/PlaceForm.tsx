import { useEffect, useState } from 'react'
import type { Photo, Place, PlaceStatus } from '../../shared/types'
import { uploadPhoto } from '../lib/api'
import type { LatLng } from '../lib/geo'

interface Props {
  token: string
  initial: Partial<Place>
  password: string
  /** Hidden (but kept mounted) while the user taps a spot on the map. */
  hidden: boolean
  pickedPoint: LatLng | null
  onPickOnMap: () => void
  onSave: (place: Partial<Place>) => Promise<void>
  onDelete?: () => Promise<void>
  onCancel: () => void
}

interface SearchResult {
  name: string
  point: LatLng
}

const input = 'w-full rounded-xl border border-stone-200 px-3 py-2.5 text-base outline-none focus:border-green-500'

export function PlaceForm({ token, initial, password, hidden, pickedPoint, onPickOnMap, onSave, onDelete, onCancel }: Props) {
  const [name, setName] = useState(initial.name ?? '')
  const [status, setStatus] = useState<PlaceStatus>(initial.status ?? 'visited')
  const [date, setDate] = useState(initial.date ?? '')
  const [description, setDescription] = useState(initial.description ?? '')
  const [photos, setPhotos] = useState<Photo[]>(initial.photos ?? [])
  const [point, setPoint] = useState<LatLng | null>(initial.lat != null && initial.lng != null ? { lat: initial.lat, lng: initial.lng } : null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [uploading, setUploading] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (pickedPoint) setPoint(pickedPoint)
  }, [pickedPoint])

  async function search() {
    if (!query.trim()) return
    const url = `https://api.mapbox.com/search/geocode/v6/forward?q=${encodeURIComponent(query)}&limit=5&access_token=${token}`
    const data = await fetch(url).then((r) => r.json()).catch(() => null)
    setResults(
      (data?.features ?? []).map((f: { properties: { full_address?: string; name: string }; geometry: { coordinates: [number, number] } }) => ({
        name: f.properties.full_address ?? f.properties.name,
        point: { lng: f.geometry.coordinates[0], lat: f.geometry.coordinates[1] },
      })),
    )
  }

  async function addFiles(files: FileList | null) {
    if (!files?.length) return
    setError(null)
    try {
      for (const [i, file] of [...files].entries()) {
        setUploading(`Uploading ${i + 1} of ${files.length}…`)
        const url = await uploadPhoto(file, password, (pct) => setUploading(`Uploading ${i + 1} of ${files.length}… ${Math.round(pct)}%`))
        setPhotos((p) => [...p, { url }])
      }
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setUploading(null)
    }
  }

  async function submit() {
    if (!name.trim() || !point) return setError('Add a name and a location.')
    setBusy(true)
    setError(null)
    try {
      await onSave({ id: initial.id, name, status, date, description, photos, ...point })
    } catch (e) {
      setError((e as Error).message)
      setBusy(false)
    }
  }

  return (
    <div className={`absolute inset-x-0 bottom-0 z-30 flex justify-center ${hidden ? 'hidden' : ''}`}>
      <div className="sheet-in pb-safe max-h-[85dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-4 shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{initial.id ? 'Edit place' : 'New place'}</h2>
          <button onClick={onCancel} className="text-sm text-stone-500">
            Cancel
          </button>
        </div>

        <div className="space-y-3">
          <input className={input} placeholder="Name, e.g. Our first date" value={name} onChange={(e) => setName(e.target.value)} />

          <div className="grid grid-cols-2 gap-2">
            {(['visited', 'wishlist'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium ${status === s ? 'border-green-600 bg-green-50 text-green-800' : 'border-stone-200 text-stone-600'}`}
              >
                <span className={`h-3 w-3 rounded-full ${s === 'visited' ? 'bg-place' : 'border-2 border-place'}`} />
                {s === 'visited' ? 'Been there' : 'Want to go'}
              </button>
            ))}
          </div>

          <div className="rounded-xl border border-stone-200 p-2">
            <p className="mb-2 px-1 text-sm text-stone-600">
              {point ? `📍 ${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}` : 'Where was it?'}
            </p>
            <div className="flex gap-2">
              <input
                className={input}
                placeholder="Search an address or place"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && search()}
              />
              <button onClick={search} className="shrink-0 rounded-xl bg-stone-100 px-3 text-sm font-medium">
                Search
              </button>
            </div>
            {results.map((r) => (
              <button
                key={r.name}
                onClick={() => {
                  setPoint(r.point)
                  setResults([])
                  if (!name) setName(r.name.split(',')[0])
                }}
                className="block w-full truncate px-1 py-2 text-left text-sm text-stone-700"
              >
                {r.name}
              </button>
            ))}
            <button onClick={onPickOnMap} className="mt-2 w-full rounded-lg py-1.5 text-sm font-medium text-green-700">
              Or tap the spot on the map
            </button>
          </div>

          {status === 'visited' && <input className={input} placeholder="When, e.g. Summer 2023" value={date} onChange={(e) => setDate(e.target.value)} />}
          <textarea className={`${input} min-h-28`} placeholder="The memory…" value={description} onChange={(e) => setDescription(e.target.value)} />

          <div>
            <div className="no-scrollbar flex gap-2 overflow-x-auto">
              {photos.map((p, i) => (
                <div key={p.url} className="relative shrink-0">
                  <img src={p.url} alt="" className="h-20 w-20 rounded-xl object-cover" />
                  <button
                    onClick={() => setPhotos(photos.filter((_, j) => j !== i))}
                    className="absolute -top-1 -right-1 grid h-6 w-6 place-items-center rounded-full bg-black/70 text-xs text-white"
                    aria-label="Remove photo"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <label className="grid h-20 w-20 shrink-0 cursor-pointer place-items-center rounded-xl border-2 border-dashed border-stone-300 text-2xl text-stone-400">
                +
                <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />
              </label>
            </div>
            {uploading && <p className="mt-1 text-sm text-stone-500">{uploading}</p>}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button disabled={busy || !!uploading} onClick={submit} className="w-full rounded-xl bg-green-600 py-3 font-semibold text-white disabled:opacity-50">
            {busy ? 'Saving…' : 'Save place'}
          </button>
          {onDelete && (
            <button
              disabled={busy}
              onClick={async () => {
                if (!confirm('Delete this place?')) return
                setBusy(true)
                await onDelete().catch((e) => {
                  setError((e as Error).message)
                  setBusy(false)
                })
              }}
              className="w-full py-2 text-sm text-red-600"
            >
              Delete place
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
