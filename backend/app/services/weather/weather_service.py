import requests
from app.core.config import settings

class WeatherService:
    @staticmethod
    def get_weather(lat: float, lon: float):
        api_key = settings.OPENWEATHER_API_KEY
        if not api_key:
            return None
            
        url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&units=metric&appid={api_key}"
        try:
            response = requests.get(url)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Weather API Error: {e}")
            return None

weather_service = WeatherService()
