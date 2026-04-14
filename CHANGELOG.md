# Changelog

All notable changes to the Chicago OSINT Dashboard will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Planned
- Dynamic crime counts based on map viewport
- Map screenshot MMS notifications
- Repositioned zip code input

## [2.0.0] - 2026-04-14

### Added
- **SMS Crime Notifications**: Text yourself crime summaries via Twilio
  - Phone validation with Twilio Lookup (detects landlines vs mobile)
  - OTP verification via Twilio Verify
  - Multi-step dialog with progressive UI
  - Crime summary limited to top 50 by severity
  - Formatted SMS with severity breakdown and top crime types
  - Error handling for invalid phones, OTP failures, network errors
- **Zip Code Search**: Quick neighborhood zoom functionality
  - Input box overlaid on map (top-right corner)
  - Geocoding via Mapbox API
  - Chicago boundary validation
  - Zoom to level 13 with smooth animation

### Technical
- 4 new Twilio API routes (lookup, verify-send, verify-check, send-sms)
- Custom `useSmsNotification` hook for state management
- Phone formatting and validation utilities
- Crime summary formatter for SMS text
- Secure server-side Twilio credential storage

### Commits
- `7e1adac` - feat: Add SMS crime notification system with Twilio integration

## [1.0.0] - 2026-04-08

### Added
- **Core Dashboard Features**:
  - Real-time crime map visualization using Mapbox GL
  - Crime severity classification (S1-S5)
  - Filter panel for severity and crime type selection
  - Recent crimes list with scrollable view
  - Live statistics card showing crime counts
  - Auto-refresh every 5 minutes via SWR
- **Data Pipeline**:
  - Chicago Data Portal API integration
  - Server-side caching (5-minute revalidation)
  - Crime data enrichment with severity and colors
- **UI/UX**:
  - Dark theme with cinematic styling
  - Interactive crime markers with popups
  - Responsive layout
  - Zustand state management for filters

### Technical
- Next.js 14+ with App Router
- TypeScript for type safety
- Mapbox GL JS for mapping
- SWR for data fetching
- shadcn/ui components

### Commits
- `7469134` - Build Chicago OSINT crime monitoring dashboard with real-time map visualization
- `79110bd` - feat: initial commit
- `ebee614` - Initial commit from Create Next App

---

## Version History Legend

### Version Numbering
- **Major (X.0.0)**: Breaking changes or significant new features
- **Minor (x.X.0)**: New features, backward compatible
- **Patch (x.x.X)**: Bug fixes, minor improvements

### Commit Tags
To checkout a specific version:
```bash
git log --oneline  # Find the commit hash
git checkout <commit-hash>
```

### Fallback Instructions
If you need to revert to a previous version:

```bash
# See all commits
git log --oneline --decorate

# Revert to v2.0.0 (SMS notifications)
git checkout 7e1adac

# Revert to v1.0.0 (basic dashboard)
git checkout 7469134

# Return to latest
git checkout main
```

---

## Feature Roadmap

### Phase 3 (Current)
- [ ] Dynamic crime counts based on viewport
- [ ] Map screenshot MMS with crime summary
- [ ] Repositioned UI elements

### Phase 4 (Future)
- [ ] Deploy to Vercel
- [ ] Supabase database integration
- [ ] Persistent phone number storage (opt-in)
- [ ] Emergency vehicle layer (police, fire, ambulance)
- [ ] VIP location tracking

### Phase 5 (Long-term)
- [ ] Scheduled recurring SMS alerts
- [ ] Custom alert zones (geofences)
- [ ] Historical crime data trends
- [ ] Crime heatmaps
- [ ] Multi-city support
