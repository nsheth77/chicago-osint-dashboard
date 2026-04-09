# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Chicago OSINT Dashboard - A real-time crime monitoring system for Chicago neighborhoods with interactive map visualization. Built as a modular, iterative application for easy feature expansion.

**Current Status:** Phase 1 MVP - Crime visualization with 5-minute auto-refresh

## Tech Stack

- **Frontend:** Next.js 14+ (App Router), TypeScript, Tailwind CSS
- **Map:** Mapbox GL JS (dark theme, cinematic styling)
- **UI Components:** shadcn/ui (dark theme)
- **State Management:** Zustand (crime filters, selected crime)
- **Data Fetching:** SWR (5-minute auto-refresh)
- **Data Source:** Chicago Data Portal API (free, no auth required)

## Development Commands

```bash
# Start development server
npm run dev

# Expose locally with ngrok (for testing on devices/sharing with friends)
ngrok http 3000

# Build for production
npm run build

# Run production build locally
npm start
```

## Architecture

### Data Flow
```
Chicago Data Portal API
  ↓
Next.js API Route (/app/api/crimes/route.ts)
  - Fetches crime data
  - Applies 5-minute server-side cache
  - Enriches with S1-S5 severity classification
  - Filters to Chicago city bounds
  ↓
SWR Hook (hooks/useCrimeData.ts)
  - Auto-refreshes every 5 minutes
  - Client-side caching
  ↓
React Components (Map, Dashboard, etc.)
```

### Layer-Based Design (Modular)

The map uses a layer-based architecture for easy feature additions:

```tsx
<CrimeMap crimes={crimes} />        // Phase 1
<VehicleMap vehicles={vehicles} />  // Phase 2 - just add new layer
<VIPMap vips={vips} />             // Phase 2 - just add new layer
```

Each feature is self-contained:
- Own API route in `app/api/`
- Own data fetching hook in `hooks/`
- Own map component in `components/map/`
- Own store slice in `lib/store/`

## Crime Severity Classification (S1-S5)

Crimes are automatically classified by type in `lib/utils/severity.ts`:

- **S5 (Red):** HOMICIDE, CRIM SEXUAL ASSAULT, KIDNAPPING
- **S4 (Orange):** ROBBERY, AGGRAVATED ASSAULT, AGGRAVATED BATTERY
- **S3 (Yellow):** BURGLARY, MOTOR VEHICLE THEFT, ARSON
- **S2 (Blue):** THEFT, BATTERY, CRIMINAL DAMAGE
- **S1 (Gray):** NARCOTICS, CRIMINAL TRESPASS, DECEPTIVE PRACTICE

Unknown types default to S2. To add new mappings, edit `SEVERITY_MAP` in `lib/utils/severity.ts`.

## Key Files

### Core Data Pipeline
1. `lib/api/chicago-data.ts` - Chicago API client with SoQL queries
2. `app/api/crimes/route.ts` - Next.js API proxy with caching and enrichment
3. `hooks/useCrimeData.ts` - SWR hook for 5-minute auto-refresh
4. `lib/utils/severity.ts` - S1-S5 classification logic

### State Management
- `lib/store/crime-store.ts` - Zustand store (filters, selected crime)

### UI Components
- `components/map/CrimeMap.tsx` - Mapbox map with crime markers
- `components/dashboard/StatsCard.tsx` - Live crime statistics
- `components/dashboard/FilterPanel.tsx` - Severity filters
- `components/dashboard/RecentCrimes.tsx` - Scrollable crime list
- `app/page.tsx` - Main dashboard layout

### Types
- `types/crime.ts` - TypeScript interfaces for Crime, Severity, Stats

## Chicago Data Portal API

**Endpoint:** `https://data.cityofchicago.org/resource/ijzp-q8t2.json`

**Query Example:**
```bash
curl "https://data.cityofchicago.org/resource/ijzp-q8t2.json?\$limit=10&\$order=date%20DESC"
```

**Important Fields:**
- `primary_type` - Crime type (used for severity classification)
- `latitude`, `longitude` - Coordinates for map markers
- `date` - Crime date/time
- `arrest` - Boolean for arrest made
- `block` - Street block address

