import type { Place } from '../shared/types'
import { seedPlaces } from '../shared/places'
import { redis, PLACES_KEY } from './_lib/redis'
import { isAdmin, json } from './_lib/auth'

// The built-in places live in shared/places.ts. Redis stores edits and new places by id,
// and a { id, deleted: true } marker when a built-in place is deleted.
//
// GET    /api/places            -> all places
// POST   /api/places            -> create or update a place (admin)
// DELETE /api/places?id=...     -> delete a place (admin)

type Stored = Place | { id: string; deleted: true }

const seedIds = new Set(seedPlaces.map((p) => p.id))

export async function GET() {
  if (!redis) return json({ places: seedPlaces, configured: false })
  const stored = Object.values((await redis.hgetall<Record<string, Stored>>(PLACES_KEY)) ?? {})
  const byId = new Map(stored.map((p) => [p.id, p]))
  const places: Place[] = []
  for (const seed of seedPlaces) {
    const override = byId.get(seed.id)
    if (!override) places.push(seed)
    else if (!('deleted' in override)) places.push(override)
  }
  for (const p of stored) if (!seedIds.has(p.id) && !('deleted' in p)) places.push(p)
  return json({ places, configured: true })
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
    id: body.id || crypto.randomUUID(),
    name: body.name.trim(),
    lat,
    lng,
    status: body.status === 'wishlist' ? 'wishlist' : 'visited',
    date: body.date?.trim() || undefined,
    description: body.description?.trim() || undefined,
    emoji: body.emoji?.trim() || undefined,
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
  if (seedIds.has(id)) await redis.hset(PLACES_KEY, { [id]: { id, deleted: true } })
  else await redis.hdel(PLACES_KEY, id)
  return json({ ok: true })
}
