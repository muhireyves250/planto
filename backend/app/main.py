import time
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base
from app.routes import auth, prediction, monitoring, fertilizer, farm, weather, alert, sensor, agronomist
from app.services.mqtt_service import start_mqtt_client

logger = logging.getLogger(__name__)

# Initialize Database Tables — retry on transient SSL/network errors (common with Neon auto-suspend)
for attempt in range(1, 6):
    try:
        Base.metadata.create_all(bind=engine)
        break
    except Exception as e:
        if attempt == 5:
            logger.error("Could not connect to database after 5 attempts: %s", e)
            raise
        logger.warning("DB connection attempt %d failed (%s), retrying in 3s...", attempt, e)
        time.sleep(3)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description="Refactored Planto API with Fertilizer Engine"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    start_mqtt_client()

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

@app.get("/")
async def root():
    return {"message": "Welcome to Planto API v2", "status": "operational"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
