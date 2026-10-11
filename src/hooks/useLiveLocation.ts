import { useEffect, useRef, useState } from 'react'
import * as Ably from 'ably'
import { LIVE_CHANNEL, type LivePosition, type Person } from '../../shared/types'
import { milesBetween } from '../lib/geo'

export type LiveStatus = 'off' | 'connecting' | 'live' | 'needs-passcode' | 'unavailable' | 'error'

const tokenUrl = (me: Person, passcode: string) =>
  `/api/ably-token?name=${encodeURIComponent(me)}&passcode=${encodeURIComponent(passcode)}`

/**
 * Shares this phone's position on an Ably presence channel and listens for the other person.
 * Ably keeps a websocket open while the app is open; when both of you are on it, each sees the other.
 */
export function useLiveLocation(me: Person | null, passcode: string, position: LivePosition | null) {
  const [status, setStatus] = useState<LiveStatus>('off')
  const [partner, setPartner] = useState<LivePosition | null>(null)
  const channelRef = useRef<Ably.RealtimeChannel | null>(null)
  const lastSent = useRef<LivePosition | null>(null)

  useEffect(() => {
    if (!me) {
      setStatus('off')
      setPartner(null)
      return
    }
    let cancelled = false
    let client: Ably.Realtime | null = null
    setStatus('connecting')

    ;(async () => {
      // Check the token endpoint first so we can tell "wrong passcode" from "not set up".
      const res = await fetch(tokenUrl(me, passcode)).catch(() => null)
      if (cancelled) return
      if (res?.status === 401) return setStatus('needs-passcode')
      if (!res?.ok || !res.headers.get('content-type')?.includes('json')) return setStatus('unavailable')

      client = new Ably.Realtime({
        authCallback: async (_params, callback) => {
          try {
            const r = await fetch(tokenUrl(me, passcode))
            callback(null, await r.json())
          } catch (e) {
            callback(String(e), null)
          }
        },
      })
      client.connection.on('failed', () => setStatus('error'))
      const channel = client.channels.get(LIVE_CHANNEL)
      channelRef.current = channel

      const onPresence = (m: Ably.PresenceMessage) => {
        if (m.clientId === me) return
        if (m.action === 'leave' || m.action === 'absent') setPartner(null)
        else if (m.data) setPartner(m.data as LivePosition)
      }
      await channel.presence.subscribe(onPresence)
      const members = await channel.presence.get()
      if (cancelled) return
      members.forEach(onPresence)
      setStatus('live')
      lastSent.current = null
    })().catch(() => !cancelled && setStatus('error'))

    return () => {
      cancelled = true
      channelRef.current = null
      setPartner(null)
      client?.close()
    }
  }, [me, passcode])

  // Publish our position, throttled to meaningful moves or every 15s.
  useEffect(() => {
    const channel = channelRef.current
    if (status !== 'live' || !channel || !position) return
    const prev = lastSent.current
    if (prev && position.at - prev.at < 15_000 && milesBetween(prev, position) < 0.01) return
    lastSent.current = position
    channel.presence.update(position).catch(() => {})
  }, [status, position])

  return { status, partner }
}
