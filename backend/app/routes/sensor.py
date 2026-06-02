from fastapi import APIRouter
from app.services.mqtt_service import get_latest_reading

router = APIRouter(prefix="/sensor", tags=["Sensor"])


@router.get("/latest")
async def get_sensor_latest():
    return {"data": get_latest_reading()}
