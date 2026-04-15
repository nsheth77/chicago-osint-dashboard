# Chicago OSINT Dashboard

Real-time crime monitoring system for Chicago neighborhoods with interactive map visualization and SMS alerts.

## Features

- Interactive Mapbox map with crime markers (color-coded by severity S1-S5)
- Real-time crime data from Chicago Data Portal
- Auto-refresh every 5 minutes
- Severity-based filtering (Critical, High, Medium, Low, Very Low)
- SMS notifications with phone verification (Twilio Verify + Messaging)
- MMS support with map screenshots
- Dark theme optimized for monitoring

## Tech Stack

- **Frontend:** Next.js 14+ (App Router), TypeScript, Tailwind CSS
- **Backend:** Twilio Serverless Functions (Node.js)
- **Map:** Mapbox GL JS
- **UI:** shadcn/ui components
- **State:** Zustand
- **Data:** Chicago Data Portal API, Twilio APIs

## Prerequisites

- Node.js 18+ and npm
- Mapbox account (free tier: 50k map loads/month)
- Twilio account with:
  - Toll-free phone number (for SMS)
  - Verify service configured
- Twilio CLI installed: `npm install -g twilio-cli`

## Setup

### 1. Clone and Install

```bash
git clone <repo-url>
cd osint-dashboard-serverless
npm install
cd twilio && npm install && cd ..
```

### 2. Configure Environment Variables

Create `.env.local` in project root:

```bash
# Mapbox (required for map)
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1...

# Twilio credentials (server-side only, NO NEXT_PUBLIC_ prefix)
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+1xxx
TWILIO_VERIFY_SERVICE_SID=VAxxx

# API endpoint (set based on deployment mode below)
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api  # for local
# NEXT_PUBLIC_API_BASE_URL=https://your-app.twil.io  # for Twilio Serverless
```

Create `twilio/.env` (for Twilio Functions):

```bash
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+1xxx
TWILIO_VERIFY_SERVICE_SID=VAxxx
```

## Running Locally (Next.js Dev Server)

This mode runs the full Next.js application with API routes on your local machine.

```bash
# Make sure NEXT_PUBLIC_API_BASE_URL is set to http://localhost:3000/api
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**When to use:**
- Active development and testing
- Debugging frontend and API routes
- Testing without deploying to cloud

## Running on Twilio Serverless (Cloud Deployment)

This mode deploys the frontend as static assets and backend as Twilio Functions to the cloud.

### Initial Build and Deploy

```bash
# Build Next.js static export
npm run build

# Copy built files to Twilio assets directory
cp -r out/* twilio/assets/

# Deploy to Twilio Serverless
cd twilio
twilio serverless:deploy --override-existing-project
```

**Deployment output will show:**
```
domain: your-app-xxxx-dev.twil.io
functions:
  /crimes
  /notifications-lookup
  /notifications-send-sms
  /notifications-verify-check
  /notifications-verify-send
```

### Update Frontend to Use Deployed Backend

Update `.env.local`:

```bash
NEXT_PUBLIC_API_BASE_URL=https://your-app-xxxx-dev.twil.io
```

Rebuild and redeploy:

```bash
npm run build
cp -r out/* twilio/assets/
cd twilio && twilio serverless:deploy --override-existing-project
```

Access your app at: `https://your-app-xxxx-dev.twil.io`

**When to use:**
- Production deployment
- Sharing with others (public URL)
- 24/7 availability without local server
- Testing on mobile devices

### Quick Redeploy Script

Use the provided script for faster rebuilds:

```bash
./scripts/build-and-deploy.sh
```

This script:
1. Builds Next.js static export
2. Copies files to `twilio/assets/`
3. Deploys to Twilio Serverless
4. Shows deployment URL

## Project Structure

```
osint-dashboard-serverless/
├── app/                       # Next.js app directory
│   ├── api/                   # API routes (local development only)
│   └── page.tsx               # Main dashboard page
├── components/                # React components
│   ├── map/                   # Map-related components
│   └── dashboard/             # Dashboard UI components
├── hooks/                     # Custom React hooks
│   ├── useCrimeData.ts        # Crime data fetching (SWR)
│   └── useSmsNotification.ts  # SMS notification flow
├── lib/                       # Utilities and shared logic
│   ├── api/                   # API clients
│   ├── store/                 # Zustand stores
│   └── utils/                 # Helper functions
├── twilio/                    # Twilio Serverless project
│   ├── functions/             # Serverless functions
│   │   ├── crimes.js          # Crime data endpoint
│   │   ├── notifications-*.js # SMS/verification endpoints
│   │   └── shared/            # Shared utilities
│   ├── assets/                # Static frontend files (from npm run build)
│   ├── package.json           # Function dependencies
│   └── .env                   # Twilio credentials
└── scripts/
    └── build-and-deploy.sh    # Quick deploy script
```

## Development Workflow

### Local Development (Recommended for Development)

1. Set `NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api` in `.env.local`
2. Run `npm run dev`
3. Make changes to frontend/API routes
4. Hot reload automatically applies changes

### Cloud Deployment (Recommended for Production)

1. Set `NEXT_PUBLIC_API_BASE_URL=https://your-app.twil.io` in `.env.local`
2. Run `./scripts/build-and-deploy.sh`
3. Test at deployed URL
4. Repeat for updates

## Crime Severity Classification

Crimes are classified S1-S5 based on type:

- **S5 (Red):** Homicide, Sexual Assault, Kidnapping
- **S4 (Orange):** Robbery, Aggravated Assault/Battery
- **S3 (Yellow):** Burglary, Vehicle Theft, Arson
- **S2 (Blue):** Theft, Battery, Criminal Damage
- **S1 (Gray):** Narcotics, Trespass, Deceptive Practice

See `lib/utils/severity.ts` and `twilio/functions/shared/severity.js` for full mappings.

## SMS Notification Flow

1. User enters phone number
2. Validate via Twilio Lookup API (checks if mobile)
3. Send OTP via Twilio Verify API
4. User enters 6-digit code
5. Verify OTP code
6. Capture map screenshot (if available)
7. Send SMS/MMS with crime summary

**SMS Format:**
```
Chicago Crime Alert

Top 50 of 1,234 crimes:

Severity:
• 12 Critical (S5)
• 45 High (S4)
...

Top Types:
• THEFT (234)
• BATTERY (123)
...

Data as of Apr 14, 3:45 PM
```

## Troubleshooting

### Map not loading
- Verify `NEXT_PUBLIC_MAPBOX_TOKEN` in `.env.local`
- Check browser console for token errors
- Restart dev server after changing `.env.local`

### SMS not sending
- Verify all Twilio credentials in `.env.local` and `twilio/.env`
- Check Twilio console for error logs
- Ensure toll-free number is SMS-enabled
- Verify service deployed correctly: `cd twilio && twilio serverless:list`

### 404 errors on deployed app
- Verify `NEXT_PUBLIC_API_BASE_URL` matches deployed domain
- Rebuild and redeploy after changing environment variables
- Check function URLs in deployment output match expected paths

### No crimes showing
- Chicago Data Portal has 24-48 hour reporting delay (normal)
- Check browser console for API errors
- Test API directly: `curl https://your-app.twil.io/crimes?limit=10`

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Twilio Serverless Documentation](https://www.twilio.com/docs/serverless)
- [Mapbox GL JS Documentation](https://docs.mapbox.com/mapbox-gl-js/)
- [Chicago Data Portal](https://data.cityofchicago.org/)

## License

MIT
