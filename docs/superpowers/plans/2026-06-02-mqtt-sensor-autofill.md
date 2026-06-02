# MQTT Sensor Auto-Fill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Auto-fill the soil monitoring form using a vibration sensor on ESP8266 publishing to MQTT, with live weather data for temperature and humidity.

**Architecture:** A paho-mqtt background thread in FastAPI subscribes to `planto/vibration` on `broker.benax.rw:1883`. On `"1"` it stores preset soil values + live OpenWeather data in memory; on `"0"` it clears the store. The frontend polls `GET /sensor/latest` every 3 seconds and auto-fills all 7 form fields.

**Tech Stack:** Python paho-mqtt, FastAPI startup event, React useEffect + setInterval, existing OpenWeather service.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `backend/requirements.txt` | Modify | Add paho-mqtt |
| `backend/app/services/mqtt_service.py` | Create | MQTT client, in-memory store, weather fetch |
| `backend/app/routes/sensor.py` | Create | `GET /sensor/latest` endpoint |
| `backend/app/main.py` | Modify | Register sensor router + start MQTT on startup |
| `frontend/src/api/sensorApi.js` | Create | `fetchSensorLatest()` fetch function |
| `frontend/src/components/forms/MonitoringForm.jsx` | Modify | Add temperature/humidity fields, polling, auto-fill, status badge |

---

## Task 1: Add paho-mqtt to requirements

**Files:**
- Modify: `backend/requirements.txt`

- [ ] **Step 1: Add paho-mqtt to requirements.txt**

Open `backend/requirements.txt` and add this line at the end:
```
paho-mqtt
```

- [ ] **Step 2: Install it in the virtualenv**

```bash
cd backend && pip install paho-mqtt
```

Expected output includes: `Successfully installed paho-mqtt-...`

- [ ] **Step 3: Commit**

```bash
git add backend/requirements.txt
git commit -m "chore: add paho-mqtt dependency"
```

---

## Task 2: Create the MQTT service

**Files:**
- Create: `backend/app/services/mqtt_service.py`

- [ ] **Step 1: Create the file**

Create `backend/app/services/mqtt_service.py` with this exact content:

```python
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
```

- [ ] **Step 2: Verify syntax**

```bash
cd backend && python -c "from app.services.mqtt_service import start_mqtt_client, get_latest_reading; print('OK')"
```

Expected output: `OK`

- [ ] **Step 3: Commit**

```bash
git add backend/app/services/mqtt_service.py
git commit -m "feat: add MQTT background service for vibration sensor"
```

---

## Task 3: Create the sensor route

**Files:**
- Create: `backend/app/routes/sensor.py`

- [ ] **Step 1: Create the file**

Create `backend/app/routes/sensor.py` with this exact content:

```python
from fastapi import APIRouter
from app.services.mqtt_service import get_latest_reading

router = APIRouter(prefix="/sensor", tags=["Sensor"])


@router.get("/latest")
async def get_sensor_latest():
    return {"data": get_latest_reading()}
```

- [ ] **Step 2: Verify syntax**

```bash
cd backend && python -c "from app.routes.sensor import router; print('OK')"
```

Expected output: `OK`

- [ ] **Step 3: Commit**

```bash
git add backend/app/routes/sensor.py
git commit -m "feat: add GET /sensor/latest endpoint"
```

---

## Task 4: Wire MQTT service and sensor route into main.py

**Files:**
- Modify: `backend/app/main.py`

- [ ] **Step 1: Add imports and startup event**

Open `backend/app/main.py`. The current top of the file looks like:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base
from app.routes import auth, prediction, monitoring, fertilizer, farm, weather, alert
```

Replace it with:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base
from app.routes import auth, prediction, monitoring, fertilizer, farm, weather, alert, sensor
from app.services.mqtt_service import start_mqtt_client
```

- [ ] **Step 2: Add the startup event and sensor router**

Find this block in `main.py`:

```python
# Include Routers
app.include_router(auth.router)
```

