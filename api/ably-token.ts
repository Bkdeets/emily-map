import Ably from 'ably'
import { LIVE_CHANNEL, PEOPLE, type Person } from '../shared/types.js'
import { safeEqual, json } from './_lib/auth.js'

// Hands the browser a short-lived Ably token scoped to the live-location channel,
// so the Ably API key never leaves the server.
export async function GET(request: Request) {
  const key = process.env.ABLY_API_KEY
  if (!key) return json({ error: 'Live location is not set up yet (ABLY_API_KEY missing)' }, 503)

  const params = new URL(request.url).searchParams
  const name = params.get('name')
  if (!PEOPLE.includes(name as Person)) return json({ error: 'Unknown person' }, 400)

  const passcode = process.env.LIVE_PASSCODE
  if (passcode && !safeEqual(params.get('passcode') ?? '', passcode)) {
    return json({ error: 'Wrong passcode' }, 401)
  }

  const rest = new Ably.Rest({ key })
  const tokenRequest = await rest.auth.createTokenRequest({
    clientId: name as Person,
    capability: { [LIVE_CHANNEL]: ['publish', 'subscribe', 'presence'] },
  })
  return json(tokenRequest)
}
