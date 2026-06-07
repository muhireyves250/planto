# Farmer-Formal Dashboard Design

**Date:** 2026-06-07
**Status:** Approved

## Overview

Redesign the home dashboard (`/` route in App.jsx) to present real, actionable farming data instead of generic placeholder content. Every element should tell the farmer something useful about their land today.

---

## Section 1 — Banner & Greeting

**Replace** the static "Ready to plant?" banner with a personalised context header.

- Greeting changes by time of day: "Good morning", "Good afternoon", "Good evening"
- Include the farmer's `full_name` from the `user` object
- Subtitle is conditional:
  - If `cropsCount === 0`: "Start by running a soil test to find the best crop for your land."
  - If `cropsCount > 0`: "You have {cropsCount} crop{s} growing. Here's your farm overview for today."
- Today's date stays visible (already in the header bar above, so banner subtitle is enough)

**File:** `frontend/src/App.jsx` — the `<Route path="/">` dashboard JSX

---

## Section 2 — Stats Strip (real data)

| Card | Label | Value source |
|---|---|---|
| My Farms | My Farms | `farmsCount` — already real |
| Crops Planted | Crops Planted | `cropsCount` — already real |
| Active Alerts | Warnings → rename **Active Alerts** | `alerts.length` — already real |
| Soil Health | Soil Health | **New:** fetch latest `health_score` from user's most recently monitored crop via existing `getMyCrops` data already loaded in `fetchDashboardStats`. Show `XX/100` or `No Data` |

**Implementation note:** `fetchDashboardStats` already calls `getMyCrops`. Extend it to also compute `latestHealthScore` by finding the crop with the most recent `health_history` entry and reading its `health_score`. Store in a new `latestHealthScore` state variable (`null` if no data).

**File:** `frontend/src/App.jsx` — `fetchDashboardStats` function + stats strip JSX

---

## Section 3 — Dashboard Cards (right column)

Replace the generic "Things You Can Do" and "My Land Map" right-column cards with two real-data cards.

### Card A — Active Crops Summary

Replaces the "Things You Can Do" dark card.

- Title: **"Active Crops"** with a Sprout icon
- Renders a compact row per planted crop (from `cropsCount`/`getMyCrops` data):
  - Crop name (capitalised)
  - Days growing (calculated from `planting_date`)
  - Last soil test date (from `monitoring_data[0].recorded_at`, or "Not tested yet")
  - Health badge: colour-coded circle — green (≥80), amber (60–79), red (<60), grey (no data)
- If no crops: show a single CTA button "Run Your First Soil Test" → navigates to `/soil-test`
- Max 4 rows; if more crops exist show "View all in Monitoring →"

**New component:** `frontend/src/components/dashboard/ActiveCropsSummary.jsx`
Receives `crops` prop (array from `getMyCrops`).

### Card B — Today's Farm Actions

Replaces the land map card.

- Title: **"Today on Your Farm"** with a CheckCircle icon
- Derives action items from existing data:
  1. **Overdue soil retest** — if any crop's last `monitoring_data` entry is > 14 days ago → "Retest soil for [crop name]" → `/soil-test`
  2. **Pending fertilizer** — if any crop's latest `fertilizer_plans` has `fertilizer_type !== 'None'` and `quantity_kg > 0` → "Apply [type] to [crop name]" → `/monitoring`
  3. **Active alerts** — if `alerts.length > 0` → "Review {N} active farm alerts" → stays on page, scrolls to alerts
  4. **Fallback** — if no actions: "All farm tasks are up to date ✓" (green state)
- Each action row: icon + text + right-arrow button

**New component:** `frontend/src/components/dashboard/TodayActions.jsx`
Receives `crops` (array) and `alerts` (array) props.

---

## Section 4 — Weather Card Auto-Fetch

**Change:** Auto-fetch weather on dashboard load using the first farm's `location_lat`/`location_lng` instead of requiring a manual "Find My Weather" click.

- In `fetchDashboardStats`, if `farmsData[0]?.location_lat` exists, call `weatherApi.getWeather(lat, lng)` and set `weatherData`
- Fall back to existing manual "Find My Weather" button if no farm location is saved
- Add a small "Updated just now" / "Updated X min ago" timestamp below the weather card using a `weatherFetchedAt` state variable
- Add a contextual line below temperature: "Good conditions for field work" / "Heavy rain — avoid fertilising" based on `weatherData.condition` and `weatherData.rainfall`

**File:** `frontend/src/App.jsx` — `fetchDashboardStats` + weather card JSX

---

## Data Flow

```
fetchDashboardStats() runs on mount and every 30s
  → Promise.all([getFarms(), getMyCrops()])
  → from farmsData: farmsCount, auto-fetch weather if lat/lng present
  → from cropsData: cropsCount, latestHealthScore, crops array for cards
  → alerts fetched separately by fetchAlerts()

ActiveCropsSummary receives: crops[]
TodayActions receives: crops[], alerts[]
```

---

## What Does NOT Change

- Alerts card (left column) — already shows real data, keep as-is
- Weather card layout — keep visual design, only add auto-fetch + timestamp + context line
- Routing, navigation, sidebar — untouched
- All other pages (Monitoring, Soil Test, Reports, Settings) — untouched
