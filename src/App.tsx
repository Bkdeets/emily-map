import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { MapRef } from 'react-map-gl/mapbox'
import type { Person, Place } from '../shared/types'
import { MapView } from './components/MapView'
import { PlaceCard } from './components/PlaceCard'
import { NearbyBar } from './components/NearbyBar'
import { DistanceBadge } from './components/DistanceBadge'
import { LocationPrompt } from './components/LocationPrompt'
import { PlaceForm } from './components/PlaceForm'
import { useGeolocation } from './hooks/useGeolocation'
import { useLiveLocation } from './hooks/useLiveLocation'
import { useRoute } from './hooks/useRoute'
import { deletePlace, fetchPlaces, savePlace } from './lib/api'
import { milesBetween, nearest, type LatLng } from './lib/geo'
import { load, save } from './lib/storage'

const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined
const PROXIMITY_MILES = 1
const NEARBY_COUNT = 3
const isAdmin = new URLSearchParams(location.search).has('admin')

export default function App() {
  if (!TOKEN) return <MissingToken />
  return <MapApp token={TOKEN} />
}

function MapApp({ token }: { token: string }) {
  const mapRef = useRef<MapRef>(null)
  const [places, setPlaces] = useState<Place[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [pulseId, setPulseId] = useState<string | null>(null)
  const [center, setCenter] = useState<LatLng | null>(null)

  // Location sharing
  const [me, setMe] = useState<Person | null>(() => load('me') as Person | null)
  const [passcode, setPasscode] = useState(() => load('passcode') ?? '')
  const [promptOpen, setPromptOpen] = useState(() => !load('me') && !load('prompt-dismissed'))
  const { position, error: geoError } = useGeolocation(!!me)
  const { status: liveStatus, partner } = useLiveLocation(me, passcode, position)
  const partnerName = me ? (me === 'Britton' ? 'Emily' : 'Britton') : null
  const route = useRoute(position, partner, token)

  // Admin editing (open the site with ?admin)
  const [adminPassword, setAdminPassword] = useState(() => load('admin-password') ?? '')
  const [editing, setEditing] = useState<Partial<Place> | null>(null)
  const [picking, setPicking] = useState(false)
  const [pickedPoint, setPickedPoint] = useState<LatLng | null>(null)

  const selected = places.find((p) => p.id === selectedId) ?? null

  const reload = useCallback(async () => {
    const { places } = await fetchPlaces()
    setPlaces(places)
    return places
  }, [])

  // Load places and frame them all on the map.
  useEffect(() => {
    reload().then((loaded) => {
      const map = mapRef.current
      if (!map || !loaded.length) return
      const lngs = loaded.map((p) => p.lng)
      const lats = loaded.map((p) => p.lat)
      map.fitBounds(
        [
          [Math.min(...lngs), Math.min(...lats)],
          [Math.max(...lngs), Math.max(...lats)],
        ],
        { padding: { top: 90, bottom: 160, left: 40, right: 40 }, maxZoom: 13, duration: 0 },
      )
    })
  }, [reload])

  const openPlace = useCallback((place: Place, pulse = false) => {
    setSelectedId(place.id)
    setPulseId(pulse ? place.id : null)
    mapRef.current?.flyTo({ center: [place.lng, place.lat], zoom: Math.max(mapRef.current.getZoom(), 12), offset: [0, -140], duration: 900 })
  }, [])

  // Proximity: auto-open (and pulse) a place the first time you come within a mile of it.
  const alreadyNear = useRef(new Set<string>())
  useEffect(() => {
    if (!position) return
    const close = nearest(position, places, places.length).filter((n) => n.miles <= PROXIMITY_MILES)
    const fresh = close.find((n) => !alreadyNear.current.has(n.item.id))
    close.forEach((n) => alreadyNear.current.add(n.item.id))
    if (fresh && !editing) openPlace(fresh.item, true)
  }, [position, places, openPlace, editing])

  // Center the map on you the first time a position arrives.
  const centeredOnMe = useRef(false)
  useEffect(() => {
    if (position && !centeredOnMe.current && mapRef.current) {
      centeredOnMe.current = true
      mapRef.current.flyTo({ center: [position.lng, position.lat], zoom: Math.max(mapRef.current.getZoom(), 11) })
    }
  }, [position])

  const nearbyFrom = position ?? center
  const nearby = useMemo(() => (nearbyFrom ? nearest(nearbyFrom, places, NEARBY_COUNT) : []), [nearbyFrom, places])

  function startSharing(person: Person, code: string) {
    setMe(person)
    setPasscode(code)
    save('me', person)
    save('passcode', code)
    if (liveStatus !== 'needs-passcode' || code) setPromptOpen(false)
  }

  function stopSharing() {
    setMe(null)
    save('me', null)
  }

  useEffect(() => {
    if (liveStatus === 'needs-passcode') setPromptOpen(true)
  }, [liveStatus])

  function ensureAdminPassword() {
    if (adminPassword) return adminPassword
    const pw = prompt('Admin password') ?? ''
    setAdminPassword(pw)
    save('admin-password', pw)
    return pw
  }

  async function handleSave(place: Partial<Place>) {
    try {
      const saved = await savePlace(place, ensureAdminPassword())
      setEditing(null)
      await reload()
      openPlace(saved)
    } catch (e) {
      if ((e as Error).message.includes('password')) {
        setAdminPassword('')
        save('admin-password', null)
      }
      throw e
    }
  }

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-stone-100">
      <MapView
        ref={mapRef}
        token={token}
        places={places}
        selectedId={selectedId}
        onSelect={(p) => openPlace(p)}
        me={position}
        partner={partner}
        partnerName={partnerName}
        route={route}
        pickMode={picking}
        onPick={(pt) => {
          setPickedPoint(pt)
          setPicking(false)
        }}
        onMoveEnd={setCenter}
        onBackgroundTap={() => setSelectedId(null)}
      />

      {/* Top bar */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-2 p-3 pt-[calc(env(safe-area-inset-top)+1.25rem)]">
        <div className="pointer-events-auto flex flex-col items-start gap-2">
          <h1 className="rounded-full bg-white/95 px-3.5 py-1.5 text-base font-semibold whitespace-nowrap text-stone-900 shadow-lg">
            Everywhere,
            <span className="title-tail" aria-hidden="true">
              <span>&nbsp;I love you</span>
            </span>
          </h1>
          <button
            onClick={() => (me ? stopSharing() : setPromptOpen(true))}
            className="flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-medium text-stone-600 shadow"
          >
            <span className={`h-2 w-2 rounded-full ${me ? 'bg-live' : 'bg-stone-300'}`} />
            {me ? 'Sharing location · stop' : 'Share location'}
          </button>
          {geoError && <p className="max-w-56 rounded-xl bg-white/95 px-3 py-1.5 text-xs text-red-600 shadow">{geoError}</p>}
        </div>
        <div className="pointer-events-auto">
          {position && partner && partnerName && (
            <DistanceBadge miles={milesBetween(position, partner)} roadMiles={route?.roadMiles ?? null} partnerName={partnerName} />
          )}
        </div>
      </div>

      {picking && (
        <div className="pt-safe absolute inset-x-0 top-24 z-20 flex justify-center">
          <p className="rounded-full bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-lg">Tap the spot on the map</p>
        </div>
      )}

      {!selected && !editing && !picking && (
        <NearbyBar items={nearby} label={position ? 'Nearest to you' : 'Nearby'} onSelect={(p) => openPlace(p)} />
      )}

      {selected && !editing && (
        <PlaceCard
          place={selected}
          pulse={pulseId === selected.id}
          milesAway={position ? milesBetween(position, selected) : null}
          onClose={() => setSelectedId(null)}
          onEdit={
            isAdmin
              ? () => {
                  ensureAdminPassword()
                  setPickedPoint(null)
                  setEditing(selected)
                }
              : undefined
          }
        />
      )}

      {isAdmin && !editing && !selected && (
        <button
          onClick={() => {
            ensureAdminPassword()
            setPickedPoint(null)
            setEditing({ status: 'visited', photos: [] })
          }}
          className="absolute right-4 bottom-32 z-10 grid h-14 w-14 place-items-center rounded-full bg-green-600 text-3xl text-white shadow-xl"
          aria-label="Add place"
        >
          +
        </button>
      )}

      {editing && (
        <PlaceForm
          key={editing.id ?? 'new'}
          token={token}
          initial={editing}
          password={adminPassword}
          hidden={picking}
          pickedPoint={pickedPoint}
          onPickOnMap={() => setPicking(true)}
          onSave={handleSave}
          onDelete={
            editing.id
              ? async () => {
                  await deletePlace(editing.id!, ensureAdminPassword())
                  setEditing(null)
                  setSelectedId(null)
                  await reload()
                }
              : undefined
          }
          onCancel={() => {
            setEditing(null)
            setPicking(false)
          }}
        />
      )}

      {promptOpen && (
        <LocationPrompt
          initialPerson={me}
          needsPasscode={liveStatus === 'needs-passcode'}
          onShare={startSharing}
          onDismiss={() => {
            setPromptOpen(false)
            save('prompt-dismissed', '1')
          }}
        />
      )}
    </div>
  )
}

function MissingToken() {
  return (
    <div className="grid h-dvh place-items-center bg-stone-50 p-6 text-center">
      <div className="max-w-sm space-y-2">
        <p className="text-4xl">🗺️</p>
        <h1 className="text-lg font-semibold">Almost there</h1>
        <p className="text-sm text-stone-600">
          Add a Mapbox public token as <code className="rounded bg-stone-200 px-1">VITE_MAPBOX_TOKEN</code> (see .env.example) and reload.
        </p>
      </div>
    </div>
  )
}
