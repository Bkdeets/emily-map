import { upload } from '@vercel/blob/client'
import type { Place } from '../../shared/types'
import { seedPlaces } from '../../shared/places'

export async function fetchPlaces(): Promise<{ places: Place[]; configured: boolean }> {
  try {
    const res = await fetch('/api/places')
    if (!res.ok || !res.headers.get('content-type')?.includes('json')) throw new Error(String(res.status))
    return await res.json()
  } catch {
    // Plain `vite` dev server has no /api, so fall back to the built-in places.
    return { places: seedPlaces, configured: false }
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
  const pathname = `photos/${file.name.replace(/[^\w.-]+/g, '-')}`
  try {
    const blob = await upload(pathname, file, {
      access: 'public',
      handleUploadUrl: '/api/upload',
      clientPayload: password,
      onUploadProgress: (e) => onProgress?.(e.percentage),
    })
    return blob.url
  } catch (e) {
    throw new Error((await uploadFailureReason(pathname, password)) ?? (e as Error).message)
  }
}

// The Blob client hides why /api/upload refused it, so ask again and read the answer ourselves.
async function uploadFailureReason(pathname: string, password: string): Promise<string | null> {
  try {
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type: 'blob.generate-client-token', payload: { pathname, clientPayload: password, multipart: false } }),
    })
    if (!res.headers.get('content-type')?.includes('json')) {
      if (res.status >= 500) return `The upload server crashed (${res.status}). Check the function logs in Vercel.`
      return 'Photo uploads need the /api server, which plain `npm run dev` does not run. Use the deployed site or `npm run dev:full`.'
    }
    return res.ok ? null : ((await res.json()).error ?? null)
  } catch {
    return null
  }
}
