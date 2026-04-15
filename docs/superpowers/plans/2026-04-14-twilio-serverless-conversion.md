# Twilio Serverless Conversion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert Next.js Chicago OSINT Dashboard to Twilio Serverless with parallel structure, preserving full interactive UI experience.

**Architecture:** Parallel structure - keep existing Next.js project intact, create new `/twilio/` directory with Functions (API backend) and Assets (static frontend). Frontend calls Twilio Functions via environment variable-controlled URLs.

**Tech Stack:** Next.js static export, Twilio Serverless Functions, Twilio CLI, node-fetch, Twilio SDK

---

## File Structure Map

**New Files (Twilio Serverless):**
- `twilio/package.json` - Twilio Functions dependencies
- `twilio/.env` - Twilio runtime environment variables
- `twilio/.gitignore` - Ignore build artifacts and secrets
- `twilio/functions/crimes.js` - Crime data API endpoint
- `twilio/functions/notifications-send-sms.js` - Send SMS endpoint
- `twilio/functions/notifications-verify-send.js` - Start verification endpoint
- `twilio/functions/notifications-verify-check.js` - Check verification endpoint
- `twilio/functions/notifications-lookup.js` - Phone lookup endpoint
- `twilio/functions/shared/severity.js` - Crime severity classification
- `twilio/functions/shared/chicago-data.js` - Chicago API client
- `twilio/functions/shared/format-crime-summary.js` - SMS formatting
- `twilio/functions/shared/phone-validation.js` - Phone utilities
- `scripts/build-and-deploy.sh` - Build and deployment script

**Modified Files:**
- `next.config.mjs` - Add static export configuration
- `hooks/useCrimeData.ts` - Use API_BASE env variable
- `components/notifications/SmsNotificationDialog.tsx` - Use API_BASE env variable (if hardcoded)

**Generated (Auto-created):**
- `out/` - Next.js static build output
- `twilio/assets/` - Copied from `out/` directory

---

## Task 1: Configure Next.js for Static Export

**Files:**
- Modify: `next.config.mjs`

- [ ] **Step 1: Update next.config.mjs for static export**

Read the current config first:

```bash
cat next.config.mjs
```

Then update it to:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
```

- [ ] **Step 2: Test Next.js static build**

Run the build command to verify static export works:

```bash
npm run build
```

Expected output:
- "Route (app) exported as static HTML" messages
- Build completes successfully
- `out/` directory created with static files

- [ ] **Step 3: Verify build output**

Check that key files exist:

```bash
ls -la out/
ls -la out/_next/
test -f out/index.html && echo "✓ index.html exists" || echo "✗ index.html missing"
```

Expected: Directory structure with `index.html`, `_next/` folder, and static assets

- [ ] **Step 4: Commit**

```bash
git add next.config.mjs
git commit -m "feat: configure Next.js for static export

Enable static HTML export for Twilio Serverless Assets deployment.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 2: Create Twilio Project Structure

**Files:**
- Create: `twilio/package.json`
- Create: `twilio/.env`
- Create: `twilio/.gitignore`
- Create: `twilio/functions/.gitkeep`
- Create: `twilio/functions/shared/.gitkeep`
- Create: `twilio/assets/.gitkeep`

- [ ] **Step 1: Create twilio directory structure**

```bash
mkdir -p twilio/functions/shared
mkdir -p twilio/assets
```

- [ ] **Step 2: Create package.json**

```bash
cat > twilio/package.json << 'EOF'
{
  "name": "osint-dashboard-twilio",
  "version": "1.0.0",
  "description": "Twilio Serverless Functions for Chicago OSINT Dashboard",
  "main": "index.js",
  "scripts": {
    "test": "echo \"No tests yet\""
  },
  "dependencies": {
    "twilio": "^5.13.1",
    "node-fetch": "^2.7.0"
  },
  "engines": {
    "node": ">=18"
  }
}
EOF
```

- [ ] **Step 3: Create .env template**

```bash
cat > twilio/.env << 'EOF'
# Auto-populated by Twilio CLI
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=

# Must set manually
TWILIO_PHONE_NUMBER=
TWILIO_VERIFY_SERVICE_SID=
EOF
```

- [ ] **Step 4: Create .gitignore**

```bash
cat > twilio/.gitignore << 'EOF'
# Dependencies
node_modules/

# Environment variables
.env

# Twilio build artifacts
.twilio-functions

# Assets (generated from Next.js build)
assets/*
!assets/.gitkeep
EOF
```

- [ ] **Step 5: Create .gitkeep files to preserve directory structure**

```bash
touch twilio/functions/.gitkeep
touch twilio/functions/shared/.gitkeep
touch twilio/assets/.gitkeep
```

- [ ] **Step 6: Install Twilio dependencies**

```bash
cd twilio && npm install && cd ..
```

Expected: `twilio/node_modules/` created, `package-lock.json` generated

- [ ] **Step 7: Commit**

```bash
git add twilio/
git commit -m "feat: create Twilio Serverless project structure

Initialize twilio/ directory with package.json, .env template, and
.gitignore for Functions deployment.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Create Shared Utilities - Severity Classification

**Files:**
- Create: `twilio/functions/shared/severity.js`

- [ ] **Step 1: Create severity.js with crime classification logic**

```javascript
// twilio/functions/shared/severity.js

