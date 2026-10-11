import { useState } from 'react'
import { PEOPLE, type Person } from '../../shared/types'

interface Props {
  initialPerson: Person | null
  needsPasscode: boolean
  onShare: (me: Person, passcode: string) => void
  onDismiss: () => void
}

export function LocationPrompt({ initialPerson, needsPasscode, onShare, onDismiss }: Props) {
  const [person, setPerson] = useState<Person | null>(initialPerson)
  const [passcode, setPasscode] = useState('')

  return (
    <div className="absolute inset-0 z-30 flex items-end justify-center bg-black/25 p-3 sm:items-center">
      <div className="sheet-in pb-safe w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl">
        <div className="mb-3 flex items-center gap-2">
          <span className="live-dot shrink-0" />
          <h2 className="text-lg font-semibold text-stone-900">Share your location?</h2>
        </div>
        <p className="mb-4 text-sm leading-relaxed text-stone-600">
          See the places near you, and when you're both on the app, see each other on the map with the route between you.
        </p>

        {needsPasscode && person ? (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              onShare(person, passcode)
            }}
            className="space-y-2"
          >
            <input
              autoFocus
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="Our passcode"
              className="w-full rounded-xl border border-stone-200 px-3 py-3 text-base outline-none focus:border-sky-400"
            />
            <button className="w-full rounded-xl bg-sky-500 py-3 font-semibold text-white">Share</button>
          </form>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {PEOPLE.map((p) => (
              <button
                key={p}
                onClick={() => {
                  setPerson(p)
                  onShare(p, passcode)
                }}
                className="rounded-xl bg-sky-500 py-3 font-semibold text-white active:bg-sky-600"
              >
                I'm {p}
              </button>
            ))}
          </div>
        )}
        <button onClick={onDismiss} className="mt-2 w-full py-2 text-sm text-stone-500">
          Not now
        </button>
      </div>
    </div>
  )
}
