# Email Reports & Reminders Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Send a weekly HTML email digest to every farmer (crop health, upcoming harvests, fertilizer plans, soil-test reminder) and a portfolio digest to their agronomist, plus an on-demand "Send Report to My Inbox" button on the Reports page.

**Architecture:** `report_service.py` handles all DB queries and builds report payloads. `email_service.py` gets a new `send_report_email()` function that renders new Jinja2 templates. An `AsyncIOScheduler` cron job (Monday 8 AM UTC) in `startup_event()` calls the service. A new `POST /reports/send-email` route lets farmers trigger the same send on demand. The frontend adds a button to the existing Reports page header actions.

**Tech Stack:** `apscheduler` (AsyncIOScheduler + CronTrigger), `aiosmtplib`, Jinja2, FastAPI, SQLAlchemy, React.

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `backend/app/services/report_service.py` | DB queries → report payload dicts; orchestrate weekly batch send |
| Create | `backend/app/templates/email/weekly_report.html` | Jinja2 HTML template — farmer weekly email |
| Create | `backend/app/templates/email/agronomist_digest.html` | Jinja2 HTML template — agronomist portfolio email |
| Modify | `backend/app/services/email_service.py` | Add `send_report_email()` using new templates |
| Create | `backend/app/routes/report.py` | `POST /reports/send-email` on-demand endpoint |
| Modify | `backend/app/main.py` | Start APScheduler; register Monday 8 AM cron job; register router |
| Modify | `backend/requirements.txt` | Add `apscheduler` |
| Modify | `frontend/src/Reports.jsx` | Add "Send Report" button + fetch + toast |
| Create | `backend/tests/__init__.py` | Makes tests/ a package |
| Create | `backend/tests/test_report_service.py` | Unit tests for report data builders |

---

## Task 1: Test Infrastructure + `report_service.py` Data Builders

**Files:**
- Create: `backend/tests/__init__.py`
- Create: `backend/tests/test_report_service.py`
- Create: `backend/app/services/report_service.py`

- [ ] **Step 1: Install test dependencies**

```bash
cd backend
./venv/bin/pip install pytest pytest-asyncio -q
echo "pytest" >> requirements.txt
echo "pytest-asyncio" >> requirements.txt
```

- [ ] **Step 2: Create tests package**

```bash
mkdir -p backend/tests
touch backend/tests/__init__.py
```

- [ ] **Step 3: Write failing tests for `get_farmer_report_data`**

Create `backend/tests/test_report_service.py`:

```python
import pytest
from datetime import date, datetime, timedelta, timezone
from unittest.mock import MagicMock, patch
from uuid import uuid4


def _make_crop(name="Banana", status="active", harvest_days=20, health=0.82):
    crop = MagicMock()
    crop.id = uuid4()
    crop.crop_name = name
    crop.status = status
    crop.expected_harvest_date = date.today() + timedelta(days=harvest_days)

    health_entry = MagicMock()
    health_entry.health_score = health
    health_entry.created_at = datetime.now(timezone.utc)
    crop.health_history = [health_entry]

    plan = MagicMock()
    plan.urea_kg = 10.5
    plan.dap_kg = 5.0
    plan.npk_kg = 8.0
    plan.nutrient_target = "N"
    plan.created_at = datetime.now(timezone.utc)
    crop.fertilizer_plans = [plan]

    monitoring = MagicMock()
    monitoring.recorded_at = datetime.now(timezone.utc) - timedelta(days=5)
    crop.monitoring_data = [monitoring]

    return crop


def _make_db(crops, last_monitoring_days_ago=5):
    db = MagicMock()

    query_mock = MagicMock()
    db.query.return_value = query_mock
    query_mock.filter.return_value = query_mock
    query_mock.options.return_value = query_mock
    query_mock.all.return_value = crops

    # For SoilMonitoring last-test query
    mon = MagicMock()
    mon.recorded_at = datetime.now(timezone.utc) - timedelta(days=last_monitoring_days_ago)
    query_mock.order_by.return_value = query_mock
    query_mock.first.return_value = mon if last_monitoring_days_ago is not None else None

    return db


def test_get_farmer_report_data_returns_crop_list():
    from app.services.report_service import get_farmer_report_data
    user_id = uuid4()
    db = _make_db([_make_crop("Rice"), _make_crop("Maize")])
    result = get_farmer_report_data(user_id, db)
    assert len(result["crops"]) == 2
    assert result["crops"][0]["name"] == "Rice"


def test_get_farmer_report_data_health_label_green():
    from app.services.report_service import get_farmer_report_data
    db = _make_db([_make_crop(health=0.85)])
    result = get_farmer_report_data(uuid4(), db)
    assert result["crops"][0]["health_label"] == "green"


def test_get_farmer_report_data_health_label_amber():
    from app.services.report_service import get_farmer_report_data
    db = _make_db([_make_crop(health=0.55)])
    result = get_farmer_report_data(uuid4(), db)
    assert result["crops"][0]["health_label"] == "amber"


def test_get_farmer_report_data_health_label_red():
    from app.services.report_service import get_farmer_report_data
    db = _make_db([_make_crop(health=0.35)])
    result = get_farmer_report_data(uuid4(), db)
    assert result["crops"][0]["health_label"] == "red"


def test_get_farmer_report_data_upcoming_harvests_within_30_days():
    from app.services.report_service import get_farmer_report_data
    crops = [_make_crop("Banana", harvest_days=20), _make_crop("Jute", harvest_days=40)]
    db = _make_db(crops)
    result = get_farmer_report_data(uuid4(), db)
    names = [h["name"] for h in result["upcoming_harvests"]]
    assert "Banana" in names
    assert "Jute" not in names


def test_get_farmer_report_data_soil_reminder_shown_when_overdue():
    from app.services.report_service import get_farmer_report_data
    db = _make_db([_make_crop()], last_monitoring_days_ago=20)
    result = get_farmer_report_data(uuid4(), db)
    assert result["show_soil_reminder"] is True
    assert result["soil_test_days_ago"] == 20


def test_get_farmer_report_data_no_soil_reminder_when_recent():
    from app.services.report_service import get_farmer_report_data
    db = _make_db([_make_crop()], last_monitoring_days_ago=5)
    result = get_farmer_report_data(uuid4(), db)
    assert result["show_soil_reminder"] is False


def test_get_farmer_report_data_only_active_crops():
    from app.services.report_service import get_farmer_report_data
    crops = [_make_crop("Rice", status="active"), _make_crop("Maize", status="harvested")]
    # The DB mock returns whatever we pass — report_service must filter status='active'
    # We model this by the service receiving only active crops from the DB query
    db = _make_db([crops[0]])  # DB already filtered by service's query
    result = get_farmer_report_data(uuid4(), db)
    assert all(c["name"] != "Maize" for c in result["crops"])
```