/**
 * @typedef {'S1' | 'S2' | 'S3' | 'S4' | 'S5'} SeverityLevel
 */

// Crime type to severity mapping
const SEVERITY_MAP = {
  // S5 - Critical (Red)
  'HOMICIDE': 'S5',
  'CRIM SEXUAL ASSAULT': 'S5',
  'CRIMINAL SEXUAL ASSAULT': 'S5',
  'KIDNAPPING': 'S5',

  // S4 - High (Orange)
  'ROBBERY': 'S4',
  'AGGRAVATED ASSAULT': 'S4',
  'AGGRAVATED BATTERY': 'S4',
  'ASSAULT': 'S4',

  // S3 - Medium (Yellow)
  'BURGLARY': 'S3',
  'MOTOR VEHICLE THEFT': 'S3',
  'ARSON': 'S3',

  // S2 - Low (Blue)
  'THEFT': 'S2',
  'BATTERY': 'S2',
  'CRIMINAL DAMAGE': 'S2',
  'CRIMINAL TRESPASS': 'S2',

  // S1 - Very Low (Gray)
  'NARCOTICS': 'S1',
  'DECEPTIVE PRACTICE': 'S1',
  'OTHER OFFENSE': 'S1',
  'PUBLIC PEACE VIOLATION': 'S1',
  'INTERFERENCE WITH PUBLIC OFFICER': 'S1',
};

// Severity colors for map markers
const SEVERITY_COLORS = {
  S5: '#ef4444', // red-500
  S4: '#f97316', // orange-500
  S3: '#eab308', // yellow-500
  S2: '#3b82f6', // blue-500
  S1: '#6b7280', // gray-500
};

// Severity labels for UI
const SEVERITY_LABELS = {
  S5: 'Critical',
  S4: 'High',
  S3: 'Medium',
  S2: 'Low',
  S1: 'Very Low',
};

/**
 * Classifies a crime type into a severity level (S1-S5)
 * @param {string} crimeType - The primary crime type from Chicago API
 * @returns {SeverityLevel} Severity level (defaults to S2 for unknown types)
 */
function classifySeverity(crimeType) {
  const normalized = crimeType.toUpperCase().trim();
  return SEVERITY_MAP[normalized] || 'S2'; // Default to medium if unknown
}

/**
 * Gets the color for a severity level
 * @param {SeverityLevel} severity - The severity level
 * @returns {string} Hex color code
 */
function getSeverityColor(severity) {
  return SEVERITY_COLORS[severity];
}

/**
 * Gets the label for a severity level
 * @param {SeverityLevel} severity - The severity level
 * @returns {string} Human-readable label
 */
function getSeverityLabel(severity) {
  return SEVERITY_LABELS[severity];
}

/**
 * Gets all severity levels ordered from highest to lowest
 * @returns {SeverityLevel[]}
 */
function getAllSeverities() {
  return ['S5', 'S4', 'S3', 'S2', 'S1'];
}

module.exports = {
  classifySeverity,
  getSeverityColor,
  getSeverityLabel,
  getAllSeverities,
  SEVERITY_MAP,
  SEVERITY_COLORS,
  SEVERITY_LABELS,
};
```

Save to: `twilio/functions/shared/severity.js`

- [ ] **Step 2: Verify file created**

```bash
test -f twilio/functions/shared/severity.js && echo "✓ severity.js created" || echo "✗ File missing"
cat twilio/functions/shared/severity.js | head -20
```

Expected: File exists and contains SEVERITY_MAP

- [ ] **Step 3: Commit**

```bash
git add twilio/functions/shared/severity.js
git commit -m "feat: add severity classification utility for Functions

Port TypeScript severity.ts to JavaScript for Twilio Functions use.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 4: Create Shared Utilities - Chicago Data Client

**Files:**
- Create: `twilio/functions/shared/chicago-data.js`

- [ ] **Step 1: Create chicago-data.js with API client**

```javascript
// twilio/functions/shared/chicago-data.js

const fetch = require('node-fetch');

const CHICAGO_API_BASE = 'https://data.cityofchicago.org/resource/ijzp-q8t2.json';

// Chicago city bounds (approximate)
const CHICAGO_BOUNDS = {
  north: 42.05,
  south: 41.64,
  east: -87.52,
  west: -87.95,
};

/**
 * Fetches recent crime data from Chicago Data Portal
 * @param {number} limit - Maximum number of records to fetch
 * @param {number} daysBack - Number of days to look back
 * @returns {Promise<Array>} Array of crime records
 */
async function fetchChicagoCrimes(limit = 1000, daysBack = 7) {
  try {
    // Calculate date threshold
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - daysBack);
    const dateString = dateThreshold.toISOString().split('T')[0];

    // Build SoQL query
    const params = new URLSearchParams({
      $limit: limit.toString(),
      $order: 'date DESC',
      $where: `date > '${dateString}T00:00:00'`,
    });

    const url = `${CHICAGO_API_BASE}?${params}`;

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Chicago API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Filter out records without coordinates and outside Chicago bounds
    const filtered = data.filter((crime) => {
      if (!crime.latitude || !crime.longitude) return false;

      const lat = parseFloat(crime.latitude);
      const lng = parseFloat(crime.longitude);

      // Check if coordinates are valid and within Chicago bounds
      if (isNaN(lat) || isNaN(lng)) return false;

      return (
        lat >= CHICAGO_BOUNDS.south &&
        lat <= CHICAGO_BOUNDS.north &&
        lng >= CHICAGO_BOUNDS.west &&
        lng <= CHICAGO_BOUNDS.east
      );
    });

    return filtered;
  } catch (error) {
    console.error('Error fetching Chicago crime data:', error);
    throw error;
  }
}

/**
 * Validates crime data has required fields
 * @param {object} crime - Raw crime record
 * @returns {boolean}
 */
function isValidCrime(crime) {
  return !!(
    crime.id &&
    crime.date &&
    crime.primary_type &&
    crime.latitude &&
    crime.longitude
  );
}

module.exports = {
  fetchChicagoCrimes,
  isValidCrime,
  CHICAGO_BOUNDS,
};
```

