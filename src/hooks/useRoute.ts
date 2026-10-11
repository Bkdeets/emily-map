import { useEffect, useRef, useState } from 'react'
import { milesBetween, type LatLng } from '../lib/geo'

export interface Route {
  coordinates: [number, number][]
  /** Driving distance in miles, or null when no road route exists (we draw a straight line). */
  roadMiles: number | null
}

const straight = (a: LatLng, b: LatLng): Route => ({
  coordinates: [
    [a.lng, a.lat],
    [b.lng, b.lat],
  ],
  roadMiles: null,
})

/** Driving route between two people via the Mapbox Directions API, refetched after real movement. */
export function useRoute(a: LatLng | null, b: LatLng | null, token: string) {
  const [route, setRoute] = useState<Route | null>(null)
  const fetchedFor = useRef<[LatLng, LatLng] | null>(null)
  const requestId = useRef(0)

  useEffect(() => {
    if (!a || !b) {
      setRoute(null)
      fetchedFor.current = null
      return
    }
    const prev = fetchedFor.current
    if (prev && milesBetween(prev[0], a) < 0.25 && milesBetween(prev[1], b) < 0.25) return
    fetchedFor.current = [a, b]

    // Positions update often, so don't abort in-flight requests on rerender; just ignore stale ones.
    const id = ++requestId.current
    const url =
      `https://api.mapbox.com/directions/v5/mapbox/driving/${a.lng},${a.lat};${b.lng},${b.lat}` +
      `?geometries=geojson&overview=full&access_token=${token}`
    setRoute((r) => r ?? straight(a, b))
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (id !== requestId.current) return
        const best = data.routes?.[0]
        setRoute(best ? { coordinates: best.geometry.coordinates, roadMiles: best.distance / 1609.344 } : straight(a, b))
      })
      .catch(() => id === requestId.current && setRoute(straight(a, b)))
  }, [a, b, token])

  return route
}
