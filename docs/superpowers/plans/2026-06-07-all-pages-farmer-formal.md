# All-Pages Farmer-Formal Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the Farmer-Formal design standard (personalised banner, real-data stats strip, zero hardcoded content) to every existing page — Soil Test, Monitoring, Crop Status, and Settings.

**Architecture:** Each page already follows a shared layout pattern (banner → stats strip → two-column grid). We extend each page with the same personalisation and real-data techniques used for the dashboard redesign on 2026-06-07. No new routes or API endpoints needed — all data is already reachable through existing APIs. The plan treats each page as an independent deliverable.

**Tech Stack:** React 18, lucide-react icons, existing CSS design tokens (`var(--bg-sidebar)`, `var(--accent-emerald)`, etc.), `monitoringApi`, `farmApi`, `alertApi` from `src/api/`.

---

## File Map

| File | Change |
|------|--------|
| `frontend/src/pages/Monitoring.jsx` | Replace static banner with time-of-day greeting + crop-count subtitle |
| `frontend/src/pages/SoilTest.jsx` | Add 4-card stats strip; personalise banner copy |
| `frontend/src/Reports.jsx` | Accept `user` prop; fetch planted crops; replace fake stats with real counts; replace hardcoded insights with computed ones; personalise banner |
| `frontend/src/App.jsx` | Pass `user` prop to `<Reports>` route |
| `frontend/src/Settings.jsx` | Fill the empty Preferences section; personalise banner with farmer name |

---

## Task 1: Monitoring — Personalised Banner

**Files:**
- Modify: `frontend/src/pages/Monitoring.jsx:401-409`

The banner currently reads "Ready to monitor?" with a static subtitle. Replace it with a time-of-day greeting and a conditional subtitle that describes the current crop situation.