Save to: `twilio/functions/shared/chicago-data.js`

- [ ] **Step 2: Verify file created**

```bash
test -f twilio/functions/shared/chicago-data.js && echo "✓ chicago-data.js created" || echo "✗ File missing"
grep "fetchChicagoCrimes" twilio/functions/shared/chicago-data.js
```

Expected: File exists and contains fetchChicagoCrimes function

- [ ] **Step 3: Commit**

```bash
git add twilio/functions/shared/chicago-data.js
git commit -m "feat: add Chicago Data Portal API client for Functions

Port chicago-data.ts to JavaScript with fetch support.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 5: Create Shared Utilities - SMS Formatting

**Files:**
- Create: `twilio/functions/shared/format-crime-summary.js`

- [ ] **Step 1: Create format-crime-summary.js**

```javascript
// twilio/functions/shared/format-crime-summary.js

const { SEVERITY_LABELS } = require('./severity');

/**
 * Formats crimes into SMS-friendly text summary
 * @param {Array} crimes - Array of enriched crime objects
 * @param {object} options - Formatting options
 * @param {number} options.maxCrimes - Max crimes to include (default 50)
 * @param {number} options.maxTypes - Max crime types to show (default 5)
 * @returns {string} Formatted SMS message
 */
function formatCrimeSummary(crimes, options = {}) {
  const { maxCrimes = 50, maxTypes = 5 } = options;

  const originalCount = crimes.length;

  // Sort by severity (S5 > S4 > S3 > S2 > S1)
  const severityOrder = { S5: 5, S4: 4, S3: 3, S2: 2, S1: 1 };
  const sortedCrimes = [...crimes].sort(
    (a, b) => severityOrder[b.severity] - severityOrder[a.severity]
  );

  // Limit to max crimes
  const limitedCrimes = sortedCrimes.slice(0, maxCrimes);
  const isLimited = originalCount > maxCrimes;

  // Calculate severity distribution
  const severityCount = {
    S5: 0,
    S4: 0,
    S3: 0,
    S2: 0,
    S1: 0,
  };

  limitedCrimes.forEach((crime) => {
    severityCount[crime.severity]++;
  });

  // Calculate top crime types
  const typeCount = new Map();
  limitedCrimes.forEach((crime) => {
    typeCount.set(crime.type, (typeCount.get(crime.type) || 0) + 1);
  });

  const topTypes = Array.from(typeCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxTypes)
    .map(([type, count]) => `${type} (${count})`);

  // Build SMS message
  let message = `Chicago Crime Alert\n\n`;

  if (isLimited) {
    message += `Top ${maxCrimes} of ${originalCount.toLocaleString()} crimes:\n\n`;
  } else {
    message += `${originalCount.toLocaleString()} crimes displayed:\n\n`;
  }

  message += `Severity:\n`;
  if (severityCount.S5 > 0)
    message += `• ${severityCount.S5} Critical (S5)\n`;
  if (severityCount.S4 > 0) message += `• ${severityCount.S4} High (S4)\n`;
  if (severityCount.S3 > 0) message += `• ${severityCount.S3} Medium (S3)\n`;
  if (severityCount.S2 > 0) message += `• ${severityCount.S2} Low (S2)\n`;
  if (severityCount.S1 > 0)
    message += `• ${severityCount.S1} Very Low (S1)\n`;

  message += `\nTop Types:\n`;
  topTypes.forEach((type) => {
    message += `• ${type}\n`;
  });

  const now = new Date();
  message += `\nData as of ${now.toLocaleString('en-US', {
    timeZone: 'America/Chicago',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })}`;

  return message;
}

module.exports = {
  formatCrimeSummary,
};
```

Save to: `twilio/functions/shared/format-crime-summary.js`

- [ ] **Step 2: Verify file created**

```bash
test -f twilio/functions/shared/format-crime-summary.js && echo "✓ format-crime-summary.js created" || echo "✗ File missing"
grep "formatCrimeSummary" twilio/functions/shared/format-crime-summary.js
```

Expected: File exists and contains formatCrimeSummary function

- [ ] **Step 3: Commit**

```bash
git add twilio/functions/shared/format-crime-summary.js
git commit -m "feat: add SMS crime summary formatter for Functions

Port format-crime-summary.ts to JavaScript.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 6: Create Shared Utilities - Phone Validation

