import type { Place } from './types'

// Clearly fake places so the map works before real memories are added.
// They disappear as soon as the first real place is saved.
const photo = (seed: string) => ({ url: `https://picsum.photos/seed/${seed}/900/650` })

export const samplePlaces: Place[] = [
  {
    id: 'sample-1',
    name: 'Sample: Golden Gate Park picnic',
    lat: 37.7694,
    lng: -122.4862,
    status: 'visited',
    date: 'Sample date',
    description: 'This is a sample memory. Open the site with ?admin to add your real places and photos.',
    photos: [photo('emily-1'), photo('emily-2'), photo('emily-3')],
    sample: true,
  },
  {
    id: 'sample-2',
    name: 'Sample: Coffee by the water',
    lat: 37.8087,
    lng: -122.4098,
    status: 'visited',
    date: 'Sample date',
    description: 'Another made-up memory to show how the card looks with a couple of photos.',
    photos: [photo('emily-4'), photo('emily-5')],
    sample: true,
  },
  {
    id: 'sample-3',
    name: 'Sample: Sunset hike',
    lat: 37.8324,
    lng: -122.4795,
    status: 'visited',
    date: 'Sample date',
    description: 'Sample place. Tap the dots, try the nearby bar, then replace these with the real ones.',
    photos: [photo('emily-6')],
    sample: true,
  },
  {
    id: 'sample-4',
    name: 'Sample: Somewhere we want to go',
    lat: 37.7599,
    lng: -122.4148,
    status: 'wishlist',
    description: 'Wishlist places show as green outlines.',
    photos: [photo('emily-7')],
    sample: true,
  },
  {
    id: 'sample-5',
    name: 'Sample: Weekend away someday',
    lat: 38.2975,
    lng: -122.2869,
    status: 'wishlist',
    description: 'A sample wishlist place a bit further out.',
    photos: [],
    sample: true,
  },
]
