export type PlaceStatus = 'visited' | 'wishlist'

export interface Photo {
  url: string
  caption?: string
}

export interface Place {
  id: string
  name: string
  lat: number
  lng: number
  status: PlaceStatus
  /** Free text, e.g. "June 2024" or "Our first trip" */
  date?: string
  description?: string
  photos: Photo[]
  sample?: boolean
}

export interface LivePosition {
  lat: number
  lng: number
  accuracy?: number
  at: number
}

export const LIVE_CHANNEL = 'live-location'
export const PEOPLE = ['Britton', 'Emily'] as const
export type Person = (typeof PEOPLE)[number]