**Files:**
- Create: `twilio/functions/shared/phone-validation.js`

- [ ] **Step 1: Create phone-validation.js**

```javascript
// twilio/functions/shared/phone-validation.js

/**
 * Formats phone number to E.164 format (+1XXXXXXXXXX)
 * @param {string} input - Raw phone number input
 * @returns {string|null} Formatted phone or null if invalid
 */
function formatPhoneNumber(input) {
  // Remove all non-digit characters
  const digits = input.replace(/\D/g, '');

  // Handle US numbers (10 or 11 digits)
  if (digits.length === 10) {
    return `+1${digits}`;
  }

  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }

  return null; // Invalid format
}

/**
 * Validates E.164 phone number format
 * @param {string} phone - Phone number to validate
 * @returns {boolean}
 */
function isValidPhoneFormat(phone) {
  return /^\+1\d{10}$/.test(phone);
}

/**
 * Formats phone for display: +12345678901 -> (234) 567-8901
 * @param {string} phone - E.164 formatted phone
 * @returns {string}
 */
function formatPhoneDisplay(phone) {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) {
    const areaCode = digits.slice(1, 4);
    const prefix = digits.slice(4, 7);
    const line = digits.slice(7);
    return `(${areaCode}) ${prefix}-${line}`;
  }
  return phone;
}

module.exports = {
  formatPhoneNumber,
  isValidPhoneFormat,
  formatPhoneDisplay,
};
```

Save to: `twilio/functions/shared/phone-validation.js`

- [ ] **Step 2: Verify file created**

```bash
test -f twilio/functions/shared/phone-validation.js && echo "✓ phone-validation.js created" || echo "✗ File missing"
grep "formatPhoneNumber" twilio/functions/shared/phone-validation.js
```

Expected: File exists and contains phone validation functions

- [ ] **Step 3: Commit**

```bash
git add twilio/functions/shared/phone-validation.js
git commit -m "feat: add phone validation utilities for Functions

Port phone-validation.ts to JavaScript.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 7: Create Crimes Function

**Files:**
- Create: `twilio/functions/crimes.js`

- [ ] **Step 1: Create crimes.js Function**

```javascript
// twilio/functions/crimes.js

const { fetchChicagoCrimes, isValidCrime } = require(Runtime.getFunctions()['shared/chicago-data'].path);
const { classifySeverity, getSeverityColor } = require(Runtime.getFunctions()['shared/severity'].path);

/**
 * Transforms raw Chicago crime data into enriched Crime objects
 * @param {object} raw - Raw crime record from Chicago API
 * @returns {object|null} Enriched crime object or null if invalid
 */
function transformCrime(raw) {
  if (!isValidCrime(raw)) return null;

  const severity = classifySeverity(raw.primary_type);

  return {
    id: raw.id,
    caseNumber: raw.case_number,
    date: new Date(raw.date).toISOString(),
    block: raw.block,
    type: raw.primary_type,
    description: raw.description,
    location: raw.location_description,
    latitude: parseFloat(raw.latitude),
    longitude: parseFloat(raw.longitude),
    arrest: raw.arrest,
    domestic: raw.domestic,
    severity,
    color: getSeverityColor(severity),
    district: raw.district,
    ward: raw.ward,
  };
}

exports.handler = async (context, event, callback) => {
  const response = new Twilio.Response();
  
  // CORS headers
  response.appendHeader('Access-Control-Allow-Origin', '*');
  response.appendHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.appendHeader('Access-Control-Allow-Headers', 'Content-Type');
  response.appendHeader('Content-Type', 'application/json');
  response.appendHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
  
  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return callback(null, response);
  }
  
  try {
    // Get query parameters
    const limit = parseInt(event.limit || '1000');
    const daysBack = parseInt(event.days || '7');

    console.log(`Fetching crimes: limit=${limit}, daysBack=${daysBack}`);

    // Fetch from Chicago API
    const rawCrimes = await fetchChicagoCrimes(limit, daysBack);

    // Transform and enrich with severity
    const crimes = rawCrimes
      .map(transformCrime)
      .filter((crime) => crime !== null);

    console.log(`Successfully transformed ${crimes.length} crimes`);

    response.setBody({
      success: true,
      count: crimes.length,
      lastUpdated: new Date().toISOString(),
      data: crimes,
    });
    
    return callback(null, response);
  } catch (error) {
    console.error('Crimes API error:', error);
    
    response.setStatusCode(500);
    response.setBody({
      success: false,
      error: error.message || 'Failed to fetch crime data',
      count: 0,
      data: [],
    });
    
    return callback(null, response);
  }
};
```

Save to: `twilio/functions/crimes.js`

- [ ] **Step 2: Verify file created**

```bash
test -f twilio/functions/crimes.js && echo "✓ crimes.js created" || echo "✗ File missing"
grep "exports.handler" twilio/functions/crimes.js
```

Expected: File exists and contains exports.handler

- [ ] **Step 3: Commit**

```bash
git add twilio/functions/crimes.js
git commit -m "feat: add crimes Function endpoint

Convert Next.js /api/crimes route to Twilio Function with CORS support.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 8: Create SMS Send Function

**Files:**
- Create: `twilio/functions/notifications-send-sms.js`

- [ ] **Step 1: Create notifications-send-sms.js Function**

