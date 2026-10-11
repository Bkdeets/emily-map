import { useEffect, useState } from 'react'
import type { LivePosition } from '../../shared/types'

export function useGeolocation(enabled: boolean) {
  const [position, setPosition] = useState<LivePosition | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled) {
      setPosition(null)
      return
    }
    if (!('geolocation' in navigator)) {
      setError('This browser cannot share location.')
      return
    }
    const id = navigator.geolocation.watchPosition(
      (p) => {
        setError(null)
        setPosition({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy, at: Date.now() })
      },
      (e) =>
        setError(
          e.code === e.PERMISSION_DENIED
            ? 'Location is blocked. Allow it for this site in your browser settings.'
            : 'Could not get your location right now.',
        ),
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 30_000 },
    )
    return () => navigator.geolocation.clearWatch(id)
  }, [enabled])

  return { position, error }
}
