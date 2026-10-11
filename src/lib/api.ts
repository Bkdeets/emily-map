import { upload } from '@vercel/blob/client'
import type { Place } from '../../shared/types'
import { samplePlaces } from '../../shared/samplePlaces'

export async function fetchPlaces(): Promise<{ places: Place[]; configured: boolean }> {
  try {
    const res = await fetch('/api/places')
    if (!res.ok || !res.headers.get('content-type')?.includes('json')) throw new Error(String(res.status))
    return await res.json()
  } catch {
    // Plain `vite` dev server has no /api, so fall back to the sample places.
    return { places: samplePlaces, configured: false }
  }
}

async function adminRequest(method: string, path: string, password: string, body?: unknown) {
  const res = await fetch(path, {
    method,
    headers: { 'content-type': 'application/json', 'x-admin-password': password },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`)
  return data
}

export async function savePlace(place: Partial<Place>, password: string): Promise<Place> {
  return (await adminRequest('POST', '/api/places', password, place)).place
}

export async function deletePlace(id: string, password: string) {
  await adminRequest('DELETE', `/api/places?id=${encodeURIComponent(id)}`, password)
}

export async function uploadPhoto(file: File, password: string, onProgress?: (pct: number) => void) {
  const safeName = file.name.replace(/[^\w.-]+/g, '-')
  const blob = await upload(`photos/${safeName}`, file, {
    access: 'public',
    handleUploadUrl: '/api/upload',
    clientPayload: password,
    onUploadProgress: (e) => onProgress?.(e.percentage),
  })
  return blob.url
}