```javascript
// twilio/functions/notifications-send-sms.js

const { formatCrimeSummary } = require(Runtime.getFunctions()['shared/format-crime-summary'].path);

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
    // Parse request body (Twilio Functions receive JSON as string)
    const body = typeof event.request === 'string' 
      ? JSON.parse(event.request) 
      : event;
    
    const { phoneNumber, crimes, mapSnapshot } = body;

    if (!phoneNumber || !crimes) {
      response.setStatusCode(400);
      response.setBody({ 
        success: false, 
        error: 'Missing phoneNumber or crimes' 
      });
      return callback(null, response);
    }

    const fromNumber = context.TWILIO_PHONE_NUMBER;

    if (!fromNumber) {
      response.setStatusCode(500);
      response.setBody({ 
        success: false, 
        error: 'Twilio not configured' 
      });
      return callback(null, response);
    }

    const client = context.getTwilioClient();

    // Format crime summary (limited to 50 crimes)
    const messageBody = formatCrimeSummary(crimes, { maxCrimes: 50 });

    // Prepare message options
    const messageOptions = {
      body: messageBody,
      from: fromNumber,
      to: phoneNumber,
    };

    // If map snapshot provided, log warning (MMS not supported in MVP)
    if (mapSnapshot) {
      console.warn('⚠️ Map snapshot provided but MMS not supported in MVP');
      console.warn('💡 Falling back to SMS-only (text crime summary)');
      console.warn('📝 For production MMS: Upload to S3/Cloudinary (see docs/mms-implementation-guide.md)');
      console.log('📱 Sending SMS only (map screenshot skipped)');
      // Do NOT set mediaUrl - continue with SMS-only
    } else {
      console.log('📱 Sending SMS only (no map screenshot)');
    }

    // Send SMS
    const message = await client.messages.create(messageOptions);

    console.log('✅ SMS sent successfully:', message.sid);

    response.setBody({
      success: true,
      messageSid: message.sid,
      segmentCount: message.numSegments 
        ? parseInt(message.numSegments) 
        : undefined,
    });
    
    return callback(null, response);
  } catch (error) {
    console.error('Send SMS error:', error);
    
    response.setStatusCode(400);
    response.setBody({ 
      success: false, 
      error: error.message || 'Failed to send SMS. Please try again.' 
    });
    
    return callback(null, response);
  }
};
```

Save to: `twilio/functions/notifications-send-sms.js`

- [ ] **Step 2: Verify file created**

```bash
test -f twilio/functions/notifications-send-sms.js && echo "✓ notifications-send-sms.js created" || echo "✗ File missing"
grep "exports.handler" twilio/functions/notifications-send-sms.js
```

Expected: File exists and contains exports.handler

- [ ] **Step 3: Commit**

```bash
git add twilio/functions/notifications-send-sms.js
git commit -m "feat: add SMS send Function endpoint

Convert Next.js /api/notifications/send-sms to Twilio Function.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 9: Create Verify Send Function

**Files:**
- Create: `twilio/functions/notifications-verify-send.js`

- [ ] **Step 1: Create notifications-verify-send.js Function**

```javascript
// twilio/functions/notifications-verify-send.js

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
    // Parse request body
    const body = typeof event.request === 'string' 
      ? JSON.parse(event.request) 
      : event;
    
    const { phoneNumber } = body;

    if (!phoneNumber) {
      response.setStatusCode(400);
      response.setBody({ 
        success: false, 
        error: 'Missing phoneNumber' 
      });
      return callback(null, response);
    }

    const verifySid = context.TWILIO_VERIFY_SERVICE_SID;

    if (!verifySid) {
      response.setStatusCode(500);
      response.setBody({ 
        success: false, 
        error: 'Twilio Verify not configured' 
      });
      return callback(null, response);
    }

    const client = context.getTwilioClient();

    // Send OTP verification code
    const verification = await client.verify.v2
      .services(verifySid)
      .verifications.create({ to: phoneNumber, channel: 'sms' });

    console.log('✅ Verification sent:', verification.status);

    response.setBody({
      success: true,
      status: verification.status,
    });
    
    return callback(null, response);
  } catch (error) {
    console.error('Verify send error:', error);
    
    response.setStatusCode(400);
    response.setBody({ 
      success: false, 
      status: 'failed', 
      error: 'Failed to send code' 
    });
    
    return callback(null, response);
  }
};
```

Save to: `twilio/functions/notifications-verify-send.js`

- [ ] **Step 2: Verify file created**

```bash
test -f twilio/functions/notifications-verify-send.js && echo "✓ notifications-verify-send.js created" || echo "✗ File missing"
grep "exports.handler" twilio/functions/notifications-verify-send.js
```

Expected: File exists and contains exports.handler

- [ ] **Step 3: Commit**

```bash
git add twilio/functions/notifications-verify-send.js
git commit -m "feat: add Verify send Function endpoint

Convert Next.js /api/notifications/verify-send to Twilio Function.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 10: Create Verify Check Function

**Files:**
- Create: `twilio/functions/notifications-verify-check.js`

- [ ] **Step 1: Create notifications-verify-check.js Function**

