# Email Reports & Reminders — Design Spec

**Date:** 2026-06-16
**Status:** Approved

---

## Goal

Send two types of proactive emails:

1. **Weekly farm report** — every Monday at 8 AM, each farmer gets a personal digest of their farm health, upcoming harvests, fertilizer plans, and a soil-test reminder if overdue. Their agronomist (if any) gets a portfolio-level digest of all managed farms.
2. **On-demand report** — a "Send Report to My Inbox" button on the Reports page triggers the same farmer report immediately.

Existing SMTP config (`SMTP_USER`, `SMTP_PASSWORD`, `SMTP_HOST`, `SMTP_PORT`) and `email_service.py` are reused. No new infrastructure required.

---

## Architecture

### New files

| Path | Responsibility |
|------|---------------|
| `backend/app/services/report_service.py` | Queries DB, builds report payload, orchestrates sends |
| `backend/app/templates/email/weekly_report.html` | Jinja2 HTML template — farmer weekly report |
| `backend/app/templates/email/agronomist_digest.html` | Jinja2 HTML template — agronomist portfolio digest |
| `backend/app/routes/report.py` | `POST /reports/send-email` — on-demand endpoint |

### Modified files

| Path | Change |
|------|--------|
| `backend/app/main.py` | Start `AsyncIOScheduler` in `startup_event()`; register Monday-8am cron job |
| `backend/requirements.txt` | Add `apscheduler` |
| `frontend/src/Reports.jsx` | Add "Send Report to My Inbox" button; show toast on success/failure |

---

## Report Content

### Farmer weekly email

**Subject:** `Your Weekly Farm Report — June 16, 2026`

Sections (in order):

1. **Crop Health Summary** — table of all active crops with latest health score from `CropHealthHistory`. Color-coded badge: green ≥70%, amber ≥40%, red <40%. Falls back to "No active crops this week" if none exist.
2. **Upcoming Harvests** — crops where `PlantedCrop.expected_harvest_date` is within the next 30 days, sorted by soonest first. Omitted if none are approaching.
3. **Fertilizer Plan** — latest `FertilizerPlan` per crop: urea/DAP/NPK kg amounts and nutrient target. Omitted if no plans exist.
4. **Soil Test Reminder** — shown only if the farmer's most recent `SoilMonitoring` record is older than 14 days. Includes the date of their last test and a CTA link to `/soil-test`.

### Agronomist weekly digest

**Subject:** `Your Farm Portfolio Digest — June 16, 2026`

One row per managed farm:
- Farm name + farmer name
- Number of active crops
- Average health score across all active crops
- Critical alert flag: `⚠️ Critical alerts this week` if any `Alert(type="critical")` was created in the past 7 days for that farm's users

Omitted entirely if the agronomist has no managed farms.

---

## Data Flow

### Weekly scheduled send (Monday 8 AM)

```
startup_event()
  └── AsyncIOScheduler.start()
        └── cron(day_of_week='mon', hour=8)
              └── report_service.send_all_weekly_reports(db)
                    ├── query all farmers with at least one farm
                    │     └── for each: build_farmer_report(user, db) → send
                    └── query all agronomists with managed farms
                          └── for each: build_agronomist_digest(user, db) → send
```

`send_all_weekly_reports` opens its own DB session (not the request-scoped one) using `SessionLocal()` directly, closes it in a `finally` block.

### On-demand send

```
POST /reports/send-email
  └── get_current_user (farmer only; agronomist returns 403)
        └── report_service.build_farmer_report(user, db)
              └── email_service.send_report_email(to=user.email, ...)
                    └── returns {"success": True}
```

Frontend shows a success toast on 200, error toast on failure.

---

## Scheduling

- Scheduler: `apscheduler.schedulers.asyncio.AsyncIOScheduler`
- Trigger: `CronTrigger(day_of_week='mon', hour=8, timezone='UTC')`
- Started in `startup_event()` alongside `start_mqtt_client()`
- No persistent job store — cron is deterministic, missed sends on restart are acceptable
- Scheduler is shut down in a `shutdown` event handler to avoid thread leaks

---

## Error Handling

| Scenario | Behaviour |
|----------|-----------|
| SMTP failure for one farmer | Log warning, continue to next farmer |
| Farmer has no active crops | Email sends with "No active crops this week" message |
| Agronomist has no managed farms | Skip send entirely |
| `User.email` is null | Skip that user silently |
| Server down at Monday 8am | Miss that week's send — no make-up |
| On-demand while weekly batch runs | Independent DB reads, no conflict |
| `send_report_email` timeout | Inherits `timeout=15` from `aiosmtplib.send()` |

---

## Email Templates

Both templates extend the visual style of the existing `alert.html`:
- Dark green header (`#1e362a`) with Planto branding
- Clean white card body with section dividers
- Mobile-responsive single-column layout
- CTA button linking into the app (`/dashboard`, `/soil-test`, `/monitoring`)

`weekly_report.html` uses Jinja2 loops over `crops`, `harvests`, `plans`, and a conditional `show_reminder` boolean.
`agronomist_digest.html` uses a Jinja2 loop over `farms` list.

---

## Frontend

**Reports.jsx** — add alongside the existing "Export Dataset" button:

```
[ Export Dataset ]  [ Send Report to My Inbox ]
```

- Button disabled while request is in-flight (shows spinner)
- Success: green toast "Report sent to your inbox!"
- Error: red toast "Could not send report — try again"
- Only visible to farmers (hidden for agronomist role)

---

## Out of Scope

- PDF generation
- Configurable send day/time per user
- Email unsubscribe flow
- Report scheduling per-farm (all farms bundled in one email)
- Push notification equivalent of the report
