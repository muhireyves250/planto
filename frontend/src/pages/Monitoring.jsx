import { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { AlertTriangle, Sprout, Activity, FlaskConical, Zap, Clock, Bell, CheckCircle2, MapPin, Droplets, Trash2 } from 'lucide-react';
import { monitoringApi } from '../api/monitoringApi';
import { alertApi } from '../api/farmApi';
import { getCached, setCached } from '../api/cache';

import CropHeroCard from '../components/monitoring/CropHeroCard';
import FarmStatusCards from '../components/monitoring/FarmStatusCards';
import RecommendedActions from '../components/monitoring/RecommendedActions';
import FertilizerPlanGrid from '../components/monitoring/FertilizerPlanGrid';
import SoilHealthBars from '../components/monitoring/SoilHealthBars';
import SoilRetestCTA from '../components/monitoring/SoilRetestCTA';
import SmartAlerts from '../components/monitoring/SmartAlerts';

const Monitoring = ({ user, setActiveTab, setSoilTestParams, setHeaderActions }) => {
  const [plantedCrops, setPlantedCrops] = useState([]);
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [contentKey, setContentKey] = useState(0);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // crop object to confirm delete

  const loadData = async () => {
    try {
      setError(null);
      const cacheKey = `monitoring_${user?.id}`;

      const cached = user?.id ? getCached(cacheKey) : null;
      if (cached) {
        setPlantedCrops(cached.crops);
        setAlerts(cached.alerts);
        setSelectedCrop(prev => {
          if (prev) return cached.crops.find(c => c.id === prev.id) || cached.crops[0] || null;
          return cached.crops[0] || null;
        });
        setLoading(false);
      } else {
        setLoading(true);
      }

      let cropsData = [];
      let alertsData = [];

      if (user?.id) {
        [cropsData, alertsData] = await Promise.all([
          monitoringApi.getMyCrops(user.id),
          alertApi.getAlerts()
        ]);
        setCached(cacheKey, { crops: cropsData, alerts: alertsData });
      } else {
        cropsData = JSON.parse(localStorage.getItem('planto_guest_crops')) || [];
      }

      setPlantedCrops(cropsData);
      setAlerts(alertsData);

      if (cropsData.length > 0) {
        setSelectedCrop(prev => {
          if (prev) {
            const updated = cropsData.find(c => c.id === prev.id);
            return updated || cropsData[0];
          }
          return cropsData[0];
        });
      } else {
        setSelectedCrop(null);
      }
    } catch (err) {
      console.error('Failed to load monitoring data:', err);
      if (user?.id) setError('Could not retrieve farm data. Please check connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [user?.id]);

  useEffect(() => {
    if (!loading) setContentKey(k => k + 1);
  }, [loading]);

  useEffect(() => {
    if (setHeaderActions) setHeaderActions(null);
  }, [setHeaderActions]);

  const handleAcceptCrop = async (plantId) => {
    try {
      setLoading(true);
      if (user?.id) {
        await monitoringApi.updateCropStatus(plantId, 'active');
      } else {
        const guestCrops = JSON.parse(localStorage.getItem('planto_guest_crops')) || [];
        localStorage.setItem('planto_guest_crops', JSON.stringify(
          guestCrops.map(c => c.id === plantId ? { ...c, status: 'active' } : c)
        ));
      }
      await loadData();
    } catch (err) {
      console.error('Failed to accept crop:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeclineCrop = async (plantId) => {
    try {
      setLoading(true);
      if (user?.id) {
        await monitoringApi.deleteCrop(plantId);
      } else {
        const guestCrops = JSON.parse(localStorage.getItem('planto_guest_crops')) || [];
        localStorage.setItem('planto_guest_crops', JSON.stringify(
          guestCrops.filter(c => c.id !== plantId)
        ));
      }
      setActiveTab('soil-test');
      if (setSoilTestParams) setSoilTestParams({ mode: 'prediction', plantId: null, cropName: '' });
      await loadData();
    } catch (err) {
      console.error('Failed to decline crop:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;
    const plantId = deleteConfirm.id;
    setDeleteConfirm(null);
    try {
      setLoading(true);
      if (user?.id) {
        await monitoringApi.deleteCrop(plantId);
      } else {
        const guestCrops = JSON.parse(localStorage.getItem('planto_guest_crops')) || [];
        localStorage.setItem('planto_guest_crops', JSON.stringify(
          guestCrops.filter(c => c.id !== plantId)
        ));
      }
      if (setSoilTestParams) setSoilTestParams({ mode: 'prediction', plantId: null, cropName: '' });
      await loadData();
    } catch (err) {
      console.error('Failed to delete crop:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckSoilAgain = (phase) => {
    if (!selectedCrop) return;
    if (setSoilTestParams) setSoilTestParams({ mode: 'monitoring', plantId: selectedCrop.id, cropName: selectedCrop.crop_name, growthStage: phase });
    setActiveTab('soil-test');
  };

  const latestSoil = selectedCrop?.monitoring_data?.length
    ? [...selectedCrop.monitoring_data].sort((a, b) => new Date(b.recorded_at) - new Date(a.recorded_at))[0]
    : null;

  const latestPlan = selectedCrop?.fertilizer_plans?.length
    ? [...selectedCrop.fertilizer_plans].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
    : null;

  const latestHealth = selectedCrop?.health_history?.length
    ? [...selectedCrop.health_history].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
    : null;

  const cropAge = selectedCrop
    ? Math.max(0, Math.floor((new Date() - new Date(selectedCrop.planting_date)) / (1000 * 60 * 60 * 24)))
    : 0;

  const activeCrops = plantedCrops.filter(c => c.status === 'active').length;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.full_name?.split(' ')[0] || 'Farmer';
  const monitoringSubtitle = loading
    ? 'Loading your crop data...'
    : activeCrops === 0
    ? 'No active crops yet. Run a soil test to get your first recommendation.'
    : `You have ${activeCrops} active crop${activeCrops === 1 ? '' : 's'}. Here's your health overview for today.`;
  const healthScore = latestHealth?.health_score ?? '--';
  const activeAlerts = alerts.length;

  // ── derived health values (used in both mobile and desktop) ──
  const healthNum = typeof healthScore === 'number' ? healthScore : 0;
  const healthColor = healthNum >= 80 ? '#10b981' : healthNum >= 60 ? '#f59e0b' : '#ef4444';
  const healthBg    = healthNum >= 80 ? '#dcfce7'  : healthNum >= 60 ? '#fef3c7'  : '#fee2e2';
  const healthLabel = healthNum >= 80 ? 'Healthy'  : healthNum >= 60 ? 'Moderate' : 'Needs Attention';

  const stageFromDays = (d) => d <= 14 ? 'Germination' : d <= 45 ? 'Vegetative' : d <= 90 ? 'Flowering' : 'Maturity';
  const stage = latestHealth?.stage || stageFromDays(cropAge ?? 0);

  const renderMobileContent = () => {
    if (loading) return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {[1,2,3].map(i => (
          <div key={i} className="skeleton-card skeleton-shimmer" style={{ height: 90, borderRadius: 20 }} />
        ))}
      </div>
    );

    if (error) return (
      <div style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
        <AlertTriangle size={40} color="#e11d48" style={{ margin: '0 auto 1rem', display: 'block' }} />
        <p style={{ color: '#9f1239', fontWeight: 700, marginBottom: '1rem' }}>Couldn't load farm data</p>
        <button onClick={loadData} style={{ background: '#fee2e2', border: 'none', color: '#9f1239', padding: '0.75rem 1.5rem', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}>Try Again</button>
      </div>
    );

    if (!selectedCrop) return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {/* Empty state hero */}
        <div style={{ background: 'linear-gradient(135deg,#1e362a 0%,#2d5240 100%)', borderRadius: '20px', padding: '1.5rem', color: '#fff', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <Sprout size={28} color="#fff" />
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.4rem' }}>No Active Crops</div>
          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', marginBottom: '1.25rem' }}>Test your soil to get your first crop recommendation.</div>
          <button onClick={() => setActiveTab('soil-test')} style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: '12px', padding: '0.75rem 1.5rem', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <FlaskConical size={16} /> Test Soil Now
          </button>
        </div>
      </div>
    );

    if (selectedCrop.status === 'pending') return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ background: '#f0fdf4', border: '2px solid #bbf7d0', borderRadius: '20px', padding: '1.5rem', textAlign: 'center' }}>
          <div style={{ background: '#dcfce7', width: 64, height: 64, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <Sprout size={32} color="#16a34a" />
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#166534', marginBottom: '0.5rem', textTransform: 'capitalize' }}>Plant {selectedCrop.crop_name}?</div>
          <p style={{ color: '#15803d', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '1.25rem' }}>Your soil test is ready. Start growing this crop now?</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button onClick={() => handleAcceptCrop(selectedCrop.id)} style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: '14px', padding: '0.9rem', fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <Sprout size={18} /> Yes, Start Growing
            </button>
            <button onClick={() => handleDeclineCrop(selectedCrop.id)} style={{ background: 'transparent', border: '2px solid #fca5a5', color: '#ef4444', borderRadius: '14px', padding: '0.9rem', fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem' }}>
              No, Test Again
            </button>
          </div>
        </div>
      </div>
    );

    // Active crop — cards only (hero is fixed above)
    return (
      <>
        {/* ── Alerts ── */}
        <div style={{ background: '#fff', borderRadius: '20px', padding: '1.1rem', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Bell size={15} color="#ef4444" /> Health Alerts
          </div>
          <SmartAlerts alerts={alerts} />
        </div>

        {/* ── Soil Telemetry ── */}
        <div style={{ background: '#fff', borderRadius: '20px', padding: '1.1rem', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Activity size={15} color="#3b82f6" /> Soil Telemetry
          </div>
          <SoilHealthBars latestSoil={latestSoil} />
        </div>

        {/* ── Actions + Fertilizer ── */}
        <div style={{ background: '#fff', borderRadius: '20px', padding: '1.1rem', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Zap size={15} color="#10b981" /> What To Do Today
          </div>
          <RecommendedActions latestPlan={latestPlan} latestSoil={latestSoil} alerts={alerts} />
        </div>

        {/* ── Fertilizer Plan ── */}
        <div style={{ background: '#fff', borderRadius: '20px', padding: '1.1rem', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <FlaskConical size={15} color="#8b5cf6" /> Fertilizer Plan
          </div>
          <FertilizerPlanGrid latestPlan={latestPlan} />
        </div>

        {/* ── Retest CTA ── */}
        <SoilRetestCTA onRetest={handleCheckSoilAgain} cropAge={cropAge} />
      </>
    );
  };

  const renderMainContent = () => {
    if (loading) {
      return (
        <div className="dashboard-grid-matching animate-3">
          <div className="dashboard-col">
            {/* Skeleton for Crop Hero / Header */}
            <div className="dashboard-card matching-card skeleton-card skeleton-shimmer" style={{ minHeight: '180px' }}>
              <div className="skeleton-title" style={{ width: '60%', marginBottom: '1.5rem' }}></div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="skeleton-circle" style={{ width: '60px', height: '60px' }}></div>
                <div className="skeleton-data" style={{ flex: 1, justifyContent: 'center' }}>
                  <div className="skeleton-line-lg" style={{ width: '80%', height: '24px' }}></div>
                  <div className="skeleton-line-sm" style={{ width: '40%', marginTop: '8px' }}></div>
                </div>
              </div>
            </div>
            
            {/* Skeleton for Alerts / Status */}
            <div className="dashboard-card matching-card skeleton-card skeleton-shimmer" style={{ minHeight: '220px' }}>
              <div className="skeleton-title" style={{ width: '40%', marginBottom: '1rem' }}></div>
              <div className="skeleton-table-header" style={{ marginBottom: '1.5rem' }}></div>
              {[1, 2, 3].map(i => (
                <div key={i} className="skeleton-table-row" style={{ height: '40px', marginBottom: '0.75rem' }}></div>
              ))}
            </div>
          </div>
          
          <div className="dashboard-col">
            {/* Skeleton for Actions */}
            <div className="dashboard-card matching-card skeleton-card skeleton-shimmer" style={{ minHeight: '200px' }}>
              <div className="skeleton-title" style={{ width: '50%', marginBottom: '1.5rem' }}></div>
              <div className="skeleton-table-row" style={{ height: '50px', borderRadius: '12px', marginBottom: '1rem' }}></div>
              <div className="skeleton-table-row" style={{ height: '50px', borderRadius: '12px' }}></div>
            </div>
            
            {/* Skeleton for Telemetry / Map */}
            <div className="dashboard-card matching-card skeleton-card skeleton-shimmer" style={{ flex: 1, minHeight: '240px' }}>
              <div className="skeleton-title" style={{ width: '40%', marginBottom: '1.5rem' }}></div>
              <div style={{ height: '140px', background: '#f1f5f9', borderRadius: '12px', marginBottom: '1rem' }}></div>
              <div className="skeleton-line-lg" style={{ width: '100%' }}></div>
            </div>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="dashboard-grid-matching animate-3">
          <div className="dashboard-col">
            <div className="matching-card" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
              <AlertTriangle size={48} color="#e11d48" style={{ margin: '0 auto 1.5rem', display: 'block' }} />
              <h3 style={{ color: '#9f1239', marginBottom: '0.75rem', fontSize: '1.25rem', fontWeight: 700 }}>Couldn't load farm data</h3>
              <p style={{ color: '#be123c', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>Check your connection and try again.</p>
              <button onClick={loadData} className="planto-btn-secondary" style={{ background: '#ffe4e6', border: 'none', color: '#9f1239', padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                Try Again
              </button>
            </div>
          </div>
          <div className="dashboard-col">
            <div className="matching-card" style={{ minHeight: '200px' }} />
          </div>
        </div>
      );
    }

    if (!selectedCrop) {
      return (
        <div className="dashboard-grid-matching animate-3">
          <div className="dashboard-col">
            {/* Crop status card — mirrors home page "Farm Warnings" card style */}
            <div className="dashboard-card matching-card">
              <div className="card-header-simple"><h3><Bell size={20} color="var(--accent-rose)" /> Crop Health Status</h3></div>
              <div style={{ marginTop: '0.5rem' }}>
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  padding: '2.25rem 1.5rem', background: 'var(--green-soft)', borderRadius: '16px',
                  border: '1px dashed rgba(16, 185, 129, 0.25)', textAlign: 'center', gap: '0.75rem'
                }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' }}>
                    <CheckCircle2 size={22} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--bg-sidebar)', marginBottom: '0.2rem' }}>No Active Crops</h4>
                    <p style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>Start by testing your soil to get a crop recommendation.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Monitoring overview card — mirrors home page "Weather Today" card style */}
            <div className="dashboard-card matching-card glass-morph">
              <div className="card-header-simple"><h3><Activity size={20} color="var(--accent-blue)" /> Monitoring Overview</h3></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2.8rem', fontWeight: 800, color: 'var(--bg-sidebar)', letterSpacing: '-2px' }}>0</div>
                  <div className="badge-mini-text" style={{ background: 'var(--green-soft)', color: 'var(--accent-emerald)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800 }}>CROPS</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div className="weather-pill"><Sprout size={16} color="var(--accent-emerald)" /><div className="pill-text"><span className="pill-label">Planted</span><span className="pill-val">0 Crops</span></div></div>
                  <div className="weather-pill"><AlertTriangle size={16} color="#f59e0b" /><div className="pill-text"><span className="pill-label">Alerts</span><span className="pill-val">None</span></div></div>
                </div>
              </div>
            </div>
          </div>

          <div className="dashboard-col">
            {/* Quick actions card — identical structure to home page dark card */}
            <div className="dashboard-card matching-card" style={{ background: 'var(--bg-sidebar)', color: 'white' }}>
              <div className="card-header-simple"><h3 style={{ color: 'white' }}><Zap size={20} color="var(--accent-emerald)" /> Things You Can Do</h3></div>
              <div className="actions-list-simple" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
                <button className="action-btn-pro" onClick={() => setActiveTab('soil-test')} style={{ background: 'var(--accent-emerald)', color: 'var(--bg-sidebar)', border: 'none', justifyContent: 'center', padding: '1rem' }}>
                  <FlaskConical size={18} /> Test Your Soil
                </button>
                <button className="action-btn-pro" onClick={() => setActiveTab('crop-status')} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', justifyContent: 'center', padding: '1rem' }}>
                  <Activity size={18} /> View Crop History
                </button>
              </div>
            </div>

            {/* Field readiness card — mirrors home page "My Land Map" card */}
            <div className="dashboard-card matching-card" style={{ flex: 1 }}>
              <div className="card-header-simple"><h3><MapPin size={20} color="var(--accent-emerald)" /> Field Readiness</h3></div>
              <div className="isometric-map-container" style={{ background: 'var(--green-soft)', borderRadius: '16px', border: '1px solid rgba(16, 185, 129, 0.1)', overflow: 'hidden' }}>
                <div className="isometric-grid">
                  <div className="iso-plot plot-1"></div>
                  <div className="iso-plot plot-2"></div>
                  <div className="iso-plot plot-3"></div>
                  <div className="iso-plot plot-4"></div>
                  <div className="iso-plot plot-5"></div>
                  <div className="iso-plot plot-6"></div>
                  <div className="iso-pin pin-1"><Droplets size={12} fill="white" /></div>
                  <div className="iso-pin pin-2"><Droplets size={12} fill="white" /></div>
                  <div className="iso-pin pin-3"><Droplets size={12} fill="white" /></div>
                </div>
              </div>
              <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>Fields Ready to Plant</div>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>100% Available</div>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'rgba(0,0,0,0.05)', borderRadius: '10px', marginTop: '0.5rem' }}>
                <div style={{ width: '100%', height: '100%', background: 'var(--accent-emerald)', borderRadius: '10px', boxShadow: '0 0 10px rgba(16, 185, 129, 0.3)' }}></div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (selectedCrop.status === 'pending') {
      return (
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
                Based on your recent soil test, this is the perfect crop for your field. Would you like to start growing it now?
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <button onClick={() => handleAcceptCrop(selectedCrop.id)} style={{ background: '#16a34a', color: 'white', width: '100%', justifyContent: 'center', padding: '1.25rem', fontSize: '1.1rem', border: 'none', borderRadius: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <Sprout size={24} /> Yes, Start Growing!
                </button>
                <button onClick={() => handleDeclineCrop(selectedCrop.id)} style={{ background: 'transparent', border: '2px solid #fca5a5', color: '#ef4444', width: '100%', justifyContent: 'center', padding: '1.25rem', fontSize: '1.1rem', borderRadius: '16px', fontWeight: 700, cursor: 'pointer' }}>
                  No, I'll test again
                </button>
              </div>
            </div>
          </div>
          <div className="dashboard-col">
            <div className="matching-card" style={{ padding: '2rem', background: 'var(--bg-sidebar)', color: 'white' }}>
              <div className="card-header-simple"><h3 style={{ color: 'white' }}><Zap size={20} color="var(--accent-emerald)" /> Quick Actions</h3></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
                <button className="action-btn-pro" onClick={() => setActiveTab('soil-test')} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', justifyContent: 'center', padding: '1rem' }}>
                  <FlaskConical size={18} /> Run Another Test
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Active crop — home page layout style
    return (
      <div className="dashboard-grid-matching animate-3">
        <div className="dashboard-col">
          {/* Crop selector — shown when multiple crops planted */}
          {/* Crop selector — shown when multiple crops planted */}
          {plantedCrops.length > 1 && (
            <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '1rem', marginBottom: '0.5rem' }}>
              {plantedCrops.map(crop => (
                <div key={crop.id} onClick={() => setSelectedCrop(crop)} style={{ padding: '0.6rem 1.1rem', borderRadius: '99px', background: selectedCrop?.id === crop.id ? 'var(--bg-sidebar)' : '#f1f5f9', color: selectedCrop?.id === crop.id ? 'white' : '#475569', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', flexShrink: 0 }}>
                  <Sprout size={14} /> <span style={{ textTransform: 'capitalize' }}>{crop.crop_name}</span>
                </div>
              ))}
            </div>
          )}

          {/* Crop hero — mirrors "Weather Today" glass card */}
          <div className="dashboard-card matching-card glass-morph">
            <div className="card-header-simple" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3><Sprout size={20} color="var(--accent-emerald)" /> Crop Performance</h3>
              <button
                onClick={() => setDeleteConfirm(selectedCrop)}
                title="Delete this crop"
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.85rem', borderRadius: '99px', border: '1.5px solid #fca5a5', background: '#fff1f2', color: '#ef4444', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', flexShrink: 0 }}
              >
                <Trash2 size={13} /> Delete Crop
              </button>
            </div>
            <CropHeroCard crop={selectedCrop} cropAge={cropAge} latestHealth={latestHealth} />
          </div>

          {/* Alerts / Risks — mirrors "Farm Warnings" card */}
          <div className="dashboard-card matching-card">
            <div className="card-header-simple"><h3><Bell size={20} color="var(--accent-rose)" /> Health Alerts & Risks</h3></div>
            <div style={{ marginTop: '0.5rem' }}>
              <SmartAlerts alerts={alerts} />
            </div>
          </div>

          {/* Soil telemetry */}
          <div className="dashboard-card matching-card">
            <div className="card-header-simple">
              <h3><Activity size={20} color="var(--accent-emerald)" /> Soil Telemetry</h3>
            </div>
            <div style={{ marginTop: '0.5rem' }}>
              <SoilHealthBars latestSoil={latestSoil} />
            </div>
          </div>
        </div>

        <div className="dashboard-col">
          {/* Farm Status */}
          <div className="dashboard-card matching-card">
            <div className="card-header-simple"><h3><Sprout size={20} color="var(--accent-emerald)" /> Phase Analysis</h3></div>
            <div style={{ marginTop: '0.5rem' }}>
              <FarmStatusCards latestHealth={latestHealth} cropAge={cropAge} />
            </div>
          </div>

          {/* Recommendations & Fertilizer */}
          <RecommendedActions latestPlan={latestPlan} latestSoil={latestSoil} alerts={alerts} />
          <FertilizerPlanGrid latestPlan={latestPlan} />
          <SoilRetestCTA onRetest={handleCheckSoilAgain} cropAge={cropAge} />
        </div>
      </div>
    );
  };

  const isMobile = window.innerWidth <= 768;

  if (isMobile) {
    // Fixed hero — always pinned regardless of scroll position
    const heroContent = !loading && selectedCrop && selectedCrop.status === 'active' ? (
      <div style={{ background: 'linear-gradient(135deg,#1e362a 0%,#2d5240 100%)', padding: '1rem 1rem 1rem' }}>
        {plantedCrops.length > 1 && (
          <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', scrollbarWidth: 'none', marginBottom: '0.6rem' }}>
            {plantedCrops.map(crop => (
              <button key={crop.id} onClick={() => setSelectedCrop(crop)} style={{ flexShrink: 0, padding: '0.25rem 0.75rem', borderRadius: '99px', border: 'none', background: selectedCrop?.id === crop.id ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)', color: '#fff', fontWeight: 700, fontSize: '0.72rem', cursor: 'pointer' }}>
                {crop.crop_name}
              </button>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
          <div>
            <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.55)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.2rem' }}>Currently Growing</div>
            <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#fff', textTransform: 'capitalize', letterSpacing: '-0.5px', lineHeight: 1.1 }}>{selectedCrop.crop_name}</div>
            <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.65)', marginTop: '0.2rem' }}>{stage} phase · {cropAge} days</div>
          </div>
          <div style={{ background: healthBg, color: healthColor, borderRadius: '99px', padding: '0.28rem 0.8rem', fontSize: '0.65rem', fontWeight: 800, flexShrink: 0 }}>{healthLabel.toUpperCase()}</div>
        </div>
        <div style={{ display: 'flex', gap: '0.45rem', marginBottom: '0.5rem' }}>
          {[
            { val: `${healthScore}${healthScore !== '--' ? '%' : ''}`, lbl: 'Health' },
            { val: cropAge, lbl: 'Days' },
            { val: alerts.length, lbl: 'Alerts' },
            { val: activeCrops, lbl: 'Crops' },
          ].map(({ val, lbl }) => (
            <div key={lbl} style={{ flex: 1, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', borderRadius: '12px', padding: '0.55rem 0.4rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1rem', fontWeight: 900, color: '#fff' }}>{val}</div>
              <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.7)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{lbl}</div>
            </div>
          ))}
        </div>
        <button
          onClick={() => setDeleteConfirm(selectedCrop)}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.35)', color: '#fca5a5', borderRadius: '10px', padding: '0.5rem', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
        >
          <Trash2 size={13} /> Delete Crop & Start Again
        </button>
      </div>
    ) : (
      <div style={{ background: 'linear-gradient(135deg,#1e362a 0%,#2d5240 100%)', padding: '1.1rem 1rem' }}>
        <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.55)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.25rem' }}>Crop Monitoring</div>
        <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.5px' }}>
          {loading ? 'Loading...' : selectedCrop?.status === 'pending' ? `Plant ${selectedCrop.crop_name}?` : 'No Active Crops'}
        </div>
      </div>
    );

    const heroHeight = (!loading && selectedCrop?.status === 'active') ? 185 : 80;

    return (
      <div style={{ background: '#f0f2ef', minHeight: '100dvh', fontFamily: "'Outfit', sans-serif" }}>
        {/* Fixed hero */}
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 20, borderRadius: '0 0 22px 22px', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.15)' }}>
          {heroContent}
        </div>
        {/* Scrollable cards pushed below fixed hero */}
        <div key={contentKey} style={{ paddingTop: heroHeight + 12, padding: `${heroHeight + 12}px 1rem 0`, paddingBottom: 'calc(100px + env(safe-area-inset-bottom))' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {renderMobileContent()}
          </div>
        </div>

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
                  This crop will be removed from your monitoring list. You can always run a new soil test and start again.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  style={{ flex: 1, padding: '0.85rem', borderRadius: '14px', border: '2px solid #e2e8f0', background: '#fff', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', color: '#64748b', fontFamily: 'var(--font-body)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  style={{ flex: 1, padding: '0.85rem', borderRadius: '14px', border: 'none', background: 'linear-gradient(135deg, #e11d48, #be123c)', color: '#fff', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', fontFamily: 'var(--font-body)' }}
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    );
  }

  return (
    <div className="dashboard-view animate-2" style={{ paddingTop: 0 }}>

      {/* Banner — identical structure to home page "Ready to plant?" */}
      <div className="pro-welcome-banner farmer-banner">
        <div className="banner-content">
          <h2>{greeting}, {firstName}</h2>
          <p>{monitoringSubtitle}</p>
        </div>
        <div className="banner-icon">
          <Sprout size={120} color="rgba(255,255,255,0.1)" />
        </div>
      </div>

      {/* Stats strip — matching skeleton pattern if loading */}
      <div className="stats-strip animate-1">
        {loading ? (
          [1, 2, 3, 4].map(i => (
            <div key={i} className="stat-pill-card skeleton-card skeleton-shimmer">
              <div className="skeleton-circle"></div>
              <div className="skeleton-data">
                <div className="skeleton-line-sm"></div>
                <div className="skeleton-line-lg"></div>
              </div>
            </div>
          ))
        ) : (
          <>
            <div className="stat-pill-card">
              <div className="stat-icon-circle green-soft"><Sprout size={20} color="#10b981" /></div>
              <div className="stat-data">
                <span className="stat-label">Active Crops</span>
                <span className="stat-main">{activeCrops} {activeCrops === 1 ? 'Crop' : 'Crops'}</span>
              </div>
            </div>
            <div className="stat-pill-card">
              <div className="stat-icon-circle blue-soft"><Activity size={20} color="#3b82f6" /></div>
              <div className="stat-data">
                <span className="stat-label">Health Score</span>
                <span className="stat-main">{healthScore === '--' ? 'No Data' : `${healthScore}%`}</span>
              </div>
            </div>
            <div className="stat-pill-card">
              <div className="stat-icon-circle orange-soft"><AlertTriangle size={20} color="#f59e0b" /></div>
              <div className="stat-data">
                <span className="stat-label">Alerts</span>
                <span className="stat-main">{activeAlerts === 0 ? 'No Issues' : `${activeAlerts} Active`}</span>
              </div>
            </div>
            <div className="stat-pill-card">
              <div className="stat-icon-circle yellow-soft"><Clock size={20} color="#eab308" /></div>
              <div className="stat-data">
                <span className="stat-label">Days Growing</span>
                <span className="stat-main">{selectedCrop && selectedCrop.status === 'active' ? `${cropAge} Days` : 'N/A'}</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Main content grid */}
      <div key={contentKey}>
        {renderMainContent()}
      </div>

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
                This crop will be removed from your monitoring list. You can always run a new soil test and start again.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => setDeleteConfirm(null)}
                style={{ flex: 1, padding: '0.85rem', borderRadius: '14px', border: '2px solid #e2e8f0', background: '#fff', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', color: '#64748b', fontFamily: 'var(--font-body)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                style={{ flex: 1, padding: '0.85rem', borderRadius: '14px', border: 'none', background: 'linear-gradient(135deg, #e11d48, #be123c)', color: '#fff', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', fontFamily: 'var(--font-body)' }}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Monitoring;