```javascript
// twilio/functions/notifications-verify-check.js

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
    // Parse request body
    const body = typeof event.request === 'string' 
      ? JSON.parse(event.request) 
      : event;
    
    const { phoneNumber, code } = body;

    if (!phoneNumber || !code) {
      response.setStatusCode(400);
      response.setBody({ 
        success: false, 
        error: 'Missing phoneNumber or code' 
      });
      return callback(null, response);
    }

    const verifySid = context.TWILIO_VERIFY_SERVICE_SID;

    if (!verifySid) {
      response.setStatusCode(500);
      response.setBody({ 
        success: false, 
        error: 'Twilio Verify not configured' 
      });
      return callback(null, response);
    }

    const client = context.getTwilioClient();

    // Check OTP verification code
    const verificationCheck = await client.verify.v2
      .services(verifySid)
      .verificationChecks.create({ to: phoneNumber, code });

    const valid = verificationCheck.status === 'approved';

    console.log('✅ Verification check:', verificationCheck.status);

    response.setBody({
      success: valid,
      status: verificationCheck.status,
      valid,
    });
    
    return callback(null, response);
  } catch (error) {
    console.error('Verify check error:', error);
    
    response.setStatusCode(400);
    response.setBody({
      success: false,
      status: 'failed',
      valid: false,
      error: 'Invalid verification code',
    });
    
    return callback(null, response);
  }
};
```

Save to: `twilio/functions/notifications-verify-check.js`

- [ ] **Step 2: Verify file created**

```bash
test -f twilio/functions/notifications-verify-check.js && echo "✓ notifications-verify-check.js created" || echo "✗ File missing"
grep "exports.handler" twilio/functions/notifications-verify-check.js
```

Expected: File exists and contains exports.handler

- [ ] **Step 3: Commit**

```bash
git add twilio/functions/notifications-verify-check.js
git commit -m "feat: add Verify check Function endpoint

Convert Next.js /api/notifications/verify-check to Twilio Function.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 11: Create Lookup Function

**Files:**
- Create: `twilio/functions/notifications-lookup.js`

- [ ] **Step 1: Create notifications-lookup.js Function**

```javascript
// twilio/functions/notifications-lookup.js

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
    // Parse request body
    const body = typeof event.request === 'string' 
      ? JSON.parse(event.request) 
      : event;
    
    const { phoneNumber } = body;

    if (!phoneNumber) {
      response.setStatusCode(400);
      response.setBody({ 
        success: false, 
        error: 'Missing phoneNumber' 
      });
      return callback(null, response);
    }

    const client = context.getTwilioClient();

    // Lookup phone number with line type intelligence
    const lookup = await client.lookups.v2
      .phoneNumbers(phoneNumber)
      .fetch({ fields: 'line_type_intelligence' });

    const lineType = lookup.lineTypeIntelligence?.type || 'unknown';
    const isMobile = lineType === 'mobile';

    console.log('✅ Lookup success:', phoneNumber, lineType);

    response.setBody({
      success: true,
      valid: true,
      isMobile,
      carrier: lookup.lineTypeIntelligence?.carrierName,
      lineType,
    });
    
    return callback(null, response);
  } catch (error) {
    console.error('Lookup error:', error);
    
    response.setStatusCode(400);
    response.setBody({
      success: false,
      valid: false,
      isMobile: false,
      error: 'Invalid phone number',
    });
    
    return callback(null, response);
  }
};
```

Save to: `twilio/functions/notifications-lookup.js`

- [ ] **Step 2: Verify file created**

```bash
test -f twilio/functions/notifications-lookup.js && echo "✓ notifications-lookup.js created" || echo "✗ File missing"
grep "exports.handler" twilio/functions/notifications-lookup.js
```

Expected: File exists and contains exports.handler

- [ ] **Step 3: Commit**

```bash
git add twilio/functions/notifications-lookup.js
git commit -m "feat: add Lookup Function endpoint

Convert Next.js /api/notifications/lookup to Twilio Function.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 12: Update Frontend to Use API Base URL

**Files:**
- Modify: `hooks/useCrimeData.ts`

- [ ] **Step 1: Read current useCrimeData.ts**

```bash
cat hooks/useCrimeData.ts
```

- [ ] **Step 2: Update fetch URL to use environment variable**

Find the line:
```typescript
const response = await fetch(`/api/crimes?limit=${limit}&days=${daysBack}`);
```

Replace with:
```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';
const response = await fetch(`${API_BASE}/crimes?limit=${limit}&days=${daysBack}`);
```

The complete fetchData function should look like:

```typescript
const fetchData = async () => {
  try {
    const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';
    console.log('🔵 Starting fetch...', `${API_BASE}/crimes?limit=${limit}&days=${daysBack}`);
    setIsLoading(true);
    const response = await fetch(`${API_BASE}/crimes?limit=${limit}&days=${daysBack}`);
    
    // ... rest of function stays the same
  }
};
```

- [ ] **Step 3: Verify change**

```bash
grep "NEXT_PUBLIC_API_BASE_URL" hooks/useCrimeData.ts
```

Expected: Line contains API_BASE environment variable

- [ ] **Step 4: Commit**