- [ ] **Step 1: Add greeting + subtitle derivation inside `renderMainContent` wrapper**

  Open `frontend/src/pages/Monitoring.jsx`. After the `const activeCrops = ...` line (line 148), add these two derived values before the `return` of the outer component:

  ```jsx
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.full_name?.split(' ')[0] || 'Farmer';
  const monitoringSubtitle = loading
    ? 'Loading your crop data...'
    : activeCrops === 0
    ? 'No active crops yet. Run a soil test to get your first recommendation.'
    : `You have ${activeCrops} active crop${activeCrops === 1 ? '' : 's'}. Here's your health overview for today.`;
  ```

- [ ] **Step 2: Replace the static banner JSX**

  Replace the `<div className="pro-welcome-banner farmer-banner">` block (lines 402–409) with:

  ```jsx
  <div className="pro-welcome-banner farmer-banner">
    <div className="banner-content">
      <h2>{greeting}, {firstName}</h2>
      <p>{monitoringSubtitle}</p>
    </div>
    <div className="banner-icon">
      <Sprout size={120} color="rgba(255,255,255,0.1)" />
    </div>
  </div>
  ```

- [ ] **Step 3: Verify the page renders correctly**

  Run `npm run dev` from `frontend/`, navigate to `/monitoring`. Confirm:
  - Greeting changes based on time of day
  - When no crops: "No active crops yet. Run a soil test..."
  - When crops exist: "You have N active crop(s). Here's your health overview for today."
  - Loading state shows "Loading your crop data..."

- [ ] **Step 4: Commit**

  ```bash
  git add frontend/src/pages/Monitoring.jsx
  git commit -m "feat: personalise monitoring page banner with time-of-day greeting and crop-count subtitle"
  ```

---

## Task 2: Soil Test — Stats Strip + Personalised Banner

**Files:**
- Modify: `frontend/src/pages/SoilTest.jsx`

The Soil Test page has no stats strip at all and a static banner. Add a 4-card strip and personalise the banner.

- [ ] **Step 1: Add form-completion counter**

  In `SoilTest.jsx`, after the `const isMonitoring = params.mode === 'monitoring';` line, add:

  ```jsx
  // Count how many fields the user has filled in
  const fieldsNeeded = isMonitoring
    ? ['n', 'p', 'k', 'ph', 'moisture', 'temperature', 'humidity']
    : ['n', 'p', 'k', 'ph', 'temperature', 'humidity', 'rainfall'];
  const filledCount = fieldsNeeded.filter(f => formData[f] !== '').length;
  const formProgress = Math.round((filledCount / fieldsNeeded.length) * 100);
  ```

- [ ] **Step 2: Add personalised banner variables**

  Directly before the `return (` statement, add:

  ```jsx
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.full_name?.split(' ')[0] || 'Farmer';

  const bannerTitle = isMonitoring
    ? `Soil Update — ${params.cropName || 'Crop'}`
    : `${greeting}, ${firstName}`;

  const bannerSubtitle = isMonitoring
    ? `Enter fresh soil readings for ${params.cropName || 'your crop'}. AI will reassess your health index and update your fertilizer plan.`
    : 'Enter your soil readings below. Our AI will identify the best crop for your land today.';
  ```

- [ ] **Step 3: Replace the static banner title and subtitle**

  In the JSX where the banner is rendered (around lines 405–425), replace:

  ```jsx
  <h2>{isMonitoring ? `Soil Update for ${params.cropName || 'Planted Crop'}` : 'Test Your Soil'}</h2>
  <p>
    {isMonitoring 
      ? 'Input new soil telemetry coordinates. The diagnostics core will run precision models to update crop health indices.' 
      : 'Enter your soil information and local weather below. Our AI will find the best crops to plant on your land.'}
  </p>
  ```

  With:

  ```jsx
  <h2>{bannerTitle}</h2>
  <p>{bannerSubtitle}</p>
  ```

- [ ] **Step 4: Insert the stats strip after the banner and before the form**

  After the closing `</div>` of the banner and before `<form onSubmit={handleSubmit} ...>`, add:

  ```jsx
  <div className="stats-strip animate-1">
    <div className="stat-pill-card">
      <div className={`stat-icon-circle ${sensorActive ? 'green-soft' : 'orange-soft'}`}>
        <Activity size={20} color={sensorActive ? '#10b981' : '#f59e0b'} />
      </div>
      <div className="stat-data">
        <span className="stat-label">Sensor</span>
        <span className="stat-main">{sensorActive ? 'Active' : 'No Signal'}</span>
      </div>
    </div>
    <div className="stat-pill-card">
      <div className="stat-icon-circle blue-soft">
        <FlaskConical size={20} color="#3b82f6" />
      </div>
      <div className="stat-data">
        <span className="stat-label">Mode</span>
        <span className="stat-main">{isMonitoring ? 'Monitoring' : 'Prediction'}</span>
      </div>
    </div>
    <div className="stat-pill-card">
      <div className="stat-icon-circle yellow-soft">
        <TrendingUp size={20} color="#eab308" />
      </div>
      <div className="stat-data">
        <span className="stat-label">Form</span>
        <span className="stat-main">{filledCount}/{fieldsNeeded.length} Fields</span>
      </div>
    </div>
    <div className="stat-pill-card">
      <div
        className="stat-icon-circle"
        style={{ background: formProgress === 100 ? 'rgba(16,185,129,0.1)' : 'rgba(0,0,0,0.04)' }}
      >
        <CheckCircle2 size={20} color={formProgress === 100 ? '#10b981' : '#94a3b8'} />
      </div>
      <div className="stat-data">
        <span className="stat-label">Progress</span>
        <span className="stat-main">{formProgress}%</span>
      </div>
    </div>
  </div>
  ```

  Add `CheckCircle2` to the lucide-react import at the top of `SoilTest.jsx` if it isn't already imported.

- [ ] **Step 5: Verify stats strip renders**

  Navigate to `/soil-test`. Confirm:
  - Stats strip appears below the banner
  - Sensor dot shows green when IoT sensor is live, amber when no signal
  - Mode pill shows "Prediction" by default and "Monitoring" when arrived from crop monitoring
  - Filled fields counter increments as you type
  - Progress reaches 100% and turns green when all fields are filled

- [ ] **Step 6: Commit**

  ```bash
  git add frontend/src/pages/SoilTest.jsx
  git commit -m "feat: add stats strip and personalised banner to soil test page"
  ```

---

## Task 3: Crop Status — Pass `user` Prop from App.jsx

**Files:**
- Modify: `frontend/src/App.jsx` (the Reports route)

`Reports.jsx` currently receives no `user` prop, which blocks fetching real planted-crops data in Task 4.

- [ ] **Step 1: Add `user` to the Reports route**

  In `frontend/src/App.jsx`, find the route:

  ```jsx
  <Route path="/crop-status" element={<Reports setHeaderActions={setHeaderActions} />} />
  ```

  Change it to:

  ```jsx
  <Route path="/crop-status" element={<Reports user={user} setHeaderActions={setHeaderActions} />} />
  ```

- [ ] **Step 2: Accept `user` in Reports component signature**

  In `frontend/src/Reports.jsx`, change:

  ```jsx
  const Reports = ({ setHeaderActions }) => {
  ```

  To:

  ```jsx
  const Reports = ({ user, setHeaderActions }) => {
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add frontend/src/App.jsx frontend/src/Reports.jsx
  git commit -m "feat: pass user prop to Reports (Crop Status) page to enable real-data fetching"
  ```

---

## Task 4: Crop Status — Real Stats Strip + Computed Agronomic Insights

**Files:**
- Modify: `frontend/src/Reports.jsx`

Currently the stats strip uses fake math (`Math.ceil(data.length * 0.4)`) and the "Agronomic Insights" card has hardcoded strings. Fix both using real data.

### Part A — Real Stats Strip

- [ ] **Step 1: Add monitoringApi import**

  At the top of `Reports.jsx`, add:

  ```jsx
  import { monitoringApi } from './api/monitoringApi';
  ```

- [ ] **Step 2: Add planted crops state and fetch**

  Inside the `Reports` component, add new state after the existing `useState` calls:

  ```jsx
  const [plantedCrops, setPlantedCrops] = useState([]);
  ```

  In the existing `useEffect` that fetches predictions, extend `Promise.all` to also fetch planted crops when a user is logged in. Replace the current `fetchData` function body with:

  ```jsx
  const fetchData = async () => {
    const cached = getCached('predictions');
    if (cached) {
      setData(cached);
      setLoading(false);
    }
    try {
      const user = JSON.parse(localStorage.getItem('planto_user'));
      const fetches = [
        fetch(ANALYTICS_URL, {
          headers: user?.access_token ? { 'Authorization': `Bearer ${user.access_token}` } : {}
        })
      ];
      if (user?.id) {
        fetches.push(monitoringApi.getMyCrops(user.id));
      }
      const [predResponse, cropsData] = await Promise.all(fetches);
      const json = await predResponse.json();
      const sorted = (json || []).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setCached('predictions', sorted);
      setData(sorted);
      if (cropsData) setPlantedCrops(cropsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  ```

- [ ] **Step 3: Replace fake stats with real counts**

  Replace the stats strip JSX (the three `stat-pill-card` divs) with:

  ```jsx
  <div className="stats-strip animate-fade-in">
    <div className="stat-pill-card">
      <div className="stat-icon-circle blue-soft"><Layers size={20} color="#3b82f6" /></div>
      <div className="stat-data">
        <span className="stat-label">Active Crops</span>
        <span className="stat-main">
          {plantedCrops.filter(c => c.status === 'active').length} Active
        </span>
      </div>
    </div>
    <div className="stat-pill-card">
      <div className="stat-icon-circle orange-soft"><History size={20} color="#f59e0b" /></div>
      <div className="stat-data">
        <span className="stat-label">Past Tests</span>
        <span className="stat-main">{data.length} Records</span>
      </div>
    </div>
    <div className="stat-pill-card">
      <div className="stat-icon-circle green-soft"><TrendingUp size={20} color="#10b981" /></div>
      <div className="stat-data">
        <span className="stat-label">Avg Confidence</span>
        <span className="stat-main">{avgConfidence}%</span>
      </div>
    </div>
  </div>
  ```

### Part B — Computed Agronomic Insights

- [ ] **Step 4: Add insight computation before the return statement**

  After the `radarData` array definition, add:

  ```jsx
  const computedInsights = (() => {
    if (data.length < 2) return [];
    const insights = [];

    // N trend: compare average N of first half vs second half
    const half = Math.ceil(data.length / 2);
    const recent = data.slice(0, half);
    const older = data.slice(half);
    const avgNRecent = recent.reduce((s, d) => s + d.n, 0) / recent.length;
    const avgNOlder = older.reduce((s, d) => s + d.n, 0) / older.length;
    const nChange = Math.round(((avgNRecent - avgNOlder) / Math.max(avgNOlder, 1)) * 100);
    if (nChange <= -10) {
      insights.push({
        type: 'warning',
        icon: 'down',
        title: 'Nitrogen Declining',
        body: `N levels dropped ~${Math.abs(nChange)}% across your last ${data.length} tests. Consider Urea top-dressing.`
      });
    } else if (nChange >= 10) {
      insights.push({
        type: 'success',
        icon: 'up',
        title: 'Nitrogen Improving',
        body: `N levels rose ~${nChange}% in recent tests. Current soil management is effective.`
      });
    }

    // pH variance
    const phValues = data.map(d => d.ph);
    const phMin = Math.min(...phValues).toFixed(1);
    const phMax = Math.max(...phValues).toFixed(1);
    const phRange = phMax - phMin;
    if (phRange < 0.6) {
      insights.push({
        type: 'success',
        icon: 'up',
        title: 'pH Stability Confirmed',
        body: `pH range is ${phMin}–${phMax} across all tests. Consistent and within normal bounds.`
      });
    } else {
      insights.push({
        type: 'warning',
        icon: 'down',
        title: 'pH Variance Detected',
        body: `pH swings between ${phMin} and ${phMax}. Unstable pH reduces nutrient uptake.`
      });
    }

    // Confidence trend
    const avgConfRecent = recent.reduce((s, d) => s + (d.confidence || 0), 0) / recent.length;
    const avgConfOlder = older.reduce((s, d) => s + (d.confidence || 0), 0) / older.length;
    if (avgConfRecent > avgConfOlder + 0.05) {
      insights.push({
        type: 'success',
        icon: 'up',
        title: 'Prediction Accuracy Rising',
        body: `Recent AI confidence is ${Math.round(avgConfRecent * 100)}% vs ${Math.round(avgConfOlder * 100)}% historically. Soil is becoming more predictable.`
      });
    }

    return insights.slice(0, 3);
  })();
  ```

- [ ] **Step 5: Replace hardcoded insights JSX**

  Replace the `<div className="pro-insights-list">` block (which contains the two hardcoded `pro-insight-item` divs) with:

  ```jsx
  <div className="pro-insights-list" style={{marginTop: '0.5rem'}}>
    {computedInsights.length === 0 ? (
      <div style={{
        padding: '1.5rem', textAlign: 'center',
        background: 'var(--green-soft)', borderRadius: 'var(--radius-lg)',
        border: '1px dashed rgba(16,185,129,0.25)'
      }}>
        <p style={{fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600}}>
          Run at least 2 soil tests to see AI-computed insights here.
        </p>
      </div>
    ) : (
      computedInsights.map((ins, i) => (
        <div key={i} className={`pro-insight-item ${ins.type}`} style={{padding: '0.75rem', marginBottom: '0.5rem'}}>
          <div className="insight-icon" style={{width: '28px', height: '28px'}}>
            {ins.icon === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          </div>
          <div className="insight-content">
            <h4 style={{fontSize: '0.8rem'}}>{ins.title}</h4>
            <p style={{fontSize: '0.7rem'}}>{ins.body}</p>
          </div>
        </div>
      ))
    )}
  </div>
  ```

- [ ] **Step 6: Verify on the browser**

  Navigate to `/crop-status`. Confirm:
  - Active Crops stat shows real count from `getMyCrops` (not the fake `Math.ceil`)
  - Past Tests shows actual prediction record count
  - Insights are blank with the "Run at least 2 tests" message when fewer than 2 predictions exist
  - With real prediction data: N trend, pH stability, and confidence insights are computed and shown

- [ ] **Step 7: Commit**

  ```bash
  git add frontend/src/Reports.jsx
  git commit -m "feat: replace fake stats and hardcoded insights with real data in Crop Status page"
  ```

---

## Task 5: Crop Status — Personalised Banner

**Files:**
- Modify: `frontend/src/Reports.jsx`

- [ ] **Step 1: Add greeting + personalisation inside the component**

  After the `const avgConfidence = ...` line, add:

  ```jsx
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const storedUser = (() => {
    try { return JSON.parse(localStorage.getItem('planto_user')); } catch { return null; }
  })();
  const firstName = storedUser?.full_name?.split(' ')[0] || 'Farmer';
  const recordSummary = data.length === 0
    ? 'No soil tests recorded yet. Run your first test to begin building your archive.'
    : `${data.length} soil test record${data.length === 1 ? '' : 's'} found. Filter by crop or export to CSV.`;
  ```

- [ ] **Step 2: Replace the static banner content**

  Replace:

  ```jsx
  <h2>Archive Access</h2>
  <p>Access your full history of soil analysis records. Filter by crop or date to find specific audits.</p>
  <div style={{marginTop: '1rem', display: 'flex', gap: '0.5rem'}}>
    <span className="badge-mini-text" style={{background: 'rgba(255,255,255,0.1)', color: 'white'}}>AUDIT LOG</span>
    <span className="badge-mini-text" style={{background: 'rgba(255,255,255,0.1)', color: 'white'}}>{data.length} ENTRIES</span>
  </div>
  ```

  With:

  ```jsx
  <h2>{greeting}, {firstName}</h2>
  <p>{recordSummary}</p>
  <div style={{marginTop: '1rem', display: 'flex', gap: '0.5rem'}}>
    <span className="badge-mini-text" style={{background: 'rgba(255,255,255,0.1)', color: 'white'}}>AUDIT LOG</span>
    <span className="badge-mini-text" style={{background: 'rgba(255,255,255,0.1)', color: 'white'}}>{data.length} ENTRIES</span>
  </div>
  ```

- [ ] **Step 3: Verify**

  Navigate to `/crop-status`. Confirm the banner shows the farmer's first name and a data-driven subtitle.

- [ ] **Step 4: Commit**

  ```bash
  git add frontend/src/Reports.jsx
  git commit -m "feat: personalise Crop Status banner with time-of-day greeting and record count"
  ```

---

## Task 6: Settings — Fill the Empty Preferences Section

**Files:**
- Modify: `frontend/src/Settings.jsx`

The nav has a "Preferences" item but `activeSection === 'preferences'` renders nothing. The fields (`default_soil_type`, `irrigation_system`, `farm_location`) already exist in `settingsData` but have no form UI.

- [ ] **Step 1: Add the preferences section JSX**

  In `Settings.jsx`, find the block:

  ```jsx
  {activeSection === 'security' && (
  ```

  Insert the following **before** it:

  ```jsx
  {activeSection === 'preferences' && (
    <div className="settings-content-area animate-fade-in">
      <div className="content-header" style={{marginBottom: '1.5rem'}}>
        <h3 style={{fontSize: '1.2rem'}}>Farm Preferences</h3>
        <p style={{fontSize: '0.8rem'}}>Set your default agronomic settings. These are used to pre-fill forms.</p>
      </div>

      <div className="settings-form-grid" style={{gap: '1.25rem'}}>
        <div className="form-group">
          <label style={{fontSize: '0.65rem'}}>Default Soil Type</label>
          <select
            name="default_soil_type"
            className="pro-input"
            value={settingsData.default_soil_type}
            onChange={handleInputChange}
            style={{paddingLeft: '0.75rem', fontSize: '0.85rem', height: '42px', cursor: 'pointer'}}
          >
            {['Loamy', 'Sandy', 'Clay', 'Silty', 'Peaty', 'Chalky'].map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label style={{fontSize: '0.65rem'}}>Irrigation System</label>
          <select
            name="irrigation_system"
            className="pro-input"
            value={settingsData.irrigation_system}
            onChange={handleInputChange}
            style={{paddingLeft: '0.75rem', fontSize: '0.85rem', height: '42px', cursor: 'pointer'}}
          >
            {['Drip Irrigation', 'Sprinkler', 'Surface Irrigation', 'Subsurface Drip', 'Rain-fed'].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="form-group full-width">
          <label style={{fontSize: '0.65rem'}}>Farm Location (City or Region)</label>
          <div className="pro-input-wrapper">
            <div className="pro-input-icon"><MapPin size={14} /></div>
            <input
              type="text"
              name="farm_location"
              className="pro-input"
              value={settingsData.farm_location}
              onChange={handleInputChange}
              placeholder="e.g. Musanze, Northern Province"
              style={{fontSize: '0.85rem', padding: '0.5rem 0.5rem 0.5rem 2.2rem'}}
            />
          </div>
        </div>
      </div>
    </div>
  )}
  ```

- [ ] **Step 2: Verify the Preferences section is functional**

  Navigate to `/settings`, click "Preferences". Confirm:
  - Soil Type dropdown renders with 6 options
  - Irrigation System dropdown renders with 5 options
  - Farm Location text input is editable
  - Clicking "Save Changes" in the header sends these values to the backend (the existing `handleSave` function already includes them in `settingsData`)

- [ ] **Step 3: Commit**

  ```bash
  git add frontend/src/Settings.jsx
  git commit -m "feat: add Preferences section to Settings page with soil type, irrigation, and farm location fields"
  ```

---

## Task 7: Settings — Personalised Banner

**Files:**
- Modify: `frontend/src/Settings.jsx`

- [ ] **Step 1: Replace the static "Control Center" banner content**

  Find the banner JSX in `Settings.jsx`:

  ```jsx
  <h2 style={{fontSize: '1.8rem'}}>Control Center</h2>
  <p style={{fontSize: '0.9rem', maxWidth: '450px'}}>Configure your platform preferences, security, and farm metadata from one central hub.</p>
  ```

  Replace with:

  ```jsx
  <h2 style={{fontSize: '1.8rem'}}>{user?.full_name?.split(' ')[0] || 'Farmer'}'s Settings</h2>
  <p style={{fontSize: '0.9rem', maxWidth: '450px'}}>
    Manage your profile, farm preferences, notifications, and security from one central hub.
  </p>
  ```

- [ ] **Step 2: Verify**

  Navigate to `/settings`. Confirm the banner shows e.g. "John's Settings" with the farmer's first name.

- [ ] **Step 3: Commit**

  ```bash
  git add frontend/src/Settings.jsx
  git commit -m "feat: personalise Settings page banner with farmer name"
  ```

---

## Self-Review Against Spec

**Spec requirement:** "make plan for all exist page of dashboard"

| Page | Banner Personalised | Stats Strip (real) | No hardcoded content | Task |
|------|--------------------|--------------------|---------------------|------|
| Dashboard (`/`) | ✅ Done (2026-06-07) | ✅ Done | ✅ Done | — |
| Monitoring | ✅ Task 1 | ✅ Already real data | ✅ | Task 1 |
| Soil Test | ✅ Task 2 | ✅ Task 2 (new strip) | ✅ | Task 2 |
| Crop Status | ✅ Task 5 | ✅ Task 4 (real counts) | ✅ Task 4 (computed insights) | Tasks 3–5 |
| Settings | ✅ Task 7 | n/a (no stats strip needed) | ✅ Task 6 (preferences filled) | Tasks 6–7 |

**Placeholder scan:** No TBD, TODO, or vague steps found. All code is concrete and complete.

**Type consistency:** All component props, state variable names, and API calls are consistent with the existing codebase conventions (`plantedCrops`, `getMyCrops(user.id)`, `getCached`/`setCached`). The `computedInsights` array uses the same field names as the `/predictions` response (`data.n`, `data.p`, `data.ph`, `data.confidence`).
