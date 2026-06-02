import threading
import paho.mqtt.client as mqtt
from app.services.weather.weather_service import weather_service

MQTT_BROKER = "broker.benax.rw"
MQTT_PORT = 1883
MQTT_TOPIC = "planto/vibration"
MQTT_USER = "devadmin2"
MQTT_PASS = "Tw26~wh$Q"

WEATHER_LAT = -1.94
WEATHER_LNG = 29.87

PRESET_SOIL = {"n": 40.0, "p": 30.0, "k": 20.0, "ph": 6.5, "moisture": 45.0}

_latest_reading = None
_lock = threading.Lock()


def get_latest_reading():
    with _lock:
        return _latest_reading


def _on_connect(client, userdata, flags, rc):
    if rc == 0:
        client.subscribe(MQTT_TOPIC)
        print(f"[MQTT] Connected and subscribed to {MQTT_TOPIC}")
    else:
        print(f"[MQTT] Connection failed with code {rc}")


def _on_message(client, userdata, msg):
    global _latest_reading
    payload = msg.payload.decode("utf-8").strip()
    print(f"[MQTT] Received: {payload}")

    if payload == "1":
        weather = weather_service.get_weather(WEATHER_LAT, WEATHER_LNG)
        if weather:
            temp = weather["main"]["temp"]
            humidity = weather["main"]["humidity"]
        else:
            temp = 24.5
            humidity = 65.0

        with _lock:
            _latest_reading = {**PRESET_SOIL, "temperature": temp, "humidity": humidity}
        print(f"[MQTT] Sensor active — reading stored: {_latest_reading}")
    else:
        with _lock:
            _latest_reading = None
        print("[MQTT] Sensor idle — reading cleared")


def start_mqtt_client():
    client = mqtt.Client(client_id="planto-backend", clean_session=True)
    client.username_pw_set(MQTT_USER, MQTT_PASS)
    client.on_connect = _on_connect
    client.on_message = _on_message

    try:
        client.connect(MQTT_BROKER, MQTT_PORT, keepalive=60)
    except Exception as e:
        print(f"[MQTT] Initial connection failed: {e}. Will retry via loop.")

    thread = threading.Thread(target=client.loop_forever, daemon=True)
    thread.start()
    print("[MQTT] Background thread started")
