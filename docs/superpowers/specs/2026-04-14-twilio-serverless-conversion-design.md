---
name: Twilio Serverless Conversion Design
description: Convert Next.js Chicago OSINT Dashboard to Twilio Serverless with parallel structure, static export, and Functions-based API
type: architecture
date: 2026-04-14
---

# Twilio Serverless Conversion Design

## Overview

Convert the existing Next.js Chicago OSINT Dashboard to run on Twilio Serverless platform while preserving the full interactive UI experience. Uses a parallel structure approach - the original Next.js app stays intact while a new `/twilio/` directory contains the Twilio Serverless deployment artifacts.

## Goals

- Deploy full dashboard to Twilio Serverless (Functions + Assets)
- Preserve all existing functionality (map, filters, SMS alerts, auto-refresh)
- Maintain original Next.js project for local development
- Single-command deployment workflow
- No local testing required (deploy and test in cloud)

## Architecture Decision: Parallel Structure

Keep the existing Next.js project intact and create a separate `/twilio/` directory for Twilio Serverless deployment. This provides:

- Safety net: original app continues working
- Clean separation: local dev vs cloud deployment
- Easy rollback if issues arise
- Fast iteration: build → deploy → test cycle

### Alternative Approaches Considered

**In-Place Conversion:** Restructure existing project directly. Rejected because it breaks the existing Next.js dev workflow and makes rollback difficult.

**Fresh Twilio Project:** Create brand new project and copy code. Rejected because it requires too much manual restructuring and increases chance of missing dependencies.

## Project Structure

```
osint-dashboard-serverless/
├── app/                          # Existing Next.js (unchanged)
├── components/                   # Existing (unchanged)
├── lib/                          # Existing (unchanged)
├── hooks/                        # Existing (unchanged)
├── types/                        # Existing (unchanged)
├── public/                       # Existing (unchanged)
├── package.json                  # Existing Next.js config
├── next.config.mjs               # Modified for static export
│
├── twilio/                       # NEW - Twilio Serverless project
│   ├── functions/                # API routes → Twilio Functions
│   │   ├── crimes.js
│   │   ├── notifications-send-sms.js
│   │   ├── notifications-verify-send.js
│   │   ├── notifications-verify-check.js
│   │   ├── notifications-lookup.js
│   │   └── shared/               # Shared utilities (not endpoints)
│   │       ├── severity.js
│   │       ├── chicago-data.js
│   │       ├── format-crime-summary.js
│   │       └── phone-validation.js
│   ├── assets/                   # Built Next.js static files (auto-generated)
│   │   ├── index.html
│   │   ├── _next/
│   │   └── ...
│   ├── .env                      # Twilio environment variables
│   └── package.json              # Twilio Functions dependencies
│
└── scripts/
    └── build-and-deploy.sh       # Build Next.js → Deploy to Twilio
```

## Component Conversions

### 1. API Routes → Twilio Functions

Each Next.js API route converts to a Twilio Function. Five functions total:

| Next.js API Route | Twilio Function | Purpose |
|-------------------|-----------------|---------|
| `/api/crimes` | `functions/crimes.js` | Fetch and enrich Chicago crime data |
| `/api/notifications/send-sms` | `functions/notifications-send-sms.js` | Send SMS alerts |
| `/api/notifications/verify-send` | `functions/notifications-verify-send.js` | Start phone verification |
| `/api/notifications/verify-check` | `functions/notifications-verify-check.js` | Check verification code |
| `/api/notifications/lookup` | `functions/notifications-lookup.js` | Validate phone number |

**Conversion Pattern:**

```javascript
// Twilio Function structure
exports.handler = async (context, event, callback) => {
  const response = new Twilio.Response();
  
  // CORS headers
  response.appendHeader('Access-Control-Allow-Origin', '*');
  response.appendHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.appendHeader('Access-Control-Allow-Headers', 'Content-Type');
  response.appendHeader('Content-Type', 'application/json');
  
  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return callback(null, response);
  }
  
  try {
    // Business logic (ported from Next.js API route)
    const result = await doWork(context, event);
    
    response.setBody({ success: true, data: result });
    return callback(null, response);
  } catch (error) {
    console.error('Error:', error);
    response.setStatusCode(500);
    response.setBody({ 
      success: false, 
      error: error.message || 'Internal server error' 
    });
    return callback(null, response);
  }
};
```

