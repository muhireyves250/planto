import time
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base
from app.models import push_subscription as _push_sub_model  # noqa: F401 — ensures table is registered
from app.routes import auth, prediction, monitoring, fertilizer, farm, weather, alert, sensor, agronomist, report
from app.services.mqtt_service import start_mqtt_client
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

logger = logging.getLogger(__name__)

_scheduler = AsyncIOScheduler()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description="Refactored Planto API with Fertilizer Engine"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    # Initialize DB tables — retry for Neon auto-suspend, but don't crash the server
    for attempt in range(1, 6):
        try:
            Base.metadata.create_all(bind=engine)
            _run_migrations()
            logger.info("Database tables ready.")
            break
        except Exception as e:
            if attempt == 5:
                logger.error("DB unavailable after 5 attempts — server starting anyway: %s", e)
                break
            logger.warning("DB connection attempt %d failed, retrying in 3s...", attempt)
            time.sleep(3)
    start_mqtt_client()
    from app.services.report_service import send_all_weekly_reports
    _scheduler.add_job(
        send_all_weekly_reports,
        CronTrigger(day_of_week="mon", hour=8, timezone="UTC"),
        id="weekly_reports",
        replace_existing=True,
    )
    _scheduler.start()
    logger.info("APScheduler started — weekly reports scheduled for Monday 08:00 UTC")


@app.on_event("shutdown")
async def shutdown_event():
    _scheduler.shutdown(wait=False)
    logger.info("APScheduler shut down")


def _run_migrations():
    """Apply incremental schema changes that create_all won't add to existing tables."""
    from sqlalchemy import text
    with engine.connect() as conn:
        # Add ec/moisture to predictions (new sensor-based schema)
        for col, typ in [("ec", "FLOAT"), ("moisture", "FLOAT")]:
            try:
                conn.execute(text(f"ALTER TABLE predictions ADD COLUMN IF NOT EXISTS {col} {typ}"))
            except Exception:
                pass
        # Make legacy columns nullable
        for col in ["humidity", "rainfall"]:
            try:
                conn.execute(text(f"ALTER TABLE predictions ALTER COLUMN {col} DROP NOT NULL"))
            except Exception:
                pass

        # Enrich alerts table
        for col, typ in [
            ("category", "VARCHAR"),
            ("title", "VARCHAR"),
            ("action_url", "VARCHAR"),
        ]:
            try:
                conn.execute(text(f"ALTER TABLE alerts ADD COLUMN IF NOT EXISTS {col} {typ}"))
            except Exception:
                pass
        conn.commit()

# Include Routers
app.include_router(auth.router)
app.include_router(prediction.router)
app.include_router(monitoring.router)
app.include_router(fertilizer.router)
app.include_router(farm.router)
app.include_router(weather.router)
app.include_router(alert.router)
app.include_router(sensor.router)
app.include_router(agronomist.router)
app.include_router(report.router)

from app.routes import notification_stream
app.include_router(notification_stream.router)

@app.get("/")
async def root():
    return {"message": "Welcome to Planto API v2", "status": "operational"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
