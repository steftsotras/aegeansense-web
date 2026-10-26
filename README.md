# AegeanSense web

Greek-language frontend for the Aegean environmental monitoring network. Features include a Leaflet station map, Highcharts time series, date navigation, and an admin interface for FINoT profiles and synchronization.

The backend is included in [../aegeansense-api](../aegeansense-api/). See the [root README](../README.md) for complete setup and deployment instructions.

## Development

Use Node.js 20.9+ and a running backend API:

```bash
npm ci
cp .env.example .env.local
npm run dev
```

On PowerShell, use `Copy-Item .env.example .env.local`. Open `http://localhost:3000`.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Browser-accessible API base URL, embedded at build time |
| `API_URL` | Optional server-side API URL override |
| `NEXT_PUBLIC_READINGS_IN_DB` | Optional verified snapshot count for the homepage; blank shows a dash |

The API's `CORS_ORIGINS` must include the frontend origin. Admin login is at `/admin/login`; FINoT profile management and synchronization are under `/admin`.

## Checks and production

```bash
npm run lint
npm run build
npm start
```

The build downloads Google fonts and attempts to fetch initial station data. If the API is unavailable, public pages render their empty state and log fetch failures. Set production API URLs before building. The lockfile pins dependencies; the PostCSS override updates the transitive copy bundled with Next.js 15.

## Source layout

- `app/page.tsx`: homepage.
- `app/(app)/`: dashboard, stations, about, and admin routes.
- `components/`: map, charts, layout, and UI components.
- `lib/api/`: API client, response types, and chart adapters.
- `lib/`: station status, data filters, and chart formatting.

Historical data is imported by administrator-triggered backend synchronization. The interface does not implement automatic frost alerts, disease prediction, or irrigation control; these are marked as planned features.