**Key Changes:**
- TypeScript → JavaScript (Functions don't support TS natively)
- `NextRequest/NextResponse` → `context/event/callback`
- Query params: `request.nextUrl.searchParams.get('x')` → `event.x`
- Environment vars: `process.env.X` → `context.X`
- Must handle CORS manually

**What Stays the Same:**
- All business logic (severity classification, crime transformation, Twilio SDK usage)
- External API calls (Chicago Data Portal, Twilio Verify/Lookup)
- Error handling patterns
- Response format: `{ success: boolean, data: any, error?: string }`

### 2. Frontend Static Export

Configure Next.js to export static HTML/CSS/JS that can be uploaded to Twilio Assets.

**Changes to `next.config.mjs`:**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',           // Enable static export
  trailingSlash: true,        // Better compatibility with static hosting
  images: {
    unoptimized: true,        // Can't use Next.js Image Optimization
  },
};

export default nextConfig;
```

**API URL Updates:**

Frontend needs to call Twilio Functions instead of Next.js API routes:

```typescript
// Before
fetch('/api/crimes?limit=1000')

// After
fetch('https://osint-dashboard-xxxx-dev.twil.io/crimes?limit=1000')
```

**Solution:** Environment variable substitution:
- Add `NEXT_PUBLIC_API_BASE_URL` to control API endpoint
- Default to `/api` for local Next.js dev
- Set to Functions URL during Twilio build

**Example in `hooks/useCrimeData.ts`:**
```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';
const response = await fetch(`${API_BASE}/crimes?limit=${limit}&days=${daysBack}`);
```

**What Works:**
- All React components (already client-side with `'use client'`)
- Mapbox GL JS (client-side rendering)
- SWR data fetching (client-side)
- Zustand state management (client-side)
- Client-side routing

**What Doesn't Work (not used in this app):**
- Server-side rendering (SSR)
- API routes (moved to Functions)
- Incremental Static Regeneration (ISR)
- Next.js Image Optimization

### 3. Shared Code and Dependencies

Twilio Functions can't import from parent directories. Shared utilities must live in `functions/shared/`.

**Utilities to Copy:**

| Source | Destination | Purpose |
|--------|-------------|---------|
| `lib/utils/severity.ts` | `functions/shared/severity.js` | S1-S5 crime classification |
| `lib/api/chicago-data.ts` | `functions/shared/chicago-data.js` | Chicago API client |
| `lib/utils/format-crime-summary.ts` | `functions/shared/format-crime-summary.js` | Format SMS message |
| `lib/utils/phone-validation.ts` | `functions/shared/phone-validation.js` | Phone validation |

**Conversion Notes:**
- Convert TypeScript → JavaScript with JSDoc comments for type hints
- ES6 imports work: `const { classifySeverity } = require('./shared/severity');`
- Subdirectories are allowed (won't become HTTP endpoints)

**Twilio Functions `package.json`:**
```json
{
  "name": "osint-dashboard-twilio",
  "version": "1.0.0",
  "dependencies": {
    "twilio": "^5.13.1",
    "node-fetch": "^2.7.0"
  }
}
```

Dependencies that move:
- `twilio` - For SMS/Verify/Lookup APIs
- `node-fetch` - For Chicago Data Portal API calls

Dependencies that stay in Next.js only:
- React/Next.js (frontend)
- Mapbox/SWR/Zustand (frontend)
- shadcn/ui (frontend)

## Build and Deployment

### One-Time Setup

```bash
# Install Twilio CLI
npm install -g twilio-cli

# Install Serverless plugin
twilio plugins:install @twilio-labs/plugin-serverless

# Login to Twilio account
twilio login

# Initialize Twilio project
mkdir twilio
cd twilio
twilio serverless:init osint-dashboard
```

### Build Script

**`scripts/build-and-deploy.sh`:**
```bash
#!/bin/bash
set -e

echo "🏗️  Building Next.js static export..."
npm run build

