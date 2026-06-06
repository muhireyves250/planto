import httpx
from app.core.config import settings

_cache: dict = {}
_CACHE_TTL = 600  # 10 minutes


class WeatherService:
    async def get_weather(self, lat: float, lon: float):
        api_key = settings.OPENWEATHER_API_KEY
        if not api_key:
            return None

        cache_key = f"{round(lat, 2)},{round(lon, 2)}"
        import time
        now = time.monotonic()
        if cache_key in _cache:
            data, ts = _cache[cache_key]
            if now - ts < _CACHE_TTL:
                return data

        url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&units=metric&appid={api_key}"
        try:
            async with httpx.AsyncClient(timeout=8) as client:
                response = await client.get(url)
                response.raise_for_status()
                data = response.json()
                _cache[cache_key] = (data, now)
                return data
        except Exception as e:
            print(f"Weather API Error: {e}")
            return None

    def get_weather_sync(self, lat: float, lon: float):
        """Sync version used by the MQTT background thread."""
        api_key = settings.OPENWEATHER_API_KEY
        if not api_key:
            return None

        cache_key = f"{round(lat, 2)},{round(lon, 2)}"
        import time
        now = time.monotonic()
        if cache_key in _cache:
            data, ts = _cache[cache_key]
            if now - ts < _CACHE_TTL:
                return data

        import requests as _requests
        url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&units=metric&appid={api_key}"
        try:
            response = _requests.get(url, timeout=8)
            response.raise_for_status()
            data = response.json()
            _cache[cache_key] = (data, now)
            return data
        except Exception as e:
            print(f"Weather API Error: {e}")
            return None


weather_service = WeatherService()