Add the startup event and sensor router just before it:

```python
@app.on_event("startup")
async def startup_event():
    start_mqtt_client()

# Include Routers
app.include_router(auth.router)
```

And add the sensor router after the existing routers (after `app.include_router(alert.router)`):

```python
app.include_router(sensor.router)
```

- [ ] **Step 3: Verify the app starts without errors**

```bash
cd backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Expected: Server starts, you see `[MQTT] Connected and subscribed to planto/vibration` in the logs within a few seconds. No import errors.

Press Ctrl+C to stop.

- [ ] **Step 4: Test the endpoint manually**

With the server running, in a second terminal:

```bash
curl http://localhost:8000/sensor/latest
```

Expected response when sensor is idle:
```json
{"data": null}
```

- [ ] **Step 5: Commit**

```bash
git add backend/app/main.py
git commit -m "feat: start MQTT client on startup and register sensor route"
```

---

## Task 5: Create the frontend sensor API function

**Files:**
- Create: `frontend/src/api/sensorApi.js`

- [ ] **Step 1: Create the file**

Create `frontend/src/api/sensorApi.js` with this exact content:

```js
const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8080';

export const sensorApi = {
  getLatest: async () => {
    const response = await fetch(`${BASE_URL}/sensor/latest`);
    if (!response.ok) throw new Error('Sensor fetch failed');
    return await response.json();
  }
};
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/api/sensorApi.js
git commit -m "feat: add sensorApi.getLatest frontend helper"
```

---

## Task 6: Update MonitoringForm with auto-fill, temperature/humidity fields, and sensor badge

**Files:**
- Modify: `frontend/src/components/forms/MonitoringForm.jsx`

- [ ] **Step 1: Replace the entire file content**

Replace `frontend/src/components/forms/MonitoringForm.jsx` with:

```jsx
import React, { useState, useEffect } from 'react';
import { Droplets, ThermometerSun, FlaskConical, Leaf, Sprout, Send, Loader2, Activity, Waves, Wind } from 'lucide-react';
import { sensorApi } from '../../api/sensorApi';

