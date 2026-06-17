# Admin Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a clean, focused admin dashboard with a live map of all farm locations, key platform stats, and user management — all on a single page without clutter.

**Architecture:** Admin gets a dedicated `/admin` route in the frontend, protected by role guard. The backend gets a new `/admin/overview` endpoint that returns farms with coordinates, user counts, and platform health in one call. The map is rendered with Leaflet (already available via CDN-style import or npm). The page has 3 sections: stat strip at top, full-width farm map in the center, user table at the bottom.

**Tech Stack:** React + Leaflet (`react-leaflet`), FastAPI, SQLAlchemy, existing RBAC (`role_required`), existing `Farm` + `User` + `PlantedCrop` models.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `backend/app/routes/admin.py` | **Create** | `/admin/overview` endpoint — farms with coords, user stats, crop count |
| `backend/app/main.py` | **Modify** | Register `admin` router |
| `frontend/src/pages/AdminDashboard.jsx` | **Create** | Admin page: stat strip + farm map + user table |
| `frontend/src/api/adminApi.js` | **Create** | `fetchAdminOverview()` API call |
| `frontend/src/App.jsx` | **Modify** | Add `/admin` route + redirect admin role on login |
| `frontend/package.json` | **Modify** | Add `react-leaflet` + `leaflet` dependencies |

---

## Task 1: Backend — Admin Overview Endpoint

**Files:**
- Create: `backend/app/routes/admin.py`
- Modify: `backend/app/main.py`

- [ ] **Step 1: Create `backend/app/routes/admin.py`**

```python
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.rbac import role_required
from app.models.user import User, UserProfile
from app.models.farm import Farm
from app.models.planted_crop import PlantedCrop

router = APIRouter(prefix="/admin", tags=["Admin"])

@router.get("/overview")
async def admin_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required(["admin"])),
):
    farms = db.query(Farm).all()
    users = db.query(User).all()
    crops = db.query(PlantedCrop).all()

    farmers = [u for u in users if u.role == "farmer"]
    agronomists = [u for u in users if u.role == "agronomist"]

    farm_pins = []
    for f in farms:
        if f.location_lat and f.location_lng:
            owner = next((u for u in users if u.id == f.owner_id), None)
            farm_crops = [c for c in crops if c.farm_id == f.id]
            farm_pins.append({
                "id": str(f.id),
                "name": f.farm_name,
                "lat": f.location_lat,
                "lng": f.location_lng,
                "owner": owner.full_name if owner else "Unknown",
                "crop_count": len(farm_crops),
                "size": f.farm_size,
            })

    recent_users = sorted(users, key=lambda u: u.created_at, reverse=True)[:5]

    return {
        "stats": {
            "total_users": len(users),
            "farmers": len(farmers),
            "agronomists": len(agronomists),
            "total_farms": len(farms),
            "mapped_farms": len(farm_pins),
            "total_crops": len(crops),
        },
        "farm_pins": farm_pins,
        "recent_users": [
            {
                "id": str(u.id),
                "full_name": u.full_name,
                "email": u.email,
                "role": u.role,
                "joined": u.created_at.isoformat(),
            }
            for u in recent_users
        ],
    }
```

- [ ] **Step 2: Register the router in `backend/app/main.py`**

Find the line:
```python
from app.routes import auth, prediction, monitoring, fertilizer, farm, weather, alert, sensor, agronomist, report
```

Replace with:
```python
from app.routes import auth, prediction, monitoring, fertilizer, farm, weather, alert, sensor, agronomist, report, admin
```

Then find where routers are included (after `app.include_router(auth.router)`) and add:
```python
app.include_router(admin.router)
```

- [ ] **Step 3: Test the endpoint locally**

```bash
# Start the backend
cd backend && uvicorn app.main:app --reload --port 8080

# In another terminal — login as admin first to get a token, then:
curl -H "Authorization: Bearer <admin_token>" http://localhost:8080/admin/overview | python3 -m json.tool
```

Expected: JSON with `stats`, `farm_pins` array, `recent_users` array.

- [ ] **Step 4: Commit**

```bash
git add backend/app/routes/admin.py backend/app/main.py
git commit -m "feat(admin): add /admin/overview endpoint with stats, farm pins, recent users"
```

---

## Task 2: Frontend — Install Leaflet and Create Admin API

**Files:**
- Modify: `frontend/package.json`
- Create: `frontend/src/api/adminApi.js`

- [ ] **Step 1: Install react-leaflet**

```bash
cd frontend && npm install react-leaflet leaflet
```

