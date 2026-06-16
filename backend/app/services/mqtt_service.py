import json
import threading
import paho.mqtt.client as mqtt

MQTT_BROKER = "broker.benax.rw"
MQTT_PORT = 1883
MQTT_TOPIC = "planto/soil"
MQTT_USER = "devadmin2"
MQTT_PASS = "Tw26~wh$Q"

_latest_reading = None
_sensor_active = False
_lock = threading.Lock()


def get_latest_reading():
    with _lock:
        if _latest_reading is None:
            return None
        return {**_latest_reading, "active": _sensor_active}


def _on_connect(client, userdata, flags, rc):
    if rc == 0:
        client.subscribe(MQTT_TOPIC)
        print(f"[MQTT] Connected and subscribed to {MQTT_TOPIC}")
    else:
        print(f"[MQTT] Connection failed with code {rc}")


def _on_message(client, userdata, msg):
    global _latest_reading, _sensor_active
    payload = msg.payload.decode("utf-8").strip()
    print(f"[MQTT] Received: {payload}")

    try:
        data = json.loads(payload)

        # EC arrives in us/cm — convert to mS/cm (dS/m) for the 0–10 form range
        ec_raw = float(data.get("ec", 0))
        ec = round(ec_raw / 1000.0, 3) if ec_raw > 10 else round(ec_raw, 3)

        reading = {
            "n":          round(float(data["nitrogen"]),    1),
            "p":          round(float(data["phosphorus"]),  1),
            "k":          round(float(data["potassium"]),   1),
            "ph":         round(float(data["ph"]),          2),
            "moisture":   round(float(data["moisture"]),    1),
            "temperature":round(float(data["temperature"]), 1),
            "ec":         ec,
        }

        with _lock:
            _latest_reading = reading
            _sensor_active = True

        print(f"[MQTT] Soil reading stored: {reading}")

    except (KeyError, ValueError, json.JSONDecodeError) as e:
        print(f"[MQTT] Failed to parse payload: {e}")


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