const MonitoringForm = ({ onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    n: '',
    p: '',
    k: '',
    ph: '',
    moisture: '',
    temperature: '',
    humidity: ''
  });
  const [sensorActive, setSensorActive] = useState(false);

  useEffect(() => {
    const poll = async () => {
      try {
        const result = await sensorApi.getLatest();
        if (result.data) {
          setSensorActive(true);
          setFormData({
            n: String(result.data.n),
            p: String(result.data.p),
            k: String(result.data.k),
            ph: String(result.data.ph),
            moisture: String(result.data.moisture),
            temperature: String(result.data.temperature),
            humidity: String(result.data.humidity)
          });
        } else {
          setSensorActive(false);
        }
      } catch {
        setSensorActive(false);
      }
    };

    poll();
    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="widgets-grid" style={{gridTemplateColumns: '1fr'}}>
      <div className="widget growth-widget" style={{background: 'white', border: '1px solid #e2e8f0'}}>
        <div className="widget-header">
          <span className="widget-title" style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
            <Activity size={20} color="var(--bg-sidebar)" />
            Update Soil Health
          </span>
          <span style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            fontSize: '0.75rem', fontWeight: 600,
            color: sensorActive ? '#16a34a' : '#94a3b8'
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: sensorActive ? '#16a34a' : '#94a3b8',
              display: 'inline-block'
            }} />
            {sensorActive ? 'Sensor Active' : 'No Signal'}
          </span>
        </div>

        <div className="input-group-grid" style={{marginTop: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem'}}>
          <div className="pro-input-group">
            <label className="pro-label">NITROGEN (N)</label>
            <div className="pro-input-wrapper">
              <div className="pro-input-icon"><Leaf size={16} /></div>
              <input type="number" name="n" className="pro-input" value={formData.n} onChange={handleChange} required />
            </div>
          </div>
          <div className="pro-input-group">
            <label className="pro-label">PHOSPHORUS (P)</label>
            <div className="pro-input-wrapper">
              <div className="pro-input-icon"><Sprout size={16} /></div>
              <input type="number" name="p" className="pro-input" value={formData.p} onChange={handleChange} required />
            </div>
          </div>
          <div className="pro-input-group">
            <label className="pro-label">POTASSIUM (K)</label>
            <div className="pro-input-wrapper">
              <div className="pro-input-icon"><Droplets size={16} /></div>
              <input type="number" name="k" className="pro-input" value={formData.k} onChange={handleChange} required />
            </div>
          </div>
          <div className="pro-input-group">
            <label className="pro-label">SOIL PH</label>
            <div className="pro-input-wrapper">
              <div className="pro-input-icon"><FlaskConical size={16} /></div>
              <input type="number" step="0.1" name="ph" className="pro-input" value={formData.ph} onChange={handleChange} required />
            </div>
          </div>
          <div className="pro-input-group" style={{gridColumn: '1 / -1'}}>
            <label className="pro-label">MOISTURE (%)</label>
            <div className="pro-input-wrapper">
              <div className="pro-input-icon"><Waves size={16} /></div>
              <input type="number" name="moisture" className="pro-input" value={formData.moisture} onChange={handleChange} required />
            </div>
          </div>
          <div className="pro-input-group">
            <label className="pro-label">TEMPERATURE (°C)</label>
            <div className="pro-input-wrapper">
              <div className="pro-input-icon"><ThermometerSun size={16} /></div>
              <input type="number" step="0.1" name="temperature" className="pro-input" value={formData.temperature} onChange={handleChange} />
            </div>
          </div>
          <div className="pro-input-group">
            <label className="pro-label">HUMIDITY (%)</label>
            <div className="pro-input-wrapper">
              <div className="pro-input-icon"><Wind size={16} /></div>
              <input type="number" step="0.1" name="humidity" className="pro-input" value={formData.humidity} onChange={handleChange} />
            </div>
          </div>
        </div>

        <button type="submit" className="action-btn-pro" style={{marginTop: '1.5rem', width: '100%', justifyContent: 'center'}} disabled={loading}>
          {loading ? <Loader2 size={18} className="lucide-spin" /> : <Send size={18} />}
          {loading ? 'Submitting...' : 'Submit Soil Update'}
        </button>
      </div>
    </form>
  );
};

export default MonitoringForm;
```

- [ ] **Step 2: Verify the frontend builds without errors**

```bash
cd frontend && npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/forms/MonitoringForm.jsx frontend/src/api/sensorApi.js
git commit -m "feat: auto-fill monitoring form from MQTT sensor with weather data"
```

---

## Task 7: End-to-End Verification

- [ ] **Step 1: Start the backend**

```bash
cd backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Confirm you see: `[MQTT] Connected and subscribed to planto/vibration`

- [ ] **Step 2: Trigger vibration on the ESP8266**

Tap or shake the vibration sensor. On your broker terminal confirm:

```bash
mosquitto_sub -h 157.173.101.159 -t planto/vibration -v
# planto/vibration 1
```

- [ ] **Step 3: Confirm backend stored the reading**

```bash
curl http://localhost:8000/sensor/latest
```

Expected:
```json
{
  "data": {
    "n": 40.0, "p": 30.0, "k": 20.0, "ph": 6.5, "moisture": 45.0,
    "temperature": 24.5, "humidity": 65.0
  }
}
```

- [ ] **Step 4: Start the frontend dev server**

```bash
cd frontend && npm run dev
```

Open the monitoring page in the browser. Within 3 seconds of vibration=1 being published, all 7 fields should auto-fill and the badge should show **Sensor Active** (green dot).

- [ ] **Step 5: Confirm idle clears the badge**

Stop the vibration (ESP8266 publishes `0`). Within 3 seconds the badge should change to **No Signal** (grey dot). Fields keep their last values.

- [ ] **Step 6: Submit the form**

Click "Submit Soil Update" and confirm the existing monitoring flow still works as before.