- [ ] **Step 2: Create `frontend/src/api/adminApi.js`**

```js
const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8080';

export const adminApi = {
  getOverview: async () => {
    const user = JSON.parse(localStorage.getItem('planto_user'));
    const res = await fetch(`${BASE_URL}/admin/overview`, {
      headers: { Authorization: `Bearer ${user?.access_token}` },
    });
    if (!res.ok) throw new Error('Failed to fetch admin overview');
    return res.json();
  },
};
```

- [ ] **Step 3: Commit**

```bash
git add frontend/package.json frontend/package-lock.json frontend/src/api/adminApi.js
git commit -m "feat(admin): install react-leaflet, add adminApi"
```

---

## Task 3: Frontend — Admin Dashboard Page

**Files:**
- Create: `frontend/src/pages/AdminDashboard.jsx`

The page has three vertical sections:
1. **Stat strip** — 4 compact cards: Total Users, Farmers, Farms, Crops
2. **Farm Map** — full-width Leaflet map with a pin per farm showing a popup (name, owner, crop count)
3. **Recent Users** — a clean 5-row table (name, email, role, joined date)

- [ ] **Step 1: Create `frontend/src/pages/AdminDashboard.jsx`**

```jsx
import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { adminApi } from '../api/adminApi';
import { Users, Sprout, Map, Tractor } from 'lucide-react';

// Fix default Leaflet marker icons (broken with bundlers)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const STAT_CARDS = (stats) => [
  { label: 'Total Users', value: stats.total_users, icon: Users, color: '#10b981' },
  { label: 'Farmers', value: stats.farmers, icon: Tractor, color: '#3b82f6' },
  { label: 'Farms', value: stats.total_farms, icon: Map, color: '#f59e0b' },
  { label: 'Active Crops', value: stats.total_crops, icon: Sprout, color: '#8b5cf6' },
];

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    adminApi.getOverview()
      .then(setData)
      .catch(() => setError('Failed to load admin data'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>
      Loading…
    </div>
  );

  if (error) return (
    <div style={{ padding: '2rem', color: '#f87171', fontSize: '0.9rem' }}>{error}</div>
  );

  const center = data.farm_pins.length
    ? [data.farm_pins[0].lat, data.farm_pins[0].lng]
    : [-1.9403, 29.8739]; // Rwanda default

  return (
    <div style={{ padding: '1.5rem 2rem', display: 'flex', flexDirection: 'column', gap: '1.75rem', maxWidth: 1100, margin: '0 auto' }}>

      {/* Stat Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {STAT_CARDS(data.stats).map(({ label, value, icon: Icon, color }) => (
          <div key={label} style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 14, padding: '1.1rem 1.25rem',
            display: 'flex', alignItems: 'center', gap: '1rem',
          }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={18} style={{ color }} />
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.2rem', fontWeight: 500 }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Farm Map */}
      <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ padding: '0.85rem 1.25rem', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.88rem' }}>Farm Locations</span>
          <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)' }}>{data.stats.mapped_farms} farms mapped</span>
        </div>
        <MapContainer center={center} zoom={7} style={{ height: 420, width: '100%' }} scrollWheelZoom={false}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {data.farm_pins.map(pin => (
            <Marker key={pin.id} position={[pin.lat, pin.lng]}>
              <Popup>
                <div style={{ minWidth: 140 }}>
                  <strong>{pin.name}</strong><br />
                  <span style={{ fontSize: '0.8rem', color: '#555' }}>Owner: {pin.owner}</span><br />
                  <span style={{ fontSize: '0.8rem', color: '#555' }}>Crops: {pin.crop_count}</span>
                  {pin.size && <><br /><span style={{ fontSize: '0.8rem', color: '#555' }}>Size: {pin.size}</span></>}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Recent Users */}
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.88rem' }}>Recent Users</span>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
              {['Name', 'Email', 'Role', 'Joined'].map(h => (
                <th key={h} style={{ padding: '0.6rem 1.25rem', textAlign: 'left', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.35)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.recent_users.map((u, i) => (
              <tr key={u.id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '0.75rem 1.25rem', fontSize: '0.82rem', color: '#fff', fontWeight: 600 }}>{u.full_name}</td>
                <td style={{ padding: '0.75rem 1.25rem', fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)' }}>{u.email}</td>
                <td style={{ padding: '0.75rem 1.25rem' }}>
                  <span style={{
                    fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                    padding: '0.2rem 0.55rem', borderRadius: '999px',
                    background: u.role === 'admin' ? 'rgba(239,68,68,0.15)' : u.role === 'agronomist' ? 'rgba(59,130,246,0.15)' : 'rgba(16,185,129,0.15)',
                    color: u.role === 'admin' ? '#f87171' : u.role === 'agronomist' ? '#60a5fa' : '#10b981',
                  }}>{u.role}</span>
                </td>
                <td style={{ padding: '0.75rem 1.25rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)' }}>
                  {new Date(u.joined).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
```

