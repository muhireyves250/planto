import { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import {
  Users, Sprout, Activity, MapPin, Phone, Plus, X, ChevronRight,
  Loader2, FlaskConical, TrendingUp, ArrowLeft, BarChart2, Bell,
  CheckCircle2, CloudSun, CloudRain, ThermometerSun, Droplets, Leaf, Trash2
} from 'lucide-react';
import { agronomistApi } from '../api/agronomistApi';
import { weatherApi } from '../api/farmApi';
import { sensorApi } from '../api/sensorApi';
import { monitoringApi } from '../api/monitoringApi';
import CropHeroCard from '../components/monitoring/CropHeroCard';
import FarmStatusCards from '../components/monitoring/FarmStatusCards';
import RecommendedActions from '../components/monitoring/RecommendedActions';
import FertilizerPlanGrid from '../components/monitoring/FertilizerPlanGrid';
import SoilHealthBars from '../components/monitoring/SoilHealthBars';
import SoilRetestCTA from '../components/monitoring/SoilRetestCTA';
import SmartAlerts from '../components/monitoring/SmartAlerts';

const PREDICT_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/predict`
  : 'http://127.0.0.1:8080/predict';

const SOIL_TYPES = ['Clay', 'Sandy', 'Loamy', 'Silty', 'Peaty', 'Chalky'];
const IRRIGATION = ['None', 'Drip', 'Sprinkler', 'Flood', 'Manual'];

function healthColor(score) {
  if (!score) return { text: '#94a3b8', bg: 'rgba(148,163,184,0.1)', label: 'No Data' };
  if (score >= 80) return { text: '#10b981', bg: 'rgba(16,185,129,0.1)', label: 'Healthy' };
  if (score >= 60) return { text: '#f59e0b', bg: 'rgba(245,158,11,0.1)', label: 'Moderate' };
  return { text: '#ef4444', bg: 'rgba(239,68,68,0.1)', label: 'At Risk' };
}

// ── Add Farmer Modal ──────────────────────────────────────────────────────────
function AddFarmerModal({ onClose, onSaved }) {
  const [form, setForm] = useState({
    full_name: '', phone: '', location: '', notes: '',
    farm_name: '', farm_size: '', soil_type: '', irrigation_type: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.full_name.trim() || !form.farm_name.trim()) {
      setError('Farmer name and farm name are required.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await agronomistApi.addFarmer(form);
      onSaved();
    } catch (err) {
      setError('Failed to register farmer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return ReactDOM.createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', padding: '1rem' }}>
      <div style={{ background: '#fff', borderRadius: '24px', width: '100%', maxWidth: '520px', maxHeight: '90dvh', overflowY: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,0.2)', animation: 'slideUpModal 0.22s cubic-bezier(0.34,1.56,0.64,1)' }}>
        {/* Header */}
        <div style={{ padding: '1.75rem 1.75rem 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', fontFamily: 'var(--font-heading)' }}>Register a Farmer</h2>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#64748b' }}>Add a farmer you manage on the platform.</p>
          </div>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X size={18} color="#475569" />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem 1.75rem 1.75rem' }}>
          {/* Section: Farmer Info */}
          <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
            Farmer Information
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Full Name *</label>
              <input style={inputStyle} placeholder="e.g. Kamanzi Jean" value={form.full_name} onChange={e => set('full_name', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Phone Number</label>
              <input style={inputStyle} placeholder="+250 7XX XXX XXX" value={form.phone} onChange={e => set('phone', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Village / Sector</label>
              <input style={inputStyle} placeholder="e.g. Kayonza, Eastern" value={form.location} onChange={e => set('location', e.target.value)} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Notes (optional)</label>
              <input style={inputStyle} placeholder="Any additional notes about this farmer" value={form.notes} onChange={e => set('notes', e.target.value)} />
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: '#f1f5f9', margin: '1.1rem 0' }} />

          {/* Section: Farm Info */}
          <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
            Farm Details
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Farm Name *</label>
              <input style={inputStyle} placeholder="e.g. Kamanzi Family Farm" value={form.farm_name} onChange={e => set('farm_name', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Farm Size</label>
              <input style={inputStyle} placeholder="e.g. 2 hectares" value={form.farm_size} onChange={e => set('farm_size', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Irrigation Type</label>
              <select style={inputStyle} value={form.irrigation_type} onChange={e => set('irrigation_type', e.target.value)}>
                <option value="">Select...</option>
                {IRRIGATION.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Soil Type</label>
              <select style={inputStyle} value={form.soil_type} onChange={e => set('soil_type', e.target.value)}>
                <option value="">Select...</option>
                {SOIL_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {error && (
            <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: '#fff1f2', border: '1px solid #fecaca', borderRadius: '10px', fontSize: '0.82rem', color: '#e11d48' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '0.85rem', borderRadius: '14px', border: '2px solid #e2e8f0', background: '#fff', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', color: '#64748b' }}>
              Cancel
            </button>
            <button type="submit" disabled={loading} style={{ flex: 1, padding: '0.85rem', borderRadius: '14px', border: 'none', background: loading ? '#a7f3d0' : 'var(--bg-sidebar)', color: '#fff', fontWeight: 700, fontSize: '0.9rem', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
              {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={16} />}
              {loading ? 'Registering...' : 'Register Farmer'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

// ── Notify Farmer Modal ───────────────────────────────────────────────────────
function NotifyFarmerModal({ farmer, onClose }) {
  const [message, setMessage] = useState(farmer.notes || '');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) return;
    setLoading(true);
    try {
      await agronomistApi.updateFarmer(farmer.id, { notes: message });
      setSaved(true);
      setTimeout(onClose, 1200);
    } catch {
      setLoading(false);
    }
  };

  return ReactDOM.createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', padding: '1rem' }}>
      <div style={{ background: '#fff', borderRadius: '24px', width: '100%', maxWidth: '420px', boxShadow: '0 24px 60px rgba(0,0,0,0.2)', animation: 'slideUpModal 0.22s cubic-bezier(0.34,1.56,0.64,1)', padding: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', fontFamily: 'var(--font-heading)' }}>Notify Farmer</div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.2rem' }}>{farmer.full_name}</div>
          </div>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X size={18} color="#475569" />
          </button>
        </div>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Type a message or note for this farmer..."
          rows={5}
          style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontSize: '0.875rem', color: '#0f172a', resize: 'vertical', outline: 'none', fontFamily: 'var(--font-body)', boxSizing: 'border-box' }}
        />
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '0.85rem', borderRadius: '14px', border: '2px solid #e2e8f0', background: '#fff', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', color: '#64748b' }}>
            Cancel
          </button>
          <button onClick={handleSend} disabled={loading || saved} style={{ flex: 1, padding: '0.85rem', borderRadius: '14px', border: 'none', background: saved ? '#10b981' : 'var(--bg-sidebar)', color: '#fff', fontWeight: 700, fontSize: '0.9rem', cursor: loading || saved ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
            {saved ? '✓ Saved' : loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <><Bell size={15} /> Send Note</>}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}


// Adapts farm-detail crop shape to the shapes monitoring components expect
function adaptCropForMonitoring(crop) {
  const latestHealth = crop.health_score != null
    ? { health_score: crop.health_score, risk_level: crop.risk_level }
    : null;
  const latestSoil = crop.latest_soil
    ? {
        n: crop.latest_soil.nitrogen,
        p: crop.latest_soil.phosphorus,
        k: crop.latest_soil.potassium,
        ph: crop.latest_soil.ph,
        moisture: crop.latest_soil.moisture,
        recorded_at: crop.latest_soil.recorded_at,
      }
    : null;
  const latestPlan = crop.fertilizer_plan
    ? {
        fertilizer_type: crop.fertilizer_plan.type,
        quantity_kg: crop.fertilizer_plan.quantity_kg,
        explanation: crop.fertilizer_plan.explanation,
        nutrient_target: null,
      }
    : null;
  const cropAge = crop.planting_date
    ? Math.max(0, Math.floor((new Date() - new Date(crop.planting_date)) / (1000 * 60 * 60 * 24)))
    : 0;
  return { latestHealth, latestSoil, latestPlan, cropAge };
}

// ── Farm Detail Panel ─────────────────────────────────────────────────────────
function FarmDetailPanel({ farmId, farmName, onBack }) {
  // Farm data
  const [farm, setFarm] = useState(null);
  const [farmLoading, setFarmLoading] = useState(true);
  const [section, setSection] = useState('soil-test');
  const [showNotify, setShowNotify] = useState(false);

  // Monitoring tab
  const [selectedMonitorCropId, setSelectedMonitorCropId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [cropActionLoading, setCropActionLoading] = useState(false);

  // Soil test mode: 'prediction' when finding a new crop, 'monitoring' when retesting an active crop
  const [soilTestMode, setSoilTestMode] = useState('prediction');
  const [monitoringCropId, setMonitoringCropId] = useState(null);
  const [monitoringCropName, setMonitoringCropName] = useState('');

  // Soil test form
  const emptyForm = { n: '', p: '', k: '', ph: '', moisture: '', temperature: '', humidity: '', rainfall: '' };
  const [formData, setFormData] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [testResult, setTestResult] = useState(null);

  // Sensor + weather
  const [sensorActive, setSensorActive] = useState(false);
  const [sensorHasData, setSensorHasData] = useState(false);
  const [envLoading, setEnvLoading] = useState(false);
  const [envError, setEnvError] = useState('');

  const reloadFarm = () => {
    setFarmLoading(true);
    agronomistApi.getFarmDetail(farmId).then(data => {
      setFarm(data);
      // Auto-select first active (or any) crop when farm loads
      if (data?.crops?.length) {
        setSelectedMonitorCropId(prev =>
          prev && data.crops.some(c => c.id === prev) ? prev
          : (data.crops.find(c => c.status === 'active') || data.crops[0])?.id || null
        );
      }
    }).catch(console.error).finally(() => setFarmLoading(false));
  };
  useEffect(() => { reloadFarm(); }, [farmId]);

  // Sensor polling
  useEffect(() => {
    const poll = async () => {
      try {
        const result = await sensorApi.getLatest();
        const hasData = result.data?.n != null;
        setSensorActive(!!result.data?.active);
        setSensorHasData(hasData);
        if (hasData) {
          setFormData(prev => ({
            ...prev,
            n: String(result.data.n), p: String(result.data.p),
            k: String(result.data.k), ph: String(result.data.ph),
            temperature: String(result.data.temperature),
            humidity: String(result.data.humidity),
            rainfall: String(result.data.rainfall ?? prev.rainfall),
          }));
        }
      } catch { setSensorActive(false); }
    };
    poll();
    const id = setInterval(poll, 3000);
    return () => clearInterval(id);
  }, []);

  const handleInput = e => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: value }));
    if (formErrors[name]) setFormErrors(p => ({ ...p, [name]: null }));
  };

  const validate = () => {
    const errors = {};
    const check = (val, field, min, max) => {
      if (val === '') { errors[field] = 'Required'; return; }
      const n = parseFloat(val);
      if (isNaN(n) || n < min || n > max) errors[field] = `${min}–${max}`;
    };
    check(formData.n, 'n', 0, 500);
    check(formData.p, 'p', 0, 500);
    check(formData.k, 'k', 0, 500);
    check(formData.ph, 'ph', 0, 14);
    check(formData.temperature, 'temperature', -10, 60);
    check(formData.humidity, 'humidity', 0, 100);
    if (soilTestMode === 'monitoring') {
      check(formData.moisture, 'moisture', 0, 100);
    } else {
      check(formData.rainfall, 'rainfall', 0, 1000);
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAutoFetchEnv = () => {
    if (!navigator.geolocation) { setEnvError('Geolocation not supported.'); return; }
    setEnvLoading(true); setEnvError('');
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      try {
        const data = await weatherApi.getWeather(coords.latitude, coords.longitude);
        setFormData(p => ({ ...p, temperature: String(data.temp), humidity: String(data.humidity), rainfall: String(data.rainfall || 100) }));
      } catch { setEnvError('Failed to fetch weather. Enter manually.'); }
      finally { setEnvLoading(false); }
    }, () => { setEnvError('Could not get location.'); setEnvLoading(false); });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitLoading(true); setSubmitError(''); setTestResult(null);
    const storedUser = JSON.parse(localStorage.getItem('planto_user'));
    const BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8080';
    try {
      if (soilTestMode === 'monitoring' && monitoringCropId) {
        // Monitoring mode: submit soil readings → get health score + fertilizer plan
        const res = await fetch(`${BASE}/soil-monitoring/${monitoringCropId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${storedUser?.access_token}` },
          body: JSON.stringify({
            n: parseFloat(formData.n), p: parseFloat(formData.p), k: parseFloat(formData.k),
            ph: parseFloat(formData.ph), moisture: parseFloat(formData.moisture),
            temperature: parseFloat(formData.temperature), humidity: parseFloat(formData.humidity),
          }),
        });
        if (!res.ok) throw new Error(res.status);
        setTestResult({ _mode: 'monitoring', ...(await res.json()) });
      } else {
        // Prediction mode: find best crop, then auto-plant + seed monitoring data
        const res = await fetch(`${PREDICT_URL}?farm_id=${farmId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${storedUser?.access_token}` },
          body: JSON.stringify({
            n: parseFloat(formData.n), p: parseFloat(formData.p), k: parseFloat(formData.k),
            ph: parseFloat(formData.ph), temperature: parseFloat(formData.temperature),
            humidity: parseFloat(formData.humidity), rainfall: parseFloat(formData.rainfall),
          }),
        });
        if (!res.ok) throw new Error(res.status);
        const result = await res.json();

        if (result.crop && result.crop !== 'Rest Land' && storedUser?.id) {
          try {
            const plantRes = await fetch(
              `${BASE}/plant-crop?user_id=${storedUser.id}&crop_name=${encodeURIComponent(result.crop)}&status=pending&farm_id=${farmId}`,
              { method: 'POST', headers: { 'Authorization': `Bearer ${storedUser.access_token}` } }
            );
            if (plantRes.ok) {
              const planted = await plantRes.json();
              await fetch(`${BASE}/soil-monitoring/${planted.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${storedUser.access_token}` },
                body: JSON.stringify({
                  n: parseFloat(formData.n), p: parseFloat(formData.p), k: parseFloat(formData.k),
                  ph: parseFloat(formData.ph), moisture: parseFloat(formData.humidity),
                  temperature: parseFloat(formData.temperature), humidity: parseFloat(formData.humidity),
                }),
              });
            }
          } catch { /* non-critical */ }
        }
        setTestResult(result);
      }
    } catch { setSubmitError('Submission failed. Check your connection and try again.'); }
    finally { setSubmitLoading(false); }
  };

  const handleAcceptCrop = async (cropId) => {
    setCropActionLoading(true);
    try {
      await monitoringApi.updateCropStatus(cropId, 'active');
      reloadFarm();
    } catch (e) { console.error(e); }
    finally { setCropActionLoading(false); }
  };

  const handleDeclineCrop = async (cropId) => {
    setCropActionLoading(true);
    try {
      await monitoringApi.deleteCrop(cropId);
      setSelectedMonitorCropId(null);
      reloadFarm();
      setSection('soil-test');
    } catch (e) { console.error(e); }
    finally { setCropActionLoading(false); }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;
    const cropId = deleteConfirm.id;
    setDeleteConfirm(null);
    setCropActionLoading(true);
    try {
      await monitoringApi.deleteCrop(cropId);
      setSelectedMonitorCropId(null);
      reloadFarm();
    } catch (e) { console.error(e); }
    finally { setCropActionLoading(false); }
  };

  const fields = soilTestMode === 'monitoring'
    ? ['n', 'p', 'k', 'ph', 'moisture', 'temperature', 'humidity']
    : ['n', 'p', 'k', 'ph', 'temperature', 'humidity', 'rainfall'];
  const filledCount = fields.filter(f => formData[f] !== '').length;
  const progress = Math.round((filledCount / fields.length) * 100);

  const TABS = [
    { id: 'soil-test', label: 'Soil Test', icon: <FlaskConical size={14} /> },
    { id: 'monitoring', label: 'Monitor Crops', icon: <BarChart2 size={14} /> },
  ];

  return (
    <div>
      {/* ── Stats strip ── */}
      <div className="stats-strip animate-1">
        <div className="stat-pill-card">
          <div className={`stat-icon-circle ${sensorActive ? 'green-soft' : sensorHasData ? 'blue-soft' : 'orange-soft'}`} style={{ position: 'relative' }}>
            <Activity size={20} color={sensorActive ? '#10b981' : sensorHasData ? '#3b82f6' : '#f59e0b'} />
            {sensorActive && <span style={{ position: 'absolute', top: 2, right: 2, width: 8, height: 8, borderRadius: '50%', background: '#10b981', animation: 'sensor-pulse 1.5s ease-out infinite' }} />}
          </div>
          <div className="stat-data">
            <span className="stat-label">Sensor</span>
            <span className="stat-main" style={{ color: sensorActive ? '#10b981' : sensorHasData ? '#3b82f6' : undefined }}>
              {sensorActive ? 'Live' : sensorHasData ? 'Last Reading' : 'No Signal'}
            </span>
          </div>
        </div>
        <div className="stat-pill-card">
          <div className={`stat-icon-circle ${soilTestMode === 'monitoring' ? 'green-soft' : 'blue-soft'}`}>
            {soilTestMode === 'monitoring' ? <Activity size={20} color="#10b981" /> : <FlaskConical size={20} color="#3b82f6" />}
          </div>
          <div className="stat-data">
            <span className="stat-label">Mode</span>
            <span className="stat-main" style={{ color: soilTestMode === 'monitoring' ? '#10b981' : undefined }}>
              {soilTestMode === 'monitoring' ? 'Monitoring' : 'Prediction'}
            </span>
          </div>
        </div>
        <div className="stat-pill-card">
          <div className={`stat-icon-circle ${filledCount === fields.length ? 'green-soft' : filledCount > 0 ? 'yellow-soft' : ''}`}
            style={filledCount === 0 ? { background: 'rgba(0,0,0,0.04)' } : undefined}>
            <TrendingUp size={20} color={filledCount === fields.length ? '#10b981' : filledCount > 0 ? '#eab308' : '#94a3b8'} />
          </div>
          <div className="stat-data">
            <span className="stat-label">Fields Filled</span>
            <span className="stat-main" style={{ color: filledCount === fields.length ? '#10b981' : filledCount > 0 ? '#d97706' : undefined }}>
              {filledCount}/{fields.length}
            </span>
          </div>
        </div>
        <div className="stat-pill-card">
          <div className="stat-icon-circle" style={{ background: progress === 100 ? 'rgba(16,185,129,0.1)' : progress > 0 ? 'rgba(234,179,8,0.1)' : 'rgba(0,0,0,0.04)' }}>
            <CheckCircle2 size={20} color={progress === 100 ? '#10b981' : progress > 0 ? '#eab308' : '#94a3b8'} />
          </div>
          <div className="stat-data">
            <span className="stat-label">Progress</span>
            <span className="stat-main" style={{ color: progress === 100 ? '#10b981' : progress > 0 ? '#d97706' : undefined }}>{progress}%</span>
            <div style={{ width: '100%', height: 3, background: 'rgba(0,0,0,0.06)', borderRadius: 99, marginTop: '0.2rem', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: progress === 100 ? '#10b981' : '#eab308', borderRadius: 99, transition: 'width 0.3s ease-out' }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Tab bar + action buttons ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', flex: 1, gap: '0.4rem', background: '#f8fafc', borderRadius: '14px', padding: '0.3rem' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setSection(t.id)} style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
              padding: '0.6rem 0.5rem', borderRadius: '10px', border: 'none', cursor: 'pointer',
              fontSize: '0.78rem', fontWeight: 700, transition: 'all 0.15s',
              background: section === t.id ? '#fff' : 'transparent',
              color: section === t.id ? '#0f172a' : '#94a3b8',
              boxShadow: section === t.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
            }}>{t.icon} {t.label}</button>
          ))}
        </div>
        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.6rem 0.9rem', borderRadius: '12px', border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>
          <ArrowLeft size={13} /> All Farms
        </button>
        {farm?.farmer && (
          <button onClick={() => setShowNotify(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.6rem 0.9rem', borderRadius: '12px', border: '1.5px solid #fed7aa', background: '#fff7ed', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700, color: '#d97706', whiteSpace: 'nowrap' }}>
            <Bell size={13} /> Notify
          </button>
        )}
      </div>

      {/* ── Soil Test tab ── */}
      {section === 'soil-test' && (
        <>
          {/* Farm context card (replaces dropdown) */}
          <div style={{ marginBottom: '1.25rem' }} className="animate-2">
            <div style={{ background: '#fff', borderRadius: '16px', border: '1.5px solid #e2e8f0', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div style={{ width: 40, height: 40, borderRadius: '12px', background: 'var(--green-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <MapPin size={18} color="#10b981" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>
                  {soilTestMode === 'monitoring' ? 'Monitoring Soil For' : 'Testing Soil For'}
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                  {soilTestMode === 'monitoring'
                    ? <><span style={{ textTransform: 'capitalize' }}>{monitoringCropName}</span> <span style={{ fontWeight: 500, color: '#64748b', fontSize: '0.85rem' }}>— {farmName || farm?.farm_name}</span></>
                    : farmName || farm?.farm_name || '—'}
                </div>
                {farm?.farmer && (
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.15rem' }}>
                    {[farm.farmer.full_name, farm.farmer.phone, farm.location].filter(Boolean).join(' · ')}
                  </div>
                )}
              </div>
              <div style={{ background: soilTestMode === 'monitoring' ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.1)', color: '#059669', borderRadius: '8px', padding: '0.25rem 0.65rem', fontSize: '0.7rem', fontWeight: 800 }}>
                {soilTestMode === 'monitoring' ? 'Monitoring ✓' : 'Linked ✓'}
              </div>
            </div>
          </div>

          {testResult ? (
            /* ── Result card ── */
            <div className="animate-2">
              {testResult._mode === 'monitoring' ? (
                /* Monitoring result: health score + fertilizer recommendations */
                <>
                  {/* Health Score */}
                  {(() => {
                    const score = Math.round(testResult.health_score || 0);
                    const isGood = score >= 80;
                    const isMid  = score >= 60;
                    const color  = isGood ? '#059669' : isMid ? '#d97706' : '#dc2626';
                    const bg     = isGood ? 'linear-gradient(135deg,#ecfdf5,#d1fae5)' : isMid ? 'linear-gradient(135deg,#fffbeb,#fef3c7)' : 'linear-gradient(135deg,#fef2f2,#fee2e2)';
                    const border = isGood ? '#6ee7b7' : isMid ? '#fcd34d' : '#fca5a5';
                    const label  = isGood ? 'Healthy' : isMid ? 'Moderate' : 'Needs Attention';
                    return (
                      <div style={{ borderRadius: '20px', overflow: 'hidden', border: `2px solid ${border}`, marginBottom: '1rem' }}>
                        <div style={{ background: bg, padding: '1.5rem 1.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div>
                            <div style={{ fontSize: '0.7rem', fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.35rem' }}>Soil Health Score</div>
                            <div style={{ fontSize: '3rem', fontWeight: 900, color: '#0f172a', fontFamily: 'var(--font-heading)', lineHeight: 1 }}>{score}<span style={{ fontSize: '1.4rem' }}>%</span></div>
                            <div style={{ fontSize: '0.85rem', color, fontWeight: 700, marginTop: '0.25rem', textTransform: 'capitalize' }}>{testResult.status || label}</div>
                          </div>
                          <div style={{ width: 72, height: 72, borderRadius: '50%', border: `5px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
                            <Activity size={28} color={color} />
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Fertilizer recommendations */}
                  {testResult.fertilizer_recommendations?.length > 0 && (
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>Fertilizer Recommendations</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        {testResult.fertilizer_recommendations.map((rec, i) => (
                          <div key={i} style={{ background: 'linear-gradient(135deg,#ecfdf5,#d1fae5)', borderRadius: '14px', padding: '1rem 1.25rem', border: '1px solid #a7f3d0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                              <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>{rec.type}</span>
                              <span style={{ background: '#d1fae5', color: '#059669', borderRadius: '8px', padding: '0.2rem 0.65rem', fontSize: '0.75rem', fontWeight: 800 }}>{rec.quantity_kg} kg</span>
                            </div>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#065f46', lineHeight: 1.5 }}>{rec.reason}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {testResult.fertilizer_recommendations?.length === 0 && (
                    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '14px', padding: '1rem 1.25rem', marginBottom: '1rem', fontSize: '0.875rem', color: '#166534', fontWeight: 600 }}>
                      ✓ Soil nutrients are balanced — no fertilizer needed right now.
                    </div>
                  )}

                  {testResult.next_action && (
                    <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '0.85rem 1rem', marginBottom: '1rem', fontSize: '0.8rem', color: '#92400e', lineHeight: 1.5 }}>
                      <strong>Next step:</strong> {testResult.next_action}
                    </div>
                  )}

                  <button
                    onClick={() => { setTestResult(null); setFormData(emptyForm); setSoilTestMode('prediction'); setMonitoringCropId(null); setMonitoringCropName(''); reloadFarm(); setSection('monitoring'); }}
                    style={{ width: '100%', padding: '0.85rem', borderRadius: '14px', border: 'none', background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}
                  >
                    View Updated Monitoring →
                  </button>
                </>
              ) : (
                /* Prediction result: recommended crop */
                <>
                  {(() => {
                    const isRest = testResult.crop === 'Rest Land';
                    const pct = Math.round((testResult.confidence || 0) * 100);
                    return (
                      <div style={{ borderRadius: '20px', overflow: 'hidden', border: `2px solid ${isRest ? '#fca5a5' : '#6ee7b7'}`, marginBottom: '1rem' }}>
                        <div style={{ background: isRest ? 'linear-gradient(135deg,#fef2f2,#fee2e2)' : 'linear-gradient(135deg,#ecfdf5,#d1fae5)', padding: '1.5rem 1.75rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: isRest ? '#dc2626' : '#059669', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                              {isRest ? 'Land Needs Rest' : 'Recommended Crop'}
                            </div>
                            <div style={{ background: isRest ? '#fee2e2' : '#d1fae5', color: isRest ? '#dc2626' : '#059669', borderRadius: '8px', padding: '0.2rem 0.65rem', fontSize: '0.7rem', fontWeight: 800 }}>
                              {pct}% match
                            </div>
                          </div>
                          <div style={{ fontSize: '2rem', fontWeight: 900, color: isRest ? '#dc2626' : '#0f172a', textTransform: 'capitalize', fontFamily: 'var(--font-heading)', lineHeight: 1.1 }}>
                            {testResult.crop}
                          </div>
                        </div>
                        {testResult.advice && (
                          <div style={{ padding: '1rem 1.75rem', background: '#fff', fontSize: '0.85rem', color: '#475569', lineHeight: 1.65 }}>
                            {testResult.advice}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                  <button
                    onClick={() => { setTestResult(null); setFormData(emptyForm); reloadFarm(); setSection('monitoring'); }}
                    style={{ width: '100%', padding: '0.85rem', borderRadius: '14px', border: '1.5px solid #e2e8f0', background: '#fff', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', color: '#475569' }}
                  >
                    View Monitoring Data →
                  </button>
                </>
              )}
            </div>
          ) : (
            /* ── Form ── */
            <form onSubmit={handleSubmit} className="widgets-grid animate-3">

              {/* Left widget: Crop Context (monitoring) or Local Weather (prediction) */}
              {soilTestMode === 'monitoring' ? (
                <div className="widget weather-widget">
                  <div className="weather-bg-circles">
                    <div className="weather-circle" style={{ width: '150px', height: '150px', top: '-20px', left: '-50px' }} />
                    <div className="weather-circle" style={{ width: '80px', height: '80px', bottom: '20px', right: '40px' }} />
                  </div>
                  <div className="weather-content">
                    <div className="widget-header" style={{ marginBottom: '0.75rem' }}>
                      <span className="widget-title" style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Sprout size={20} color="var(--accent-emerald)" /> Crop Context
                      </span>
                      <span style={{ background: 'rgba(16,185,129,0.18)', color: 'var(--accent-emerald)', fontSize: '0.65rem', fontWeight: 800, padding: '0.3rem 0.7rem', borderRadius: '99px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Monitoring
                      </span>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '1rem' }}>
                      <div>
                        <p style={{ fontSize: '0.65rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 0.3rem' }}>Crop</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', fontFamily: 'var(--font-heading)', textTransform: 'capitalize', margin: 0, lineHeight: 1 }}>{monitoringCropName || 'Crop'}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: '0.65rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 0.3rem' }}>Farm</p>
                        <p style={{ fontSize: '0.95rem', fontWeight: 700, color: 'rgba(255,255,255,0.85)', margin: 0 }}>{farmName || farm?.farm_name}</p>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '12px', padding: '0.75rem 1rem', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.7)', margin: 0, lineHeight: 1.5, fontWeight: 500 }}>
                          Enter current soil readings. AI will reassess the health index and update the fertilizer plan for this crop.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="widget weather-widget">
                  <div className="weather-bg-circles">
                    <div className="weather-circle" style={{ width: '150px', height: '150px', top: '-20px', left: '-50px' }} />
                    <div className="weather-circle" style={{ width: '80px', height: '80px', bottom: '20px', right: '40px' }} />
                  </div>
                  <div className="weather-content">
                    <div className="widget-header" style={{ marginBottom: '0.75rem' }}>
                      <span className="widget-title" style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <CloudSun size={20} color="rgba(255,255,255,0.8)" /> Local Weather
                      </span>
                      <button type="button" onClick={handleAutoFetchEnv} className="planto-btn-secondary" disabled={envLoading} style={{ cursor: 'pointer' }}>
                        {envLoading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <MapPin size={14} />}
                        {envLoading ? 'Finding...' : 'Find My Weather'}
                      </button>
                    </div>
                    {envError && <div className="planto-alert alert-error" style={{ marginBottom: '1rem' }}>{envError}</div>}
                    <div className="input-group-grid" style={{ marginTop: 'auto' }}>
                      <div>
                        <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)', marginBottom: '0.2rem', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Temperature (°C)</label>
                        <div className="pro-input-wrapper">
                          <div className="pro-input-icon"><ThermometerSun size={16} /></div>
                          <input type="text" name="temperature" className="pro-input" value={formData.temperature} onChange={handleInput} placeholder="e.g. 24.5" />
                        </div>
                        {formErrors.temperature && <div style={{ color: '#f87171', fontSize: '0.65rem', marginTop: '0.2rem', fontWeight: 600 }}>{formErrors.temperature}</div>}
                      </div>
                      <div>
                        <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)', marginBottom: '0.2rem', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Humidity (%)</label>
                        <div className="pro-input-wrapper">
                          <div className="pro-input-icon"><Droplets size={16} /></div>
                          <input type="text" name="humidity" className="pro-input" value={formData.humidity} onChange={handleInput} placeholder="e.g. 82.0" />
                        </div>
                        {formErrors.humidity && <div style={{ color: '#f87171', fontSize: '0.65rem', marginTop: '0.2rem', fontWeight: 600 }}>{formErrors.humidity}</div>}
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)', marginBottom: '0.2rem', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Rainfall Amount (mm)</label>
                        <div className="pro-input-wrapper">
                          <div className="pro-input-icon"><CloudRain size={16} /></div>
                          <input type="text" name="rainfall" className="pro-input" value={formData.rainfall} onChange={handleInput} placeholder="e.g. 200" />
                        </div>
                        {formErrors.rainfall && <div style={{ color: '#f87171', fontSize: '0.65rem', marginTop: '0.2rem', fontWeight: 600 }}>{formErrors.rainfall}</div>}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Soil Info widget */}
              <div className="widget growth-widget dashboard-card matching-card" style={{ position: 'relative', overflow: 'hidden' }}>
                <div className="widget-header">
                  <span className="widget-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FlaskConical size={20} color="var(--bg-sidebar)" /> Soil Information
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem', fontWeight: 800, color: sensorActive ? '#16a34a' : '#94a3b8' }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: sensorActive ? '#16a34a' : '#94a3b8', display: 'inline-block', boxShadow: sensorActive ? '0 0 6px #16a34a' : 'none' }} />
                      {sensorActive ? 'SENSOR ACTIVE' : 'NO SIGNAL'}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.7rem', fontWeight: 800, color: 'var(--bg-sidebar)', background: 'var(--widget-light-yellow)', padding: '0.4rem 0.8rem', borderRadius: '50px', border: '1px solid rgba(42,67,53,0.1)' }}>
                      <div style={{ width: 6, height: 6, background: '#10b981', borderRadius: '50%', boxShadow: '0 0 6px #10b981' }} />
                      TYPE IN DETAILS
                    </div>
                  </div>
                </div>
                <div className="input-group-grid" style={{ marginTop: '0.2rem' }}>
                  {[
                    ['Nitrogen level (N)', 'n', <Leaf size={16} />, 'e.g. 90'],
                    ['Phosphorus level (P)', 'p', <Sprout size={16} />, 'e.g. 42'],
                    ['Potassium level (K)', 'k', <Droplets size={16} />, 'e.g. 43'],
                    ['Soil Acid Level (pH)', 'ph', <FlaskConical size={16} />, 'e.g. 6.5'],
                  ].map(([label, name, icon, ph]) => (
                    <div key={name}>
                      <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.2rem', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</label>
                      <div className="pro-input-wrapper">
                        <div className="pro-input-icon">{icon}</div>
                        <input type="text" name={name} className="pro-input" value={formData[name]} onChange={handleInput} placeholder={ph} />
                      </div>
                      {formErrors[name] && <div style={{ color: '#ef4444', fontSize: '0.65rem', marginTop: '0.2rem', fontWeight: 600 }}>{formErrors[name]}</div>}
                    </div>
                  ))}
                  {soilTestMode === 'monitoring' && (
                    <>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.2rem', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Soil Moisture (%)</label>
                        <div className="pro-input-wrapper">
                          <div className="pro-input-icon"><Droplets size={16} /></div>
                          <input type="text" name="moisture" className="pro-input" value={formData.moisture} onChange={handleInput} placeholder="e.g. 72" />
                        </div>
                        {formErrors.moisture && <div style={{ color: '#ef4444', fontSize: '0.65rem', marginTop: '0.2rem', fontWeight: 600 }}>{formErrors.moisture}</div>}
                      </div>
                      <div>
                        <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.2rem', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Temperature (°C)</label>
                        <div className="pro-input-wrapper">
                          <div className="pro-input-icon"><ThermometerSun size={16} /></div>
                          <input type="text" name="temperature" className="pro-input" value={formData.temperature} onChange={handleInput} placeholder="e.g. 24.5" />
                        </div>
                        {formErrors.temperature && <div style={{ color: '#ef4444', fontSize: '0.65rem', marginTop: '0.2rem', fontWeight: 600 }}>{formErrors.temperature}</div>}
                      </div>
                      <div>
                        <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.2rem', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Humidity (%)</label>
                        <div className="pro-input-wrapper">
                          <div className="pro-input-icon"><Droplets size={16} /></div>
                          <input type="text" name="humidity" className="pro-input" value={formData.humidity} onChange={handleInput} placeholder="e.g. 65" />
                        </div>
                        {formErrors.humidity && <div style={{ color: '#ef4444', fontSize: '0.65rem', marginTop: '0.2rem', fontWeight: 600 }}>{formErrors.humidity}</div>}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Submit */}
              <div className="execute-row animate-3" style={{ gridColumn: '1 / -1', marginTop: '1rem' }}>
                <button type="submit" className="action-btn-pro" style={{ width: '100%', justifyContent: 'center' }} disabled={submitLoading}>
                  {submitLoading ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Sprout size={18} />}
                  {submitLoading
                    ? (soilTestMode === 'monitoring' ? 'Analyzing Soil...' : 'Checking Your Soil...')
                    : (soilTestMode === 'monitoring' ? 'Submit Monitoring Soil Readings' : 'Find Best Crops Now')}
                </button>
                {submitError && <div className="planto-alert alert-error" style={{ marginTop: '1rem' }}>{submitError}</div>}
              </div>
            </form>
          )}
        </>
      )}

      {/* ── Monitor Crops tab ── */}
      {section === 'monitoring' && (() => {
        const allCrops = farm?.crops || [];
        const monActiveCrops = allCrops.filter(c => c.status === 'active');
        const pendingCrops = allCrops.filter(c => c.status === 'pending');
        const selectedCrop = allCrops.find(c => c.id === selectedMonitorCropId)
          || monActiveCrops[0] || pendingCrops[0] || null;

        if (farmLoading) return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[1, 2].map(i => <div key={i} className="skeleton-card skeleton-shimmer" style={{ height: 140, borderRadius: 16 }} />)}
          </div>
        );

        if (allCrops.length === 0) return (
          <div style={{ textAlign: 'center', padding: '3rem 2rem', background: '#f8fafc', borderRadius: '20px', border: '2px dashed #e2e8f0' }}>
            <BarChart2 size={40} color="#cbd5e1" style={{ marginBottom: '1rem' }} />
            <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>No crops to monitor yet</div>
            <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: '1.25rem' }}>
              Run a soil test to get a crop recommendation, then activate it here.
            </div>
            <button onClick={() => setSection('soil-test')} style={{ padding: '0.7rem 1.5rem', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem' }}>
              Go to Soil Test
            </button>
          </div>
        );

        if (selectedCrop?.status === 'pending') return (
          <div className="dashboard-grid-matching animate-3">
            <div className="dashboard-col">
              <div className="matching-card animate-1" style={{ padding: '3rem 2rem', textAlign: 'center', background: '#f0fdf4', border: '2px solid #bbf7d0' }}>
                <div style={{ background: '#dcfce7', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                  <Sprout size={40} color="#16a34a" />
                </div>
                <h3 style={{ fontFamily: 'var(--font-heading)', color: '#166534', fontSize: '1.8rem', marginBottom: '1rem', fontWeight: 800 }}>
                  Ready to Plant: <span style={{ textTransform: 'capitalize' }}>{selectedCrop.crop_name}</span>
                </h3>
                <p style={{ color: '#15803d', margin: '0 auto 2.5rem', fontSize: '1.05rem', lineHeight: 1.6, maxWidth: '90%' }}>
                  Based on the soil test for <strong>{farmName || farm?.farm_name}</strong>, this is the best crop match. Start growing?
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <button
                    onClick={() => handleAcceptCrop(selectedCrop.id)}
                    disabled={cropActionLoading}
                    style={{ background: '#16a34a', color: 'white', width: '100%', justifyContent: 'center', padding: '1.25rem', fontSize: '1.1rem', border: 'none', borderRadius: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: cropActionLoading ? 'not-allowed' : 'pointer', opacity: cropActionLoading ? 0.7 : 1 }}
                  >
                    {cropActionLoading ? <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> : <Sprout size={20} />}
                    Yes, Start Growing!
                  </button>
                  <button
                    onClick={() => handleDeclineCrop(selectedCrop.id)}
                    disabled={cropActionLoading}
                    style={{ background: 'transparent', border: '2px solid #fca5a5', color: '#ef4444', width: '100%', padding: '1.25rem', fontSize: '1.1rem', borderRadius: '16px', fontWeight: 700, cursor: cropActionLoading ? 'not-allowed' : 'pointer', opacity: cropActionLoading ? 0.7 : 1 }}
                  >
                    No, Retest Soil
                  </button>
                </div>
              </div>
            </div>
            <div className="dashboard-col">
              <div className="matching-card" style={{ padding: '2rem', background: 'var(--bg-sidebar)', color: 'white' }}>
                <div className="card-header-simple"><h3 style={{ color: 'white' }}><Activity size={20} color="var(--accent-emerald)" /> Quick Actions</h3></div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
                  <button className="action-btn-pro" onClick={() => setSection('soil-test')} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', justifyContent: 'center', padding: '1rem' }}>
                    <FlaskConical size={18} /> Run Another Test
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

        const { latestHealth, latestSoil, latestPlan, cropAge } = adaptCropForMonitoring(selectedCrop);

        return (
          <>
            {/* Crop selector pills */}
            {allCrops.length > 1 && (
              <div style={{ display: 'flex', gap: '0.6rem', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>
                {allCrops.map(crop => (
                  <button
                    key={crop.id}
                    onClick={() => setSelectedMonitorCropId(crop.id)}
                    style={{ flexShrink: 0, padding: '0.5rem 1rem', borderRadius: '99px', border: 'none', background: selectedCrop?.id === crop.id ? 'var(--bg-sidebar)' : '#f1f5f9', color: selectedCrop?.id === crop.id ? 'white' : '#475569', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', transition: 'all 0.15s' }}
                  >
                    <Sprout size={13} /> <span style={{ textTransform: 'capitalize' }}>{crop.crop_name}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="dashboard-grid-matching animate-3">
              <div className="dashboard-col">
                {/* Crop hero */}
                <div className="dashboard-card matching-card glass-morph">
                  <div className="card-header-simple" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h3><Sprout size={20} color="var(--accent-emerald)" /> Crop Performance</h3>
                    <button
                      onClick={() => setDeleteConfirm(selectedCrop)}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.85rem', borderRadius: '99px', border: '1.5px solid #fca5a5', background: '#fff1f2', color: '#ef4444', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', flexShrink: 0 }}
                    >
                      <Trash2 size={13} /> Delete Crop
                    </button>
                  </div>
                  <CropHeroCard crop={selectedCrop} cropAge={cropAge} latestHealth={latestHealth} />
                </div>

                {/* Health Alerts */}
                <div className="dashboard-card matching-card">
                  <div className="card-header-simple"><h3><Bell size={20} color="var(--accent-rose)" /> Health Alerts & Risks</h3></div>
                  <div style={{ marginTop: '0.5rem' }}>
                    <SmartAlerts alerts={[]} />
                  </div>
                </div>

                {/* Soil Telemetry */}
                <div className="dashboard-card matching-card">
                  <div className="card-header-simple"><h3><Activity size={20} color="var(--accent-emerald)" /> Soil Telemetry</h3></div>
                  <div style={{ marginTop: '0.5rem' }}>
                    <SoilHealthBars latestSoil={latestSoil} />
                  </div>
                </div>
              </div>

              <div className="dashboard-col">
                {/* Phase Analysis */}
                <div className="dashboard-card matching-card">
                  <div className="card-header-simple"><h3><Sprout size={20} color="var(--accent-emerald)" /> Phase Analysis</h3></div>
                  <div style={{ marginTop: '0.5rem' }}>
                    <FarmStatusCards latestHealth={latestHealth} cropAge={cropAge} />
                  </div>
                </div>

                <RecommendedActions latestPlan={latestPlan} latestSoil={latestSoil} alerts={[]} />
                <FertilizerPlanGrid latestPlan={latestPlan} />
                <SoilRetestCTA
                  onRetest={() => {
                    setSoilTestMode('monitoring');
                    setMonitoringCropId(selectedCrop.id);
                    setMonitoringCropName(selectedCrop.crop_name);
                    setFormData(emptyForm);
                    setTestResult(null);
                    setSection('soil-test');
                  }}
                  cropAge={cropAge}
                />

                <button onClick={reloadFarm} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.7rem', borderRadius: '12px', border: '1.5px solid #e2e8f0', background: '#fff', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', color: '#475569', width: '100%' }}>
                  <Activity size={14} /> Refresh Crop Data
                </button>
              </div>
            </div>

            {/* Delete confirm modal */}
            {deleteConfirm && ReactDOM.createPortal(
              <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', padding: '1rem' }}>
                <div style={{ background: '#fff', borderRadius: '24px', width: '100%', maxWidth: '420px', padding: '2rem 1.5rem 1.5rem', boxShadow: '0 24px 60px rgba(0,0,0,0.2)', animation: 'slideUpModal 0.22s cubic-bezier(0.34,1.56,0.64,1)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', marginBottom: '1.75rem' }}>
                    <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#fff1f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Trash2 size={24} color="#e11d48" />
                    </div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', fontFamily: 'var(--font-heading)' }}>
                      Delete <span style={{ textTransform: 'capitalize' }}>{deleteConfirm.crop_name}</span>?
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', textAlign: 'center', fontFamily: 'var(--font-body)', lineHeight: 1.6 }}>
                      This crop will be removed from {farmName || farm?.farm_name}. A new soil test can add it back.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button onClick={() => setDeleteConfirm(null)} style={{ flex: 1, padding: '0.85rem', borderRadius: '14px', border: '2px solid #e2e8f0', background: '#fff', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', color: '#64748b', fontFamily: 'var(--font-body)' }}>
                      Cancel
                    </button>
                    <button onClick={handleConfirmDelete} style={{ flex: 1, padding: '0.85rem', borderRadius: '14px', border: 'none', background: 'linear-gradient(135deg, #e11d48, #be123c)', color: '#fff', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                      Yes, Delete
                    </button>
                  </div>
                </div>
              </div>,
              document.body
            )}
          </>
        );
      })()}

      {showNotify && farm?.farmer && (
        <NotifyFarmerModal farmer={farm.farmer} onClose={() => setShowNotify(false)} />
      )}
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function AgronomistDashboard({ user, setHeaderActions }) {
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedFarmId, setSelectedFarmId] = useState(null);

  const loadFarms = async () => {
    try {
      setLoading(true);
      const data = await agronomistApi.getFarms();
      setFarms(data || []);
    } catch (err) {
      console.error('Failed to load farms:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadFarms(); }, []);

  useEffect(() => {
    if (setHeaderActions) setHeaderActions(null);
  }, [setHeaderActions]);

  const totalActiveCrops = farms.reduce((s, f) => s + (f.active_crops || 0), 0);
  const avgHealth = farms.filter(f => f.health_score).length
    ? Math.round(farms.filter(f => f.health_score).reduce((s, f) => s + f.health_score, 0) / farms.filter(f => f.health_score).length)
    : null;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.full_name?.split(' ')[0] || 'Agronomist';

  // If a farm is selected, show detail panel
  if (selectedFarmId) {
    const selectedFarm = farms.find(f => f.farm_id === selectedFarmId);
    const hc = healthColor(selectedFarm?.health_score);
    return (
      <div className="dashboard-view animate-2" style={{ paddingTop: 0 }}>
        <div className="pro-welcome-banner farmer-banner">
          <div className="banner-content">
            <h2>{selectedFarm?.farm_name || 'Farm Detail'}</h2>
            <p>
              {[
                selectedFarm?.farmer_name,
                selectedFarm?.location,
                selectedFarm?.farm_size,
                selectedFarm?.active_crops != null
                  ? `${selectedFarm.active_crops} active crop${selectedFarm.active_crops !== 1 ? 's' : ''}`
                  : null,
              ].filter(Boolean).join(' · ')}
            </p>
            {selectedFarm?.health_score && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.5rem', background: 'rgba(255,255,255,0.15)', borderRadius: '8px', padding: '0.3rem 0.75rem', fontSize: '0.8rem', fontWeight: 700 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: hc.text, display: 'inline-block' }} />
                {Math.round(selectedFarm.health_score)}% · {hc.label}
              </div>
            )}
          </div>
          <div className="banner-icon"><Sprout size={120} color="rgba(255,255,255,0.1)" /></div>
        </div>
        <FarmDetailPanel farmId={selectedFarmId} farmName={selectedFarm?.farm_name} onBack={() => setSelectedFarmId(null)} />
      </div>
    );
  }

  return (
    <div className="dashboard-view animate-2" style={{ paddingTop: 0 }}>
      {/* Banner */}
      <div className="pro-welcome-banner farmer-banner">
        <div className="banner-content">
          <h2>{greeting}, {firstName}</h2>
          <p>
            {loading ? 'Loading your managed farms...'
              : farms.length === 0 ? 'No farms yet. Register your first farmer to get started.'
              : `You are managing ${farms.length} farm${farms.length === 1 ? '' : 's'} across ${farms.length} farmer${farms.length === 1 ? '' : 's'}.`}
          </p>
        </div>
        <div className="banner-icon"><Users size={120} color="rgba(255,255,255,0.1)" /></div>
      </div>

      {/* Stats strip */}
      <div className="stats-strip animate-1">
        <div className="stat-pill-card">
          <div className="stat-icon-circle green-soft"><Users size={20} color="#10b981" /></div>
          <div className="stat-data">
            <span className="stat-label">Managed Farms</span>
            <span className="stat-main">{loading ? '—' : farms.length}</span>
          </div>
        </div>
        <div className="stat-pill-card">
          <div className="stat-icon-circle green-soft"><Sprout size={20} color="#10b981" /></div>
          <div className="stat-data">
            <span className="stat-label">Active Crops</span>
            <span className="stat-main">{loading ? '—' : totalActiveCrops}</span>
          </div>
        </div>
        <div className="stat-pill-card">
          <div className="stat-icon-circle blue-soft"><Activity size={20} color="#3b82f6" /></div>
          <div className="stat-data">
            <span className="stat-label">Avg Health</span>
            <span className="stat-main">{loading ? '—' : avgHealth ? `${avgHealth}%` : 'No data'}</span>
          </div>
        </div>
        <div className="stat-pill-card">
          <div className="stat-icon-circle orange-soft"><TrendingUp size={20} color="#f59e0b" /></div>
          <div className="stat-data">
            <span className="stat-label">Needing Attention</span>
            <span className="stat-main">{loading ? '—' : farms.filter(f => f.health_score && f.health_score < 60).length}</span>
          </div>
        </div>
      </div>

      {/* Farm grid */}
      <div className="animate-3">
        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
            All Managed Farms
          </h3>
          <button
            onClick={() => setShowAdd(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.1rem', borderRadius: '99px', border: 'none', background: 'var(--bg-sidebar)', color: '#fff', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}
          >
            <Plus size={15} /> Add Farmer
          </button>
        </div>

        {/* Loading skeletons */}
        {loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {[1, 2, 3].map(i => <div key={i} className="skeleton-card skeleton-shimmer" style={{ height: 160, borderRadius: 20 }} />)}
          </div>
        )}

        {/* Empty state */}
        {!loading && farms.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', background: '#f8fafc', borderRadius: '20px', border: '2px dashed #e2e8f0' }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--green-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
              <Users size={28} color="#10b981" />
            </div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>No Farmers Registered Yet</div>
            <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              Register farmers you manage on their behalf. They don't need to create an account.
            </div>
            <button
              onClick={() => setShowAdd(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.75rem 1.5rem', borderRadius: '12px', border: 'none', background: 'var(--bg-sidebar)', color: '#fff', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}
            >
              <Plus size={16} /> Register First Farmer
            </button>
          </div>
        )}

        {/* Farm cards grid */}
        {!loading && farms.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {farms.map(farm => {
              const hc = healthColor(farm.health_score);
              return (
                <div
                  key={farm.farm_id}
                  onClick={() => setSelectedFarmId(farm.farm_id)}
                  className="dashboard-card matching-card"
                  style={{ cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s', padding: '1.25rem' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
                >
                  {/* Card header */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <div style={{ width: 40, height: 40, borderRadius: '12px', background: 'var(--green-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Sprout size={20} color="#10b981" />
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem', lineHeight: 1.2 }}>{farm.farm_name}</div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.15rem' }}>{farm.farm_size || 'Size not set'}</div>
                      </div>
                    </div>
                    <ChevronRight size={16} color="#cbd5e1" />
                  </div>

                  {/* Farmer info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <Users size={13} color="#94a3b8" />
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>{farm.farmer_name || 'Unknown farmer'}</span>
                    {farm.farmer_phone && (
                      <>
                        <span style={{ color: '#e2e8f0' }}>·</span>
                        <Phone size={11} color="#94a3b8" />
                        <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{farm.farmer_phone}</span>
                      </>
                    )}
                  </div>

                  {farm.location && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.75rem' }}>
                      <MapPin size={12} color="#94a3b8" />
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{farm.location}</span>
                    </div>
                  )}

                  {/* Footer stats */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', align: 'center', gap: '0.35rem' }}>
                      <Sprout size={13} color="#10b981" />
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569' }}>
                        {farm.active_crops || 0} active crop{farm.active_crops !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div style={{ background: hc.bg, color: hc.text, borderRadius: '6px', padding: '0.2rem 0.55rem', fontSize: '0.68rem', fontWeight: 700 }}>
                      {farm.health_score ? `${Math.round(farm.health_score)}% · ${hc.label}` : hc.label}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Add farm card */}
            <div
              onClick={() => setShowAdd(true)}
              style={{ minHeight: 160, border: '2px dashed #e2e8f0', borderRadius: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', transition: 'border-color 0.15s, background 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#10b981'; e.currentTarget.style.background = 'rgba(16,185,129,0.03)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = ''; }}
            >
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--green-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Plus size={22} color="#10b981" />
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Add Farmer</div>
            </div>
          </div>
        )}
      </div>

      {showAdd && (
        <AddFarmerModal
          onClose={() => setShowAdd(false)}
          onSaved={() => { setShowAdd(false); loadFarms(); }}
        />
      )}
    </div>
  );
}

const labelStyle = {
  display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569',
  textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem',
};
const inputStyle = {
  width: '100%', padding: '0.65rem 0.9rem', borderRadius: '10px',
  border: '1.5px solid #e2e8f0', fontSize: '0.875rem', color: '#0f172a',
  outline: 'none', boxSizing: 'border-box', fontFamily: 'var(--font-body)',
  background: '#fff',
};
