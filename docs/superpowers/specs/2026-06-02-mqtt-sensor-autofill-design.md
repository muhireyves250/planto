# MQTT Sensor Auto-Fill Design

**Date:** 2026-06-02
**Status:** Approved

## Overview

Replace manual soil data entry in `MonitoringForm` with automatic form population driven by a vibration sensor (ESP8266) publishing to an MQTT broker. The backend subscribes to the MQTT topic, fetches live weather data on sensor trigger, and exposes a REST endpoint the frontend polls to auto-fill all form fields.

---

## Architecture

```
ESP8266 (vibration sensor)
  → MQTT publish "1" or "0" to planto/vibration
  → broker.benax.rw:1883 (user: devadmin2)
  → paho-mqtt background thread in FastAPI
  → on "1": fetch OpenWeather (Rwanda coords) + set preset soil values in memory
  → on "0": clear memory store to null
  → GET /sensor/latest
  → frontend polls every 3 seconds
  → MonitoringForm auto-fills 7 fields + shows sensor status badge
```

---

## MQTT Broker

| Property | Value |
|---|---|
| Host | broker.benax.rw |
| Port | 1883 |
| Topic | planto/vibration |
| Username | devadmin2 |
| Payload | "1" (vibrating) or "0" (idle) |

The ESP8266 only publishes on state change. The backend must handle reconnection.

---

## Backend Changes

### New: `backend/app/services/mqtt_service.py`

- Connects to broker with credentials using `paho-mqtt`
- Subscribes to `planto/vibration`
- On message `"1"`:
  - Fetches live weather from OpenWeather API using Rwanda default coords (lat=-1.94, lng=29.87)
  - Stores preset soil values + weather values in a module-level dict `_latest_reading`
- On message `"0"`:
  - Sets `_latest_reading` to `None`
- Exposes `get_latest_reading()` function for the route to call
- Runs in a background daemon thread
- Handles reconnection automatically via paho-mqtt loop

**Preset soil values (fixed for testing):**

| Field | Value |
|---|---|
| N | 40 |
| P | 30 |
| K | 20 |
| pH | 6.5 |
| Moisture | 45 |
| Temperature | live from OpenWeather |
| Humidity | live from OpenWeather |

### New: `backend/app/routes/sensor.py`

```
GET /sensor/latest
```

- No authentication required (read-only, non-sensitive)
- Returns `{ "data": { n, p, k, ph, moisture, temperature, humidity } }` when vibration is active
- Returns `{ "data": null }` when vibration is idle or MQTT not connected

### Modified: `backend/app/main.py`

- Import and start the MQTT service thread on FastAPI `startup` event
- Include the `sensor` router

### Modified: `backend/requirements.txt`

- Add `paho-mqtt`

---

## Frontend Changes

### Modified: `frontend/src/components/forms/MonitoringForm.jsx`

**New fields added to form:**
- TEMPERATURE (°C) — maps to `temperature`
- HUMIDITY (%) — maps to `humidity`

**New props:**
- No new props needed — the component manages its own polling internally

**New behavior:**
- On mount: start polling `GET /sensor/latest` every 3 seconds
- On unmount: clear polling interval
- When response `data` is not null: overwrite all 7 form fields with received values
- When response `data` is null: do not clear fields (keep last auto-filled or manually entered values)

**Sensor status badge (shown in widget header):**
- Green dot + "Sensor Active" — when last poll returned non-null data
- Grey dot + "No Signal" — when last poll returned null

**Form fields remain editable** — auto-fill sets values but user can still override before submitting.

---

## Data Flow Detail

```
poll every 3s → GET /sensor/latest
  ├── { data: { n:40, p:30, k:20, ph:6.5, moisture:45, temperature:24.5, humidity:65 } }
  │     → fill all 7 fields, show green badge
  └── { data: null }
        → do nothing to fields, show grey badge
```

---

## What Does NOT Change

- `MonitoringCreate` schema already supports `temperature` and `humidity` (optional) — no schema changes needed
- Submit flow is unchanged — user still clicks "Submit Soil Update" to save
- No database changes — sensor readings are in-memory only

---

## Testing Notes

Since no real soil sensor is available, the vibration sensor simulates a reading event:
- Vibration detected (`1`) = "sensor has a reading" → fill with preset values
- No vibration (`0`) = "sensor idle" → no data

When a real soil sensor is connected later, replace the preset dict in `mqtt_service.py` with parsed sensor payload.
