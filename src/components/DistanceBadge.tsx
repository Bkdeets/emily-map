import { formatMiles } from '../lib/geo'

export function DistanceBadge({ miles, roadMiles, partnerName }: { miles: number; roadMiles: number | null; partnerName: string }) {
  return (
    <div className="rounded-2xl bg-white/95 px-3 py-2 text-right shadow-lg backdrop-blur">
      <p className="flex items-center justify-end gap-1.5 text-[11px] font-semibold tracking-wide text-sky-600 uppercase">
        <span className="h-2 w-2 animate-pulse rounded-full bg-live" /> {partnerName} is live
      </p>
      <p className="text-lg leading-tight font-bold text-stone-900">{formatMiles(miles)} apart</p>
      {roadMiles !== null && <p className="text-xs text-stone-500">{formatMiles(roadMiles)} by road</p>}
    </div>
  )
}
