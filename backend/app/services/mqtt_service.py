import threading
import random
import paho.mqtt.client as mqtt
from app.services.weather.weather_service import weather_service

MQTT_BROKER = "broker.benax.rw"
MQTT_PORT = 1883
MQTT_TOPIC = "planto/vibration"
MQTT_USER = "devadmin2"
MQTT_PASS = "Tw26~wh$Q"

WEATHER_LAT = -1.94
WEATHER_LNG = 29.87

def _random_soil():
    return {
        "n":        round(random.uniform(10, 140), 1),
        "p":        round(random.uniform(5, 145), 1),
        "k":        round(random.uniform(5, 205), 1),
        "ph":       round(random.uniform(5.5, 8.0), 1),
        "moisture": round(random.uniform(10, 90), 1),
        "rainfall": round(random.uniform(20, 300), 1),
    }

_latest_reading = None
_sensor_vibrating = False
_lock = threading.Lock()


def get_latest_reading():
    with _lock:
        if _latest_reading is None:
            return None
        return {**_latest_reading, "active": _sensor_vibrating}


def _on_connect(client, userdata, flags, rc):
    if rc == 0:
        client.subscribe(MQTT_TOPIC)
        print(f"[MQTT] Connected and subscribed to {MQTT_TOPIC}")
    else:
        print(f"[MQTT] Connection failed with code {rc}")


def _on_message(client, userdata, msg):
    global _latest_reading, _sensor_vibrating
    payload = msg.payload.decode("utf-8").strip()
    print(f"[MQTT] Received: {payload}")

    if payload == "1":
        weather = weather_service.get_weather_sync(WEATHER_LAT, WEATHER_LNG)
        if weather:
            temp = weather["main"]["temp"]
            humidity = weather["main"]["humidity"]
        else:
            temp = 24.5
            humidity = 65.0

        with _lock:
            _latest_reading = {**_random_soil(), "temperature": temp, "humidity": humidity}
            _sensor_vibrating = True
        print(f"[MQTT] Sensor active — reading stored: {_latest_reading}")
    else:
        with _lock:
            _sensor_vibrating = False
        print("[MQTT] Sensor idle — keeping last reading")


def _run_mqtt():
    client = mqtt.Client(client_id="planto-backend", clean_session=True)
    client.username_pw_set(MQTT_USER, MQTT_PASS)
    client.on_connect = _on_connect
    client.on_message = _on_message

    try:
        client.connect(MQTT_BROKER, MQTT_PORT, keepalive=60)
    except Exception as e:
        print(f"[MQTT] Initial connection failed: {e}. Will retry via loop.")

    client.loop_forever()


def start_mqtt_client():
    thread = threading.Thread(target=_run_mqtt, daemon=True)
    thread.start()
    print("[MQTT] Background thread started")
