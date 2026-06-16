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
        if latest_health is not None:
            score = latest_health.health_score
            crop_rows.append({
                "name": crop.crop_name,
                "health_score": round(score * 100),
                "health_label": _health_label(score),
            })
        else:
            crop_rows.append({
                "name": crop.crop_name,
                "health_score": None,
                "health_label": "none",
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
    try:
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
    except Exception as e:
        logger.error("Weekly report job failed: %s", e)
        return
    logger.info("Weekly report job complete")