**Data Characteristics:**
- Updates daily (24-48 hour delay is normal for police reports)
- Some records have null coordinates (automatically filtered out)
- Free, no authentication required

## Adding New Map Layers (Phase 2)

To add emergency vehicles, VIPs, or other layers:

1. **Create API client:** `lib/api/vehicle-data.ts`
2. **Create API route:** `app/api/vehicles/route.ts`
3. **Create data hook:** `hooks/useVehicleData.ts`
4. **Create map component:** `components/map/VehicleMap.tsx`
5. **Add to page:** Import and render alongside `<CrimeMap />`

Example:
```tsx
// In app/page.tsx
<div className="map-container">
  <CrimeMap crimes={crimes} />
  <VehicleLayer vehicles={vehicles} /> {/* New layer */}
</div>
```

## Environment Variables

**Required:**
- `NEXT_PUBLIC_MAPBOX_TOKEN` - Mapbox API token (get from https://account.mapbox.com/)
  - Free tier: 50,000 map loads/month
  - Prefix must be `NEXT_PUBLIC_` for client-side access

**Future (Phase 2):**
- `TWILIO_ACCOUNT_SID` - For SMS alerts
- `TWILIO_AUTH_TOKEN` - For SMS alerts
- `TWILIO_PHONE_NUMBER` - Toll-free number for sending SMS
- `DATABASE_URL` - Supabase PostgreSQL connection string

## Phase 2 Roadmap

**When ready for 24/7 alerts and cloud hosting:**

1. **Deploy to Vercel:**
   - Push to GitHub
   - Connect Vercel account (free tier)
   - Vercel auto-deploys on push

2. **Add Supabase Database:**
   - Create free Supabase account
   - Database schema:
     ```sql
     users (id, phone, verified, created_at)
     alert_locations (id, user_id, lat, lng, radius_blocks)
     ```

3. **Implement SMS Alerts:**
   - Twilio Verify API for phone validation
   - Twilio Lookup API for phone number validation
   - Background job checks new crimes against alert locations
   - Send SMS via existing toll-free number

4. **Add Map Layers:**
   - Emergency vehicles (police, fire, ambulance, helicopters)
   - VIP locations (mayor, politicians, visiting dignitaries)

## Testing

**Local Testing:**
```bash
# Start dev server
npm run dev

# Open browser
open http://localhost:3000

# Verify:
# - Map loads with Chicago centered
# - Crime markers appear with correct colors
# - Click marker shows popup
# - Filter by severity updates markers
# - Stats card shows counts
# - Recent crimes list is scrollable
```

**Testing with Friends (ngrok):**
```bash
# Terminal 1: Run dev server
npm run dev

# Terminal 2: Expose with ngrok
ngrok http 3000

# Share the https://xxx.ngrok.io URL
```

## Common Issues

**Mapbox token error:**
- Verify `.env.local` exists with `NEXT_PUBLIC_MAPBOX_TOKEN=pk.xxx`
- Restart dev server after adding token

**No crimes showing:**
- Check browser console for API errors
- Test Chicago API: `curl "https://data.cityofchicago.org/resource/ijzp-q8t2.json?\$limit=5"`
- Chicago data has 24-48 hour delay (normal)

**Map not loading:**
- Check Mapbox token is valid
- Verify `mapbox-gl` CSS is imported in `CrimeMap.tsx`
- Check browser console for errors

**Too many markers (performance):**
- Reduce `daysBack` parameter in `useCrimeData()` hook
- Enable Mapbox clustering (add to roadmap)
- Filter to specific severity levels

## Data Refresh Behavior

- **Client-side:** SWR refetches every 5 minutes automatically
- **Server-side:** Next.js API route caches for 5 minutes (`revalidate = 300`)
- **User can manually refresh:** Click anywhere on map or reload page
- **"Last updated" timestamp:** Shown in stats card

## Performance Considerations

- Mapbox handles 1000+ markers smoothly (WebGL-powered)
- If performance degrades, reduce `limit` in API call or enable clustering
- Dark theme reduces eye strain for long monitoring sessions
- 5-minute refresh balances freshness with API/server load