- [ ] **Step 2: Verify it renders without errors locally (start dev server)**

```bash
cd frontend && npm run dev
# Visit http://localhost:5173 — log in as admin — navigate to /admin
```

Expected: stat strip shows numbers, map renders with farm pins, recent users table shows 5 rows.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/AdminDashboard.jsx
git commit -m "feat(admin): AdminDashboard page with stat strip, farm map, recent users"
```

---

## Task 4: Wire Admin Route and Login Redirect

**Files:**
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: Import AdminDashboard as a lazy component**

At the top of `App.jsx` where other lazy imports are, add:
```jsx
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
```

- [ ] **Step 2: Add the `/admin` route inside the authenticated `<Routes>` block**

Find where routes like `/dashboard`, `/monitoring` etc. are defined and add:
```jsx
<Route path="/admin" element={
  user?.role === 'admin'
    ? <AdminDashboard />
    : <Navigate to="/dashboard" replace />
} />
```

- [ ] **Step 3: Redirect admin role to `/admin` on login**

Find `onLoginSuccess` in `App.jsx`. The current line:
```js
navigate(userData.role === 'agronomist' ? '/my-farms' : '/dashboard');
```

Replace with:
```js
navigate(
  userData.role === 'agronomist' ? '/my-farms' :
  userData.role === 'admin' ? '/admin' :
  '/dashboard'
);
```

- [ ] **Step 4: Add "Admin" nav item visible only to admin users**

Find the nav section (where `dashboard`, `monitoring` etc. nav items are rendered). Add after the existing items:
```jsx
{user?.role === 'admin' && (
  <button onClick={() => setActiveTab('admin')} className={`nav-item ${activeTab === 'admin' ? 'active' : ''}`}>
    Admin
  </button>
)}
```

- [ ] **Step 5: Test the full flow**

```bash
# Login as admin user
# Expected: redirected to /admin
# Expected: map visible, stats populated
# Expected: non-admin user hitting /admin gets redirected to /dashboard
```

- [ ] **Step 6: Commit**

```bash
git add frontend/src/App.jsx
git commit -m "feat(admin): wire /admin route, redirect on login, nav item for admin role"
```

---

## Task 5: Push and Deploy

- [ ] **Step 1: Final build check**

```bash
cd frontend && npm run build
# Expected: ✓ built in X.Xs — no errors
```

- [ ] **Step 2: Push all commits**

```bash
git push origin main
```

- [ ] **Step 3: Trigger Render redeploy**

Go to Render dashboard → `planto-backend` → **Deploys** → **Deploy latest commit**. Wait for it to go live.

- [ ] **Step 4: Smoke test on production**

Visit `https://planto-wheat.vercel.app/login`, log in as admin, confirm:
- Redirected to `/admin`
- Stat strip shows real numbers
- Map shows farm pins (if any farms have `location_lat`/`location_lng` set)
- Recent users table shows latest 5 signups

---

## Self-Review

**Spec coverage:**
- ✅ Map of all farm locations — Task 3 (Leaflet MapContainer with Marker per farm)
- ✅ Admin role routing — Task 4 (route guard + login redirect)
- ✅ Platform stats — Task 3 (stat strip: users, farmers, farms, crops)
- ✅ Recent users — Task 3 (5-row table)
- ✅ Not too many things — page has exactly 3 sections, nothing else
- ✅ Backend data endpoint — Task 1 (`/admin/overview`)

**Placeholder scan:** No TBDs, no "fill in later", all code blocks complete.

**Type consistency:** `farm_pins[].lat/lng` used in backend Task 1 matches `pin.lat / pin.lng` in frontend Task 3. `stats.mapped_farms` returned in Task 1 used in Task 3 header. `recent_users[].joined` set in Task 1, read in Task 3.

**Edge cases handled:**
- Map center defaults to Rwanda (`[-1.9403, 29.8739]`) if no farms have coordinates
- Farms without `location_lat`/`location_lng` are silently skipped from `farm_pins`
- Leaflet default marker icon fix included (common bundler issue)