echo "📦 Copying static files to Twilio Assets..."
rm -rf twilio/assets/*
cp -r out/* twilio/assets/

echo "🚀 Deploying to Twilio..."
cd twilio
twilio serverless:deploy --override-existing-project

echo "✅ Deployment complete!"
echo "🌐 Visit: https://osint-dashboard-xxxx-dev.twil.io"
```

**Workflow:**
1. `npm run build` - Next.js builds static site to `/out/`
2. Script copies `/out/*` to `/twilio/assets/`
3. `twilio serverless:deploy` uploads Functions + Assets to Twilio

**Deployment Command:**
```bash
chmod +x scripts/build-and-deploy.sh
./scripts/build-and-deploy.sh
```

## Environment Variables

### Next.js Build Time (`.env.local`)

```bash
# Embedded in static build
NEXT_PUBLIC_MAPBOX_TOKEN=pk.ey...

# Points to Twilio Functions URL (set before build)
NEXT_PUBLIC_API_BASE_URL=https://osint-dashboard-xxxx-dev.twil.io
```

### Twilio Functions Runtime (`twilio/.env`)

```bash
# Auto-populated by Twilio CLI
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx

# Must set manually
TWILIO_PHONE_NUMBER=+1234567890
MAPBOX_TOKEN=pk.ey...  # Only if needed server-side
```

## CORS and Error Handling

### CORS Configuration

All Functions include CORS headers for cross-origin requests (if needed for testing from localhost):

```javascript
response.appendHeader('Access-Control-Allow-Origin', '*');
response.appendHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
response.appendHeader('Access-Control-Allow-Headers', 'Content-Type');

// Handle preflight
if (event.httpMethod === 'OPTIONS') {
  return callback(null, response);
}
```

### Error Handling Pattern

Consistent error responses across all Functions:

```javascript
try {
  // Function logic
  response.setBody({ success: true, data: result });
  return callback(null, response);
} catch (error) {
  console.error('Error:', error);
  response.setStatusCode(500);
  response.setBody({ 
    success: false, 
    error: error.message || 'Internal server error' 
  });
  return callback(null, response);
}
```

**Key Principles:**
- Always return `callback(null, response)` - even for errors
- Set HTTP status codes: `response.setStatusCode(400/500)`
- Match existing API format: `{ success: false, error: "message" }`
- Log to Twilio console: `console.error()`

## Testing Strategy

Deploy-and-test approach (no local testing required).

### Critical Test Paths

**1. Homepage Loads**
- Visit: `https://osint-dashboard-xxxx-dev.twil.io`
- Map renders with Chicago centered
- No console errors in browser DevTools

**2. Crime Data Fetches**
- Open browser DevTools → Network tab
- Should see request to `/crimes?limit=1000&days=30`
- Response contains crime data array
- Markers appear on map with correct colors (S1-S5)

**3. Filters Work**
- Click severity filters (S1-S5)
- Map markers update
- Recent crimes list filters

**4. SMS Notifications**
- Click "Get SMS Alert" button
- Enter phone number
- Complete verification flow
- Receive SMS with crime summary

### Debugging

**Check Twilio Console:**
- Functions → Service → Logs
- Look for runtime errors
- Verify environment variables set correctly

**Check Assets:**
- Functions → Service → Assets
- All HTML/JS/CSS files uploaded
- `index.html` present

**Quick Fixes:**
- Missing env var: Add in Twilio Console → Functions → Configuration → Environment Variables
- Function error: Check logs, fix code, redeploy
- Frontend broken: Check browser console, rebuild with `npm run build`

## Deployment Result

**Production URL:**
```
https://osint-dashboard-xxxx-dev.twil.io
```

**Functions Endpoints:**
```
https://osint-dashboard-xxxx-dev.twil.io/crimes
https://osint-dashboard-xxxx-dev.twil.io/notifications-send-sms
https://osint-dashboard-xxxx-dev.twil.io/notifications-verify-send
https://osint-dashboard-xxxx-dev.twil.io/notifications-verify-check
https://osint-dashboard-xxxx-dev.twil.io/notifications-lookup
```

**Static Assets:**
```
https://osint-dashboard-xxxx-dev.twil.io/           # index.html
https://osint-dashboard-xxxx-dev.twil.io/_next/...  # JS/CSS bundles
```

## Implementation Notes

### Conversion Checklist

- [ ] Modify `next.config.mjs` for static export
- [ ] Create `twilio/` directory structure
- [ ] Convert 5 API routes to Functions
- [ ] Copy shared utilities to `functions/shared/`
- [ ] Create `twilio/package.json` with dependencies
- [ ] Create `twilio/.env` with environment variables
- [ ] Update frontend API URLs to use `NEXT_PUBLIC_API_BASE_URL`
- [ ] Create build-and-deploy script
- [ ] Test Twilio CLI login and deployment
- [ ] Deploy and verify all functionality

### Constraints and Limitations

**Twilio Serverless Constraints:**
- Functions have 10-second timeout (current API calls are fast, should be fine)
- 500KB function size limit (shared utilities are small)
- No native TypeScript support (convert to JavaScript)

**Next.js Static Export Limitations:**
- No server-side rendering (not used in this app)
- No dynamic API routes (moved to Functions)
- No Image Optimization (already using `unoptimized: true`)

### Success Criteria

Deployment is successful when:
1. Dashboard loads at Twilio URL with no errors
2. Map displays crime markers with correct colors
3. Filters update markers in real-time
4. SMS notification flow works end-to-end
5. Auto-refresh fetches new data every 5 minutes
6. Original Next.js app still works locally with `npm run dev`

## Future Enhancements

Once deployed to Twilio Serverless:
- Use Twilio Sync for real-time data updates (replace 5-minute polling)
- Store user alert locations in Twilio Sync or external database
- Add Twilio Functions rate limiting for API protection
- Deploy to production environment (separate from dev)
- Add monitoring with Twilio Functions logs/metrics
