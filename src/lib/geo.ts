export interface LatLng {
  lat: number
  lng: number
}

const EARTH_RADIUS_MILES = 3958.8
const rad = (d: number) => (d * Math.PI) / 180

export function milesBetween(a: LatLng, b: LatLng) {
  const dLat = rad(b.lat - a.lat)
  const dLng = rad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.sqrt(h))
}

export function nearest<T extends LatLng>(from: LatLng, items: T[], count: number) {
  return items
    .map((item) => ({ item, miles: milesBetween(from, item) }))
    .sort((a, b) => a.miles - b.miles)
    .slice(0, count)
}

export function formatMiles(miles: number) {
  if (miles < 0.1) return `${Math.round(miles * 5280)} ft`
  if (miles < 10) return `${miles.toFixed(1)} mi`
  return `${Math.round(miles).toLocaleString()} mi`
}
