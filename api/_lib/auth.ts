import { timingSafeEqual } from 'node:crypto'

export function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  return ab.length === bb.length && timingSafeEqual(ab, bb)
}

export function isAdmin(request: Request) {
  const expected = process.env.ADMIN_PASSWORD
  const given = request.headers.get('x-admin-password') ?? ''
  return !!expected && safeEqual(given, expected)
}

export const json = (data: unknown, status = 200) => Response.json(data, { status })