```bash
git add hooks/useCrimeData.ts
git commit -m "feat: use API_BASE_URL env variable for crime data

Allow configuring API endpoint via NEXT_PUBLIC_API_BASE_URL for Twilio deployment.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 13: Check and Update Notification Components

**Files:**
- Check: `components/notifications/SmsNotificationDialog.tsx`

- [ ] **Step 1: Check if SMS notification components hardcode API URLs**

```bash
grep -n "/api/notifications" components/notifications/*.tsx
```

- [ ] **Step 2: If hardcoded URLs found, update them**

If you see hardcoded `/api/notifications/` URLs, replace them with:

```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';
// Then use: `${API_BASE}/notifications-send-sms` instead of `/api/notifications/send-sms`
```

Note: The Twilio Function names use hyphens not slashes:
- `/api/notifications/send-sms` → `/notifications-send-sms`
- `/api/notifications/verify-send` → `/notifications-verify-send`
- `/api/notifications/verify-check` → `/notifications-verify-check`
- `/api/notifications/lookup` → `/notifications-lookup`

- [ ] **Step 3: If changes made, commit them**

If files were updated:
```bash
git add components/notifications/*.tsx
git commit -m "feat: use API_BASE_URL for notification endpoints

Update notification API calls to use configurable base URL.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

If no changes needed:
```bash
echo "✓ No hardcoded URLs found, components already use relative paths"
```

---

## Task 14: Create Build and Deploy Script

**Files:**
- Create: `scripts/build-and-deploy.sh`

- [ ] **Step 1: Create scripts directory**

```bash
mkdir -p scripts
```

- [ ] **Step 2: Create build-and-deploy.sh**

```bash
cat > scripts/build-and-deploy.sh << 'EOF'
#!/bin/bash
set -e

echo "🏗️  Building Next.js static export..."

# Build Next.js with Twilio Functions URL
# Note: Set NEXT_PUBLIC_API_BASE_URL before running this script
npm run build

echo "📦 Copying static files to Twilio Assets..."
rm -rf twilio/assets/*
cp -r out/* twilio/assets/

echo "🔍 Verifying assets copied..."
if [ ! -f "twilio/assets/index.html" ]; then
  echo "❌ Error: index.html not found in twilio/assets/"
  exit 1
fi

echo "✅ Assets copied successfully"
echo ""
echo "🚀 Deploying to Twilio Serverless..."
cd twilio
twilio serverless:deploy --override-existing-project

echo ""
echo "✅ Deployment complete!"
echo "🌐 Your dashboard should be live at the URL shown above"
echo ""
echo "Next steps:"
echo "1. Visit the URL to test the dashboard"
echo "2. Check browser console for errors"
echo "3. Test crime data loading"
echo "4. Test SMS notification flow"
EOF
```

- [ ] **Step 3: Make script executable**

```bash
chmod +x scripts/build-and-deploy.sh
```

- [ ] **Step 4: Verify script created**

```bash
test -x scripts/build-and-deploy.sh && echo "✓ Script created and executable" || echo "✗ Script not executable"
cat scripts/build-and-deploy.sh | head -10
```

Expected: Script exists and is executable

- [ ] **Step 5: Commit**

```bash
git add scripts/build-and-deploy.sh
git commit -m "feat: add build and deploy script for Twilio

Single command to build Next.js and deploy to Twilio Serverless.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 15: Setup Twilio CLI and Deploy

**Files:**
- Modify: `twilio/.env`

- [ ] **Step 1: Check if Twilio CLI is installed**

```bash
twilio --version
```

Expected: Version number displayed (e.g., "twilio-cli/5.x.x")

If not installed:
```bash
npm install -g twilio-cli
```

- [ ] **Step 2: Install Serverless plugin**

```bash
twilio plugins:install @twilio-labs/plugin-serverless
```

Expected: Plugin installed successfully

- [ ] **Step 3: Login to Twilio**

```bash
twilio login
```

Follow prompts to enter Account SID and Auth Token.

Expected: "Saved credentials" message

- [ ] **Step 4: Update twilio/.env with required variables**

Edit `twilio/.env` and add your values:

```bash
# Auto-populated by Twilio CLI (check with: twilio profiles:list)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here

# Must set manually (from Twilio Console)
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_VERIFY_SERVICE_SID=VAxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Get these values from:
- Phone Number: Twilio Console → Phone Numbers → Your toll-free number
- Verify Service SID: Twilio Console → Verify → Services → Your service

- [ ] **Step 5: Set NEXT_PUBLIC_API_BASE_URL for build**

The API base URL will be shown after first deployment. For now, use a placeholder:

```bash
export NEXT_PUBLIC_API_BASE_URL=placeholder
```

Note: After first deploy, you'll get the real URL and can update .env.local

- [ ] **Step 6: Run deployment**

```bash
./scripts/build-and-deploy.sh
```

Expected output:
- Next.js build completes
- Files copied to twilio/assets/
- Twilio deployment succeeds
- URL displayed: `https://osint-dashboard-xxxx-dev.twil.io`

- [ ] **Step 7: Update NEXT_PUBLIC_API_BASE_URL with real URL**

After deployment, copy the URL from output (without trailing slash):

```bash
# Add to .env.local
echo "NEXT_PUBLIC_API_BASE_URL=https://osint-dashboard-xxxx-dev.twil.io" >> .env.local
```

- [ ] **Step 8: Rebuild and redeploy with correct URL**

```bash
export NEXT_PUBLIC_API_BASE_URL=https://osint-dashboard-xxxx-dev.twil.io
./scripts/build-and-deploy.sh
```

Expected: Deployment succeeds with frontend now pointing to correct API

- [ ] **Step 9: No commit needed (environment variables are not committed)**

---

## Task 16: Test Deployment

**Files:**
- None (manual testing)

- [ ] **Step 1: Open deployed dashboard**

Visit the URL from deployment output:

```bash
open https://osint-dashboard-xxxx-dev.twil.io
```

Expected: Dashboard loads in browser

- [ ] **Step 2: Check browser console for errors**

Open browser DevTools (F12 or Cmd+Option+I):
- Console tab should have no red errors
- Network tab should show successful requests

- [ ] **Step 3: Verify map loads**

Check:
- [ ] Map displays Chicago centered
- [ ] Crime markers appear with colors (red, orange, yellow, blue, gray)
- [ ] Map is interactive (pan/zoom works)

- [ ] **Step 4: Test filters**

Click severity filters (S1-S5):
- [ ] Map markers update
- [ ] Recent crimes list filters
- [ ] Count updates in stats card

- [ ] **Step 5: Test crime data fetch**

Open Network tab in DevTools:
- [ ] See request to `/crimes?limit=1000&days=30`
- [ ] Response status 200
- [ ] Response contains crime data array
- [ ] Data includes severity, color, coordinates

- [ ] **Step 6: Test SMS notification flow**

Click "Get SMS Alert" button:
- [ ] Dialog opens
- [ ] Enter phone number (your mobile)
- [ ] Phone validation succeeds
- [ ] OTP code sent
- [ ] Enter verification code
- [ ] Verification succeeds
- [ ] SMS sends
- [ ] Receive SMS on phone with crime summary

- [ ] **Step 7: Check Twilio Console logs**

Visit Twilio Console → Functions → Your Service → Logs:
- [ ] See Function executions
- [ ] No error messages
- [ ] Successful API calls logged

- [ ] **Step 8: Document deployment URL**

Create a note with your deployment URL for future reference:

```bash
echo "https://osint-dashboard-xxxx-dev.twil.io" > DEPLOYMENT_URL.txt
git add DEPLOYMENT_URL.txt
git commit -m "docs: add deployment URL

Twilio Serverless deployment URL for testing.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 17: Verify Original Next.js Still Works

**Files:**
- None (verification test)

- [ ] **Step 1: Unset API_BASE_URL**

```bash
unset NEXT_PUBLIC_API_BASE_URL
```

- [ ] **Step 2: Start Next.js dev server**

```bash
npm run dev
```

Expected: Server starts on http://localhost:3000

- [ ] **Step 3: Visit localhost dashboard**

```bash
open http://localhost:3000
```

- [ ] **Step 4: Verify local API routes work**

Check Network tab - should call:
- `/api/crimes` (not the Twilio URL)
- Local API routes should respond

Expected: Dashboard fully functional with local API routes

- [ ] **Step 5: Stop dev server**

```bash
# Press Ctrl+C in terminal
```

- [ ] **Step 6: Confirm parallel structure success**

Verify both deployments work:
- ✅ Twilio Serverless (production): `https://osint-dashboard-xxxx-dev.twil.io`
- ✅ Local Next.js (development): `http://localhost:3000`

---

## Spec Coverage Self-Review

Checking implementation against design spec:

**✅ Project Structure:** Tasks 1-2 create twilio/ directory with Functions, Assets, package.json

**✅ API Routes Conversion:** Tasks 7-11 convert all 5 API routes to Functions with CORS

**✅ Shared Utilities:** Tasks 3-6 copy and convert all 4 shared utilities to JavaScript

**✅ Frontend Static Export:** Task 1 configures Next.js for static export

**✅ API URL Updates:** Tasks 12-13 update frontend to use NEXT_PUBLIC_API_BASE_URL

**✅ Build and Deployment:** Task 14 creates build-and-deploy.sh script

**✅ Environment Variables:** Task 15 configures both Next.js and Twilio .env files

**✅ Testing:** Task 16 tests all critical paths from spec (homepage, data fetch, filters, SMS)

**✅ Parallel Structure Verification:** Task 17 confirms original Next.js still works

**No gaps found.** All spec requirements covered.

---

## Post-Deployment Checklist

After successful deployment, verify:

- [ ] Dashboard loads at Twilio URL
- [ ] Map displays crime markers
- [ ] Filters work correctly
- [ ] SMS notification flow completes
- [ ] Auto-refresh works (wait 5 minutes)
- [ ] Original Next.js dev server still works
- [ ] No console errors in production
- [ ] Functions logs show no errors

If any test fails, check:
1. Twilio Console → Functions → Logs for errors
2. Browser console for frontend errors
3. Environment variables in Twilio Console → Functions → Configuration
4. twilio/.env has correct values

Common issues:
- **Map doesn't load:** Check NEXT_PUBLIC_MAPBOX_TOKEN in .env.local before build
- **API calls fail:** Check NEXT_PUBLIC_API_BASE_URL matches deployed URL
- **SMS fails:** Check TWILIO_PHONE_NUMBER and TWILIO_VERIFY_SERVICE_SID in twilio/.env
- **Functions error:** Check Functions logs for missing dependencies or import errors
