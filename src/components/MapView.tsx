import { forwardRef } from 'react'
import Map, { Layer, Marker, Source, type MapRef } from 'react-map-gl/mapbox'
import type { LivePosition, Place } from '../../shared/types'
import type { LatLng } from '../lib/geo'
import type { Route } from '../hooks/useRoute'

interface Props {
  token: string
  places: Place[]
  selectedId: string | null
  onSelect: (place: Place) => void
  me: LivePosition | null
  partner: LivePosition | null
  partnerName: string | null
  route: Route | null
  pickMode: boolean
  onPick: (point: LatLng) => void
  onMoveEnd: (center: LatLng) => void
  onBackgroundTap: () => void
}

export const MapView = forwardRef<MapRef, Props>(function MapView(
  { token, places, selectedId, onSelect, me, partner, partnerName, route, pickMode, onPick, onMoveEnd, onBackgroundTap },
  ref,
) {
  return (
    <Map
      ref={ref}
      mapboxAccessToken={token}
      initialViewState={{ longitude: -98.5, latitude: 39.8, zoom: 3 }}
      mapStyle="mapbox://styles/mapbox/light-v11"
      style={{ position: 'absolute', inset: 0 }}
      cursor={pickMode ? 'crosshair' : undefined}
      attributionControl={false}
      onClick={(e) => (pickMode ? onPick({ lat: e.lngLat.lat, lng: e.lngLat.lng }) : onBackgroundTap())}
      onMoveEnd={(e) => onMoveEnd({ lat: e.viewState.latitude, lng: e.viewState.longitude })}
    >
      {route && (
        <Source id="route" type="geojson" data={{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: route.coordinates } }}>
          <Layer
            id="route-line"
            type="line"
            layout={{ 'line-cap': 'round', 'line-join': 'round' }}
            paint={{
              'line-color': '#38bdf8',
              'line-width': 5,
              'line-opacity': 0.85,
              ...(route.roadMiles === null ? { 'line-dasharray': [1, 2] } : {}),
            }}
          />
        </Source>
      )}

      {places.map((place) => {
        const selected = place.id === selectedId
        return (
          <Marker
            key={place.id}
            longitude={place.lng}
            latitude={place.lat}
            onClick={(e) => {
              e.originalEvent.stopPropagation()
              if (!pickMode) onSelect(place)
            }}
          >
            {/* Large invisible hit area around a small dot for easy tapping */}
            <button aria-label={place.name} className="grid h-11 w-11 place-items-center">
              <span
                className={[
                  'grid place-items-center rounded-full leading-none transition-transform duration-200',
                  place.emoji ? 'h-8 w-8 text-[17px]' : 'h-4 w-4',
                  place.status === 'visited'
                    ? 'bg-place ring-2 ring-white shadow-md'
                    : `border-[3px] border-place ${place.emoji ? 'bg-white/85' : 'bg-transparent'}`,
                  selected ? (place.emoji ? 'scale-125' : 'scale-150') : '',
                ].join(' ')}
              >
                {place.emoji}
              </span>
            </button>
          </Marker>
        )
      })}

      {partner && (
        <Marker longitude={partner.lng} latitude={partner.lat}>
          <div className="flex flex-col items-center">
            <div className="live-dot" />
            {partnerName && (
              <span className="mt-1 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-sky-600 shadow">
                {partnerName}
              </span>
            )}
          </div>
        </Marker>
      )}
      {me && (
        <Marker longitude={me.lng} latitude={me.lat}>
          <div className="live-dot" />
        </Marker>
      )}
    </Map>
  )
})