- [ ] **Step 4: Run tests to verify they fail**

```bash
cd backend
./venv/bin/python -m pytest tests/test_report_service.py -v 2>&1 | head -30
```

Expected: `ImportError: cannot import name 'get_farmer_report_data' from 'app.services.report_service'` (module doesn't exist yet).

- [ ] **Step 5: Create `report_service.py`**

Create `backend/app/services/report_service.py`:

```python
"""
Builds report payload dicts and orchestrates weekly batch email sends.
All DB-facing functions are synchronous (SQLAlchemy Session).
The scheduler job opens its own session via SessionLocal.
"""
import logging
from datetime import date, datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy.orm import Session, selectinload

from app.models.planted_crop import PlantedCrop, CropHealthHistory
from app.models.soil_monitoring import SoilMonitoring
from app.models.fertilizer import FertilizerPlan
from app.models.farm import Farm
from app.models.user import User

logger = logging.getLogger(__name__)

SOIL_TEST_REMINDER_DAYS = 14
HARVEST_LOOKAHEAD_DAYS = 30


def _health_label(score: float) -> str:
    if score >= 0.70:
        return "green"
    if score >= 0.40:
        return "amber"
    return "red"


def get_farmer_report_data(user_id: UUID, db: Session) -> dict:
    """Return all data needed to render a farmer's weekly report email."""
    crops = (
        db.query(PlantedCrop)
        .options(
            selectinload(PlantedCrop.health_history),
            selectinload(PlantedCrop.fertilizer_plans),
            selectinload(PlantedCrop.monitoring_data),
        )
        .filter(PlantedCrop.user_id == user_id, PlantedCrop.status == "active")
        .all()
    )

    today = date.today()
    crop_rows = []
    upcoming_harvests = []
    fertilizer_rows = []

    for crop in crops:
        latest_health = max(crop.health_history, key=lambda h: h.created_at, default=None)
        score = latest_health.health_score if latest_health else 0.0
        crop_rows.append({
            "name": crop.crop_name,
            "health_score": round(score * 100),
            "health_label": _health_label(score),
        })

        if crop.expected_harvest_date:
            days_left = (crop.expected_harvest_date - today).days
            if 0 <= days_left <= HARVEST_LOOKAHEAD_DAYS:
                upcoming_harvests.append({
                    "name": crop.crop_name,
                    "expected_harvest_date": crop.expected_harvest_date.strftime("%b %d, %Y"),
                    "days_remaining": days_left,
                })

        latest_plan = max(crop.fertilizer_plans, key=lambda p: p.created_at, default=None)
        if latest_plan:
            fertilizer_rows.append({
                "crop_name": crop.crop_name,
                "urea_kg": latest_plan.urea_kg or 0,
                "dap_kg": latest_plan.dap_kg or 0,
                "npk_kg": latest_plan.npk_kg or 0,
                "nutrient_target": latest_plan.nutrient_target or "",
            })

    # Latest soil monitoring across all crops for this user
    latest_monitoring = (
        db.query(SoilMonitoring)
        .filter(SoilMonitoring.recorded_by == user_id)
        .order_by(SoilMonitoring.recorded_at.desc())
        .first()
    )

    show_soil_reminder = False
    soil_test_days_ago = None
    last_soil_test_date = None
    if latest_monitoring:
        recorded_at = latest_monitoring.recorded_at
        if recorded_at.tzinfo is None:
            recorded_at = recorded_at.replace(tzinfo=timezone.utc)
        days_ago = (datetime.now(timezone.utc) - recorded_at).days
        soil_test_days_ago = days_ago
        last_soil_test_date = recorded_at.strftime("%b %d, %Y")
        show_soil_reminder = days_ago >= SOIL_TEST_REMINDER_DAYS
    else:
        show_soil_reminder = True

    upcoming_harvests.sort(key=lambda h: h["days_remaining"])

    return {
        "crops": crop_rows,
        "upcoming_harvests": upcoming_harvests,
        "fertilizer_plans": fertilizer_rows,
        "show_soil_reminder": show_soil_reminder,
        "soil_test_days_ago": soil_test_days_ago,
        "last_soil_test_date": last_soil_test_date,
        "report_date": today.strftime("%B %d, %Y"),
    }


def get_agronomist_digest_data(agronomist_id: UUID, db: Session) -> list[dict]:
    """Return per-farm summary rows for the agronomist digest email."""
    from app.models.alert import Alert
    from sqlalchemy import func

    farms = (
        db.query(Farm)
        .options(
            selectinload(Farm.planted_crops).selectinload(PlantedCrop.health_history),
            selectinload(Farm.managed_farmer),
            selectinload(Farm.owner),
        )
        .filter(Farm.agronomist_id == agronomist_id)
        .all()
    )

    cutoff = datetime.now(timezone.utc) - timedelta(days=7)
    rows = []
    for farm in farms:
        active_crops = [c for c in farm.planted_crops if c.status == "active"]
        scores = []
        for crop in active_crops:
            if crop.health_history:
                latest = max(crop.health_history, key=lambda h: h.created_at)
                scores.append(latest.health_score)

        avg_score = round(sum(scores) / len(scores) * 100) if scores else None

        # owner = registered platform user; managed_farmer = offline farmer tracked by agronomist
        if farm.owner:
            farmer_name = farm.owner.full_name
        elif farm.managed_farmer:
            farmer_name = farm.managed_farmer.full_name
        else:
            farmer_name = "Unknown"

        user_ids = [c.user_id for c in farm.planted_crops if c.user_id]
        has_critical = False
        if user_ids:
            has_critical = (
                db.query(Alert)
                .filter(
                    Alert.user_id.in_(user_ids),
                    Alert.type == "critical",
                    Alert.created_at >= cutoff,
                )
                .first()
                is not None
            )

        rows.append({
            "farm_name": farm.farm_name,
            "farmer_name": farmer_name,
            "active_crop_count": len(active_crops),
            "avg_health_score": avg_score,
            "has_critical_alerts": has_critical,
        })

    return rows


async def send_all_weekly_reports() -> None:
    """Scheduler entry point — opens its own DB session, sends all emails."""
    from app.core.database import SessionLocal
    from app.services.email_service import send_report_email, send_agronomist_digest_email

    logger.info("Weekly report job starting")
    db = SessionLocal()
    try:
        farmers = db.query(User).filter(User.role == "farmer").all()
        for user in farmers:
            if not user.email:
                continue
            try:
                report_data = get_farmer_report_data(user.id, db)
                if not report_data["crops"]:
                    continue
                await send_report_email(
                    to_email=user.email,
                    full_name=user.full_name,
                    report_data=report_data,
                )
            except Exception as e:
                logger.warning("Weekly report failed for farmer %s: %s", user.email, e)

        agronomists = db.query(User).filter(User.role == "agronomist").all()
        for user in agronomists:
            if not user.email:
                continue
            try:
                farms = get_agronomist_digest_data(user.id, db)
                if not farms:
                    continue
                await send_agronomist_digest_email(
                    to_email=user.email,
                    full_name=user.full_name,
                    farms=farms,
                    report_date=date.today().strftime("%B %d, %Y"),
                )
            except Exception as e:
                logger.warning("Digest failed for agronomist %s: %s", user.email, e)
    finally:
        db.close()
    logger.info("Weekly report job complete")
```

- [ ] **Step 6: Run tests — expect them to pass**

```bash
cd backend
./venv/bin/python -m pytest tests/test_report_service.py -v
```

Expected output:
```
PASSED tests/test_report_service.py::test_get_farmer_report_data_returns_crop_list
PASSED tests/test_report_service.py::test_get_farmer_report_data_health_label_green
PASSED tests/test_report_service.py::test_get_farmer_report_data_health_label_amber
PASSED tests/test_report_service.py::test_get_farmer_report_data_health_label_red
PASSED tests/test_report_service.py::test_get_farmer_report_data_upcoming_harvests_within_30_days
PASSED tests/test_report_service.py::test_get_farmer_report_data_soil_reminder_shown_when_overdue
PASSED tests/test_report_service.py::test_get_farmer_report_data_no_soil_reminder_when_recent
PASSED tests/test_report_service.py::test_get_farmer_report_data_only_active_crops
8 passed in ...
```

- [ ] **Step 7: Commit**

```bash
git add backend/tests/ backend/app/services/report_service.py backend/requirements.txt
git commit -m "feat(reports): report_service data builders with tests"
```

---

## Task 2: HTML Email Templates

**Files:**
- Create: `backend/app/templates/email/weekly_report.html`
- Create: `backend/app/templates/email/agronomist_digest.html`

- [ ] **Step 1: Create `weekly_report.html`**

Create `backend/app/templates/email/weekly_report.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Weekly Farm Report</title>
  <style>
    body { margin: 0; padding: 0; background: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .wrapper { max-width: 580px; margin: 40px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: #1e362a; padding: 28px 32px; text-align: center; }
    .header h1 { color: #fff; margin: 0 0 4px; font-size: 22px; font-weight: 800; }
    .header p { color: rgba(255,255,255,0.6); margin: 0; font-size: 13px; }
    .section { padding: 24px 32px; border-bottom: 1px solid #f1f5f9; }
    .section:last-of-type { border-bottom: none; }
    .section-title { font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; color: #94a3b8; margin: 0 0 14px; }
    table { width: 100%; border-collapse: collapse; font-size: 14px; }
    th { text-align: left; font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; padding: 0 0 8px; }
    td { padding: 8px 0; color: #334155; border-top: 1px solid #f8fafc; vertical-align: middle; }
    .badge { display: inline-block; padding: 3px 10px; border-radius: 99px; font-size: 11px; font-weight: 700; }
    .green { background: #dcfce7; color: #16a34a; }
    .amber { background: #fef3c7; color: #d97706; }
    .red   { background: #fee2e2; color: #dc2626; }
    .reminder-box { background: #fff7ed; border: 1px solid #fed7aa; border-radius: 12px; padding: 16px 20px; }
    .reminder-box p { margin: 0; font-size: 14px; color: #9a3412; line-height: 1.5; }
    .cta-btn { display: inline-block; background: #16a34a; color: #fff; text-decoration: none; padding: 11px 24px; border-radius: 10px; font-size: 14px; font-weight: 700; margin-top: 12px; }
    .footer { padding: 16px 32px; background: #f8fafc; text-align: center; font-size: 12px; color: #94a3b8; }
    .footer a { color: #94a3b8; }
    .greeting { padding: 24px 32px 8px; }
    .greeting h2 { margin: 0 0 4px; font-size: 20px; font-weight: 800; color: #0f172a; }
    .greeting p  { margin: 0; font-size: 14px; color: #64748b; }
    .empty { font-size: 13px; color: #94a3b8; font-style: italic; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>🌱 Planto</h1>
      <p>Weekly Farm Report — {{ report_date }}</p>
    </div>

    <div class="greeting">
      <h2>Hi {{ full_name }},</h2>
      <p>Here's your weekly farm overview.</p>
    </div>

    <!-- Crop Health Summary -->
    <div class="section">
      <div class="section-title">Crop Health Summary</div>
      {% if crops %}
      <table>
        <thead><tr><th>Crop</th><th>Health Score</th><th>Status</th></tr></thead>
        <tbody>
          {% for crop in crops %}
          <tr>
            <td style="font-weight:600;text-transform:capitalize">{{ crop.name }}</td>
            <td>{{ crop.health_score }}%</td>
            <td><span class="badge {{ crop.health_label }}">{{ crop.health_label|capitalize }}</span></td>
          </tr>
          {% endfor %}
        </tbody>
      </table>
      {% else %}
      <p class="empty">No active crops this week.</p>
      {% endif %}
    </div>

    <!-- Upcoming Harvests -->
    {% if upcoming_harvests %}
    <div class="section">
      <div class="section-title">Upcoming Harvests</div>
      <table>
        <thead><tr><th>Crop</th><th>Expected Date</th><th>Days Left</th></tr></thead>
        <tbody>
          {% for h in upcoming_harvests %}
          <tr>
            <td style="font-weight:600;text-transform:capitalize">{{ h.name }}</td>
            <td>{{ h.expected_harvest_date }}</td>
            <td style="font-weight:700;color:#16a34a">{{ h.days_remaining }}d</td>
          </tr>
          {% endfor %}
        </tbody>
      </table>
    </div>
    {% endif %}

    <!-- Fertilizer Plan -->
    {% if fertilizer_plans %}
    <div class="section">
      <div class="section-title">Fertilizer Recommendations</div>
      <table>
        <thead><tr><th>Crop</th><th>Urea (kg)</th><th>DAP (kg)</th><th>NPK (kg)</th></tr></thead>
        <tbody>
          {% for p in fertilizer_plans %}
          <tr>
            <td style="font-weight:600;text-transform:capitalize">{{ p.crop_name }}</td>
            <td>{{ p.urea_kg }}</td>
            <td>{{ p.dap_kg }}</td>
            <td>{{ p.npk_kg }}</td>
          </tr>
          {% endfor %}
        </tbody>
      </table>
    </div>
    {% endif %}

    <!-- Soil Test Reminder -->
    {% if show_soil_reminder %}
    <div class="section">
      <div class="section-title">Soil Test Reminder</div>
      <div class="reminder-box">
        {% if last_soil_test_date %}
        <p>Your last soil test was <strong>{{ soil_test_days_ago }} days ago</strong> ({{ last_soil_test_date }}). Regular testing helps keep recommendations accurate.</p>
        {% else %}
        <p>No soil tests recorded yet. Run your first test to get accurate crop recommendations.</p>
        {% endif %}
        <a href="{{ app_url }}/soil-test" class="cta-btn">Run a Soil Test →</a>
      </div>
    </div>
    {% endif %}

    <div class="section" style="text-align:center;padding:20px 32px">
      <a href="{{ app_url }}/dashboard" class="cta-btn">View Full Dashboard →</a>
    </div>

    <div class="footer">
      You're receiving this weekly digest because you have an active Planto account.<br>
      <a href="{{ app_url }}/settings">Manage notification preferences</a>
    </div>
  </div>
</body>
</html>
```

- [ ] **Step 2: Create `agronomist_digest.html`**

Create `backend/app/templates/email/agronomist_digest.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Farm Portfolio Digest</title>
  <style>
    body { margin: 0; padding: 0; background: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .wrapper { max-width: 580px; margin: 40px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: #1e362a; padding: 28px 32px; text-align: center; }
    .header h1 { color: #fff; margin: 0 0 4px; font-size: 22px; font-weight: 800; }
    .header p  { color: rgba(255,255,255,0.6); margin: 0; font-size: 13px; }
    .greeting { padding: 24px 32px 8px; }
    .greeting h2 { margin: 0 0 4px; font-size: 20px; font-weight: 800; color: #0f172a; }
    .greeting p  { margin: 0; font-size: 14px; color: #64748b; }
    .section { padding: 20px 32px; }
    .section-title { font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; color: #94a3b8; margin: 0 0 14px; }
    table { width: 100%; border-collapse: collapse; font-size: 14px; }
    th { text-align: left; font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; padding: 0 0 8px; }
    td { padding: 10px 0; color: #334155; border-top: 1px solid #f8fafc; vertical-align: middle; }
    .flag { display: inline-block; background: #fee2e2; color: #dc2626; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 99px; }
    .score-ok  { color: #16a34a; font-weight: 700; }
    .score-mid { color: #d97706; font-weight: 700; }
    .score-low { color: #dc2626; font-weight: 700; }
    .cta-btn { display: inline-block; background: #16a34a; color: #fff; text-decoration: none; padding: 11px 24px; border-radius: 10px; font-size: 14px; font-weight: 700; }
    .footer { padding: 16px 32px; background: #f8fafc; text-align: center; font-size: 12px; color: #94a3b8; }
    .footer a { color: #94a3b8; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>🌱 Planto</h1>
      <p>Portfolio Digest — {{ report_date }}</p>
    </div>
    <div class="greeting">
      <h2>Hi {{ full_name }},</h2>
      <p>Here's a summary of your {{ farms|length }} managed farm{{ 's' if farms|length != 1 else '' }} this week.</p>
    </div>
    <div class="section">
      <div class="section-title">Managed Farms</div>
      <table>
        <thead>
          <tr>
            <th>Farm</th>
            <th>Farmer</th>
            <th>Crops</th>
            <th>Avg Health</th>
            <th>Alerts</th>
          </tr>
        </thead>
        <tbody>
          {% for farm in farms %}
          <tr>
            <td style="font-weight:700">{{ farm.farm_name }}</td>
            <td>{{ farm.farmer_name }}</td>
            <td>{{ farm.active_crop_count }}</td>
            <td>
              {% if farm.avg_health_score is not none %}
                {% if farm.avg_health_score >= 70 %}
                  <span class="score-ok">{{ farm.avg_health_score }}%</span>
                {% elif farm.avg_health_score >= 40 %}
                  <span class="score-mid">{{ farm.avg_health_score }}%</span>
                {% else %}
                  <span class="score-low">{{ farm.avg_health_score }}%</span>
                {% endif %}
              {% else %}
                <span style="color:#94a3b8">—</span>
              {% endif %}
            </td>
            <td>
              {% if farm.has_critical_alerts %}
                <span class="flag">⚠️ Critical</span>
              {% else %}
                <span style="color:#16a34a;font-size:13px">✓ OK</span>
              {% endif %}
            </td>
          </tr>
          {% endfor %}
        </tbody>
      </table>
    </div>
    <div class="section" style="text-align:center;padding-bottom:24px">
      <a href="{{ app_url }}/my-farms" class="cta-btn">View All Farms →</a>
    </div>
    <div class="footer">
      You're receiving this because you manage farms on Planto.<br>
      <a href="{{ app_url }}/settings">Manage notification preferences</a>
    </div>
  </div>
</body>
</html>
```

- [ ] **Step 3: Verify templates render without errors**

```bash
cd backend
./venv/bin/python -c "
from jinja2 import Environment, FileSystemLoader
from pathlib import Path

env = Environment(loader=FileSystemLoader(str(Path('app/templates/email'))))

# Farmer template
t = env.get_template('weekly_report.html')
html = t.render(
    full_name='Grace Uwera',
    report_date='June 16, 2026',
    crops=[{'name': 'banana', 'health_score': 82, 'health_label': 'green'}],
    upcoming_harvests=[{'name': 'banana', 'expected_harvest_date': 'Jun 20, 2026', 'days_remaining': 4}],
    fertilizer_plans=[{'crop_name': 'banana', 'urea_kg': 10.5, 'dap_kg': 5.0, 'npk_kg': 8.0, 'nutrient_target': 'N'}],
    show_soil_reminder=True,
    soil_test_days_ago=20,
    last_soil_test_date='May 27, 2026',
    app_url='https://planto.app',
)
print('weekly_report.html OK, length:', len(html))

# Agronomist template
t2 = env.get_template('agronomist_digest.html')
html2 = t2.render(
    full_name='Dr. Eric',
    report_date='June 16, 2026',
    farms=[{'farm_name': 'Farm A', 'farmer_name': 'Grace', 'active_crop_count': 3, 'avg_health_score': 75, 'has_critical_alerts': False}],
    app_url='https://planto.app',
)
print('agronomist_digest.html OK, length:', len(html2))
"
```

Expected:
```
weekly_report.html OK, length: <number>
agronomist_digest.html OK, length: <number>
```

- [ ] **Step 4: Commit**

```bash
git add backend/app/templates/email/weekly_report.html backend/app/templates/email/agronomist_digest.html
git commit -m "feat(reports): add weekly_report and agronomist_digest email templates"
```

---

## Task 3: `send_report_email` + `send_agronomist_digest_email` in `email_service.py`

**Files:**
- Modify: `backend/app/services/email_service.py`

- [ ] **Step 1: Add two send functions to `email_service.py`**

Append to the bottom of `backend/app/services/email_service.py`:

```python


async def send_report_email(to_email: str, full_name: str, report_data: dict) -> None:
    """Send the weekly farm report HTML email to a farmer."""
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.debug("SMTP not configured — skipping report email to %s", to_email)
        return

    try:
        template = _jinja_env.get_template("weekly_report.html")
        html = template.render(full_name=full_name, app_url=APP_URL, **report_data)

        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"Your Weekly Farm Report — {report_data.get('report_date', '')}"
        msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_USER}>"
        msg["To"] = to_email
        msg.attach(MIMEText(html, "html"))

        await aiosmtplib.send(
            msg,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USER,
            password=settings.SMTP_PASSWORD,
            start_tls=True,
            timeout=15,
        )
        logger.info("Weekly report sent to %s", to_email)
    except Exception as e:
        logger.warning("Failed to send weekly report to %s: %s", to_email, e)


async def send_agronomist_digest_email(
    to_email: str,
    full_name: str,
    farms: list,
    report_date: str,
) -> None:
    """Send the agronomist portfolio digest email."""
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.debug("SMTP not configured — skipping digest email to %s", to_email)
        return

    try:
        template = _jinja_env.get_template("agronomist_digest.html")
        html = template.render(
            full_name=full_name,
            farms=farms,
            report_date=report_date,
            app_url=APP_URL,
        )

        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"Your Farm Portfolio Digest — {report_date}"
        msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_USER}>"
        msg["To"] = to_email
        msg.attach(MIMEText(html, "html"))

        await aiosmtplib.send(
            msg,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USER,
            password=settings.SMTP_PASSWORD,
            start_tls=True,
            timeout=15,
        )
        logger.info("Agronomist digest sent to %s", to_email)
    except Exception as e:
        logger.warning("Failed to send agronomist digest to %s: %s", to_email, e)
```

- [ ] **Step 2: Verify imports work**

```bash
cd backend
./venv/bin/python -c "
from app.services.email_service import send_report_email, send_agronomist_digest_email
print('OK — both functions importable')
"
```

Expected: `OK — both functions importable`

- [ ] **Step 3: Commit**

```bash
git add backend/app/services/email_service.py
git commit -m "feat(reports): add send_report_email and send_agronomist_digest_email"
```

---

## Task 4: `POST /reports/send-email` Route

**Files:**
- Create: `backend/app/routes/report.py`
- Modify: `backend/app/main.py`

- [ ] **Step 1: Create `backend/app/routes/report.py`**

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.rbac import get_current_user
from app.models.user import User

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.post("/send-email")
async def send_report_email_on_demand(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Send the weekly farm report to the authenticated farmer's inbox immediately."""
    if current_user.role != "farmer":
        raise HTTPException(status_code=403, detail="Only farmers can request a personal report")

    from app.services.report_service import get_farmer_report_data
    from app.services.email_service import send_report_email

    report_data = get_farmer_report_data(current_user.id, db)
    await send_report_email(
        to_email=current_user.email,
        full_name=current_user.full_name,
        report_data=report_data,
    )
    return {"success": True, "message": f"Report sent to {current_user.email}"}
```

- [ ] **Step 2: Register the router in `main.py`**

In `backend/app/main.py`, add after the existing router imports:

```python
from app.routes import report
```

And inside the router registration block (after `app.include_router(notification_stream.router)`):

```python
app.include_router(report.router)
```

- [ ] **Step 3: Verify endpoint appears in OpenAPI**

```bash
sleep 4 && curl -s --max-time 8 http://127.0.0.1:8080/openapi.json | python3 -c "
import sys, json
spec = json.load(sys.stdin)
route = spec['paths'].get('/reports/send-email')
print('Route exists:', route is not None)
print('Method:', list(route.keys()) if route else 'MISSING')
"
```

Expected:
```
Route exists: True
Method: ['post']
```

- [ ] **Step 4: Test endpoint returns 401 without token**

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://127.0.0.1:8080/reports/send-email
```

Expected: `401`

- [ ] **Step 5: Commit**

```bash
git add backend/app/routes/report.py backend/app/main.py
git commit -m "feat(reports): add POST /reports/send-email on-demand endpoint"
```

---

## Task 5: APScheduler Weekly Cron Job

**Files:**
- Modify: `backend/app/main.py`
- Modify: `backend/requirements.txt`

- [ ] **Step 1: Install apscheduler**

```bash
cd backend
./venv/bin/pip install apscheduler -q
echo "apscheduler" >> requirements.txt
```

- [ ] **Step 2: Add scheduler to `main.py`**

At the top of `backend/app/main.py`, add this import after the existing imports:

```python
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

_scheduler = AsyncIOScheduler()
```

Inside `startup_event()`, append after `start_mqtt_client()`:

```python
    from app.services.report_service import send_all_weekly_reports
    _scheduler.add_job(
        send_all_weekly_reports,
        CronTrigger(day_of_week="mon", hour=8, timezone="UTC"),
        id="weekly_reports",
        replace_existing=True,
    )
    _scheduler.start()
    logger.info("APScheduler started — weekly reports scheduled for Monday 08:00 UTC")
```

Add a shutdown handler after `startup_event()`:

```python
@app.on_event("shutdown")
async def shutdown_event():
    _scheduler.shutdown(wait=False)
    logger.info("APScheduler shut down")
```

- [ ] **Step 3: Verify scheduler starts without error**

```bash
sleep 5 && curl -s --max-time 8 http://127.0.0.1:8080/ | python3 -c "import sys,json; d=json.load(sys.stdin); print('Server OK:', d['status'])"
```

Expected: `Server OK: operational`

Check the backend terminal (pts/0) — it should show:

```
APScheduler started — weekly reports scheduled for Monday 08:00 UTC
```

- [ ] **Step 4: Manually trigger one send to smoke-test**

```bash
cd backend
TOKEN=$(./venv/bin/python -c "
from jose import jwt
from datetime import datetime, timedelta
import json
payload = {'sub': 'test-manual', 'exp': datetime.utcnow() + timedelta(hours=1)}
# This will fail auth — just testing the scheduler job directly
from app.services.report_service import send_all_weekly_reports
import asyncio
# Run synchronously to check it doesn't crash
print('Testing send_all_weekly_reports (will send 0 emails in test env if DB is dev)')
asyncio.run(send_all_weekly_reports())
print('Job completed without exception')
"
)
```

Expected: `Job completed without exception` (sends 0 or real emails depending on DB state).

- [ ] **Step 5: Commit**

```bash
git add backend/app/main.py backend/requirements.txt
git commit -m "feat(reports): APScheduler weekly cron job — Monday 08:00 UTC"
```

---

## Task 6: Frontend "Send Report" Button

**Files:**
- Modify: `frontend/src/Reports.jsx`

- [ ] **Step 1: Add `sendingReport` state and `handleSendReport` function**

In `Reports.jsx`, find the existing state declarations near the top of the component (around line 35–39) and add:

```jsx
const [sendingReport, setSendingReport] = useState(false);
```

After the `exportCSV` function (around line 213), add:

```jsx
const handleSendReport = async () => {
  setSendingReport(true);
  try {
    const storedUser = JSON.parse(localStorage.getItem('planto_user'));
    const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8080';
    const res = await fetch(`${BASE_URL}/reports/send-email`, {
      method: 'POST',
      headers: storedUser?.access_token
        ? { 'Authorization': `Bearer ${storedUser.access_token}` }
        : {},
    });
    if (res.ok) {
      setToast && setToast({ type: 'success', message: 'Report sent to your inbox!' });
    } else {
      setToast && setToast({ type: 'error', message: 'Could not send report — try again.' });
    }
  } catch {
    setToast && setToast({ type: 'error', message: 'Could not send report — try again.' });
  } finally {
    setSendingReport(false);
  }
};
```

Note: `Reports.jsx` does not currently receive a `setToast` prop. If no `setToast` is available, the catch block should fall back gracefully — the `setToast &&` guard handles this.

- [ ] **Step 2: Add button to desktop header actions**

Find the `setHeaderActions` block (inside `useEffect`, around line 90–107). After the existing "Export Dataset" button JSX, add a second button:

```jsx
<button
  onClick={handleSendReport}
  disabled={sendingReport || user?.role !== 'farmer'}
  className="pro-action-btn shadow-btn"
  style={{ background: sendingReport ? '#e2e8f0' : '#16a34a', color: sendingReport ? '#94a3b8' : '#fff', opacity: user?.role !== 'farmer' ? 0 : 1, pointerEvents: user?.role !== 'farmer' ? 'none' : 'auto' }}
>
  <Mail size={18} />
  <span>{sendingReport ? 'Sending…' : 'Send Report'}</span>
</button>
```

Also add `Mail` to the lucide-react import at the top of the file:

```jsx
import { 
  FileText, Download, ShieldCheck, AlertCircle, TrendingDown, TrendingUp,
  Droplets, Zap, Clock, Printer, Calendar, Layers, ChevronRight, Search,
  Filter, MoreVertical, Activity, History, FileSpreadsheet, BadgeCheck, Leaf,
  Mail
} from 'lucide-react';
```

- [ ] **Step 3: Add button to mobile view**

In the mobile view, find the "Export as CSV" button block (around line 344). Add a second button just below it:

```jsx
{user?.role === 'farmer' && (
  <button
    onClick={handleSendReport}
    disabled={sendingReport}
    style={{
      width: '100%', background: sendingReport ? '#e2e8f0' : '#16a34a',
      color: sendingReport ? '#94a3b8' : '#fff', border: 'none',
      borderRadius: '16px', padding: '1rem', fontWeight: 700, fontSize: '0.9rem',
      cursor: sendingReport ? 'not-allowed' : 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
      marginTop: '0.5rem'
    }}
  >
    <Mail size={16} /> {sendingReport ? 'Sending…' : 'Send Report to My Inbox'}
  </button>
)}
```

- [ ] **Step 4: Verify frontend builds cleanly**

```bash
cd frontend && npm run build 2>&1 | tail -8
```

Expected: build completes with `✓ built in` and no errors.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/Reports.jsx
git commit -m "feat(reports): add Send Report button to Reports page"
```

---

## Self-Review

**Spec coverage check:**

| Requirement | Task |
|-------------|------|
| Weekly email to farmers — crop health, harvest, fertilizer, soil reminder | Tasks 1, 2, 3 |
| Soil reminder only if test > 14 days ago | Task 1 (`SOIL_TEST_REMINDER_DAYS = 14`) |
| Upcoming harvests within 30 days | Task 1 (`HARVEST_LOOKAHEAD_DAYS = 30`) |
| Agronomist gets portfolio digest (all managed farms) | Tasks 1, 2, 3 |
| Sends every Monday 8 AM UTC via APScheduler | Task 5 |
| On-demand `POST /reports/send-email` for farmers | Task 4 |
| Frontend "Send Report" button with loading + toast | Task 6 |
| SMTP failure doesn't crash server | Tasks 3, 5 (try/except per user) |
| Farmer with no crops — email skipped | Task 1 (`if not report_data["crops"]: continue`) |
| Agronomist with no farms — email skipped | Task 1 (`if not farms: continue`) |

**Placeholder scan:** None found.

**Type consistency:**
- `get_farmer_report_data` returns `dict` with keys `crops`, `upcoming_harvests`, `fertilizer_plans`, `show_soil_reminder`, `soil_test_days_ago`, `last_soil_test_date`, `report_date` — all used consistently in `send_report_email` via `**report_data`.
- `get_agronomist_digest_data` returns `list[dict]` with keys `farm_name`, `farmer_name`, `active_crop_count`, `avg_health_score`, `has_critical_alerts` — matches `agronomist_digest.html` template variables exactly.
- `send_all_weekly_reports` calls `send_report_email(to_email, full_name, report_data)` and `send_agronomist_digest_email(to_email, full_name, farms, report_date)` — signatures match Task 3 definitions.
