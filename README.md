# Our Places 💚

A mobile-first map of the places Britton and Emily have been together (solid green dots), the places they want to go (green outlines), and, when both have the app open, each other's live location (pulsing light blue dots) with the route and distance between them.

## Features

- **Memory cards.** Each place has its own emoji marker. Tap one to open a bottom sheet with swipeable photos, the date and the memory.
- **Nearby bar.** A floating row at the bottom shows the 3 nearest places (to you, or to the map center if location is off).
- **Proximity.** With location on, coming within 1 mile of a place opens its card automatically and makes it pulse.
- **Live location.** Each person picks "I'm Britton" or "I'm Emily" once. When you're both on the app, you see each other, a route between you, and the miles apart in the top right.
- **Editing.** Open the site with `?admin` (e.g. `https://your-site.vercel.app/?admin`) to add, edit or delete places and upload photos. It asks for `ADMIN_PASSWORD` once per phone.

## Stack

| Piece | Choice | Why |
| --- | --- | --- |
| UI | Vite + React + TypeScript + Tailwind v4 | Fast static build, deploys to Vercel with zero config |
| Map | Mapbox GL via `react-map-gl` | Map, Directions (route) and Geocoding (place search) |
| Database | Upstash Redis (Vercel Marketplace) | Simplest NoSQL on Vercel; places are stored as JSON in one hash |
| Photos | Vercel Blob | Built-in CDN; phones upload straight to Blob, not through a function |
| Realtime | Ably (free tier) | Vercel functions can't hold open websockets, so a hosted realtime service carries the live-location channel. Ably presence tells each phone when the other is online. |

Serverless API routes live in `api/`:

- `GET/POST/DELETE /api/places` reads and writes places (writes need the admin password).
- `POST /api/upload` issues short-lived Blob upload tokens (admin password).
- `GET /api/ably-token` issues short-lived Ably tokens scoped to the live-location channel, optionally behind `LIVE_PASSCODE`.

The 24 places and memories are built into `shared/places.ts`, each with its own emoji marker, so the map works before a database is connected. Edits, photos and new places made with `?admin` are saved to Redis and layered on top; deleting a built-in place hides it.

## Setup

### 1. Accounts and keys

1. **Mapbox**: create an account, copy the default public token (`pk...`). Later, restrict it to your Vercel domain under Token settings.
2. **Ably**: create a free account and an app, copy its API key (the root key is fine).
3. **Vercel**: import this GitHub repo as a new project (framework preset: Vite). Then in the project:
   - Storage → Create → **Upstash for Redis** (Marketplace) and connect it to the project. This adds `KV_REST_API_URL` and `KV_REST_API_TOKEN`.
   - Storage → Create → **Blob** and connect it. This adds `BLOB_READ_WRITE_TOKEN`.
   - Settings → Environment Variables: add `VITE_MAPBOX_TOKEN`, `ABLY_API_KEY`, `ADMIN_PASSWORD`, and optionally `LIVE_PASSCODE`.
   - Redeploy so the new variables are picked up.

See `.env.example` for the full list.

### 2. Local development

```bash
npm install
cp .env.example .env.local   # fill in at least VITE_MAPBOX_TOKEN
npm run dev                   # UI only; uses sample places
# or, to run the API routes too:
npx vercel link && npx vercel env pull .env.local
npm run dev:full              # vercel dev
```

Geolocation needs HTTPS on phones, so test location features on the Vercel preview URL (or on your laptop's localhost).

### 3. Add your places

Open `/?admin` on your phone. Tap a place and **Edit this place** to add photos or move its pin, or tap **+** to add a new one (search for it or tap the map, pick an emoji, write the memory, add photos, save).

## Tip

On iPhone, open the site in Safari → Share → **Add to Home Screen** so it opens full screen like an app.
