import type { Place } from '../shared/types'
import { samplePlaces } from '../shared/samplePlaces'
import { redis, PLACES_KEY } from './_lib/redis'
import { isAdmin, json } from './_lib/auth'

// GET    /api/places            -> all places (sample places if none saved yet)
// POST   /api/places            -> create or update a place (admin)
// DELETE /api/places?id=...     -> delete a place (admin)

export async function GET() {
  if (!redis) return json({ places: samplePlaces, configured: false })
  const all = await redis.hgetall<Record<string, Place>>(PLACES_KEY)
  const places = all ? Object.values(all) : []
  return json({ places: places.length ? places : samplePlaces, configured: true })
}

export async function POST(request: Request) {
  if (!isAdmin(request)) return json({ error: 'Wrong admin password' }, 401)
  if (!redis) return json({ error: 'Database is not connected yet' }, 503)

  const body = (await request.json()) as Partial<Place>
  const lat = Number(body.lat)
  const lng = Number(body.lng)
  if (!body.name?.trim() || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return json({ error: 'Name, latitude and longitude are required' }, 400)
  }

  const place: Place = {
    id: body.id && !body.id.startsWith('sample-') ? body.id : crypto.randomUUID(),
    name: body.name.trim(),
    lat,
    lng,
    status: body.status === 'wishlist' ? 'wishlist' : 'visited',
    date: body.date?.trim() || undefined,
    description: body.description?.trim() || undefined,
    photos: Array.isArray(body.photos)
      ? body.photos.filter((p) => typeof p?.url === 'string').map((p) => ({ url: p.url, caption: p.caption }))
      : [],
  }
  await redis.hset(PLACES_KEY, { [place.id]: place })
  return json({ place })
}

export async function DELETE(request: Request) {
  if (!isAdmin(request)) return json({ error: 'Wrong admin password' }, 401)
  if (!redis) return json({ error: 'Database is not connected yet' }, 503)
  const id = new URL(request.url).searchParams.get('id')
  if (!id) return json({ error: 'Missing id' }, 400)
  await redis.hdel(PLACES_KEY, id)
  return json({ ok: true })
}
