from fastapi import APIRouter, HTTPException, Depends
from app.services.weather.weather_service import weather_service
from typing import Optional

router = APIRouter(prefix="/weather", tags=["Weather Intelligence"])

@router.get("/")
async def get_farm_weather(lat: float, lon: float):
    weather = weather_service.get_weather(lat, lon)
    if not weather:
        # Fallback to mock data if API fails or no key
        return {
            "temp": 24.5,
            "humidity": 65,
            "rainfall": 0.2,
            "condition": "Cloudy",
            "forecast": [
                {"day": "Mon", "temp": 25, "condition": "Sunny"},
                {"day": "Tue", "temp": 23, "condition": "Rainy"},
                {"day": "Wed", "temp": 24, "condition": "Cloudy"}
            ],
            "is_mock": True
        }
    
    return {
        "temp": weather["main"]["temp"],
        "humidity": weather["main"]["humidity"],
        "rainfall": weather.get("rain", {}).get("1h", 0),
        "condition": weather["weather"][0]["main"],
        "is_mock": False
    }
