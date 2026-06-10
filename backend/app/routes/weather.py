from fastapi import APIRouter, HTTPException, Request
from app.services.weather.weather_service import weather_service
import httpx

router = APIRouter(prefix="/weather", tags=["Weather Intelligence"])

@router.get("/geoip")
async def get_geoip(request: Request):
    """Server-side IP geolocation — avoids CORS issues from the browser."""
    client_ip = request.headers.get("X-Forwarded-For", request.client.host).split(",")[0].strip()
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            res = await client.get(f"https://ipapi.co/{client_ip}/json/")
            d = res.json()
            if d.get("latitude") and d.get("longitude"):
                return {"lat": d["latitude"], "lng": d["longitude"]}
    except Exception:
        pass
    return {"lat": None, "lng": None}

@router.get("/")
async def get_farm_weather(lat: float, lon: float):
    weather = await weather_service.get_weather(lat, lon)
    if not weather:
        # Fallback to mock data if API fails or no key
        return {
            "temp": 24.5,
            "humidity": 65,
            "rainfall": 0.2,
            "condition": "Cloudy",
            "wind_speed": 12.0,
            "is_mock": True
        }
    
    return {
        "temp": weather["main"]["temp"],
        "humidity": weather["main"]["humidity"],
        "rainfall": weather.get("rain", {}).get("1h", 0),
        "condition": weather["weather"][0]["main"],
        "wind_speed": round(weather.get("wind", {}).get("speed", 0) * 3.6, 1),
        "is_mock": False
    }
