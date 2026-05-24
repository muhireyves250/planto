import React, { useState, useEffect } from 'react';
import { Loader2, AlertTriangle, Sprout, Activity, FlaskConical, TrendingUp, Zap, Clock, Bell, CheckCircle2, MapPin, Droplets, Wind } from 'lucide-react';
import { monitoringApi } from '../api/monitoringApi';
import { alertApi } from '../api/farmApi';

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

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      let cropsData = [];
      if (user?.id) {
        cropsData = await monitoringApi.getMyCrops(user.id);
      } else {
        cropsData = JSON.parse(localStorage.getItem('planto_guest_crops')) || [];
      }
      setPlantedCrops(cropsData);

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

      if (user?.id) {
        const alertsData = await alertApi.getAlerts();
        setAlerts(alertsData);
      } else {
        setAlerts([]);
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

  const handleCheckSoilAgain = () => {
    if (!selectedCrop) return;
    if (setSoilTestParams) setSoilTestParams({ mode: 'monitoring', plantId: selectedCrop.id, cropName: selectedCrop.crop_name });
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
  const healthScore = latestHealth?.overall_health ?? '--';
  const activeAlerts = alerts.length;

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
          {plantedCrops.length > 1 && (
            <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '1rem', marginBottom: '0.5rem' }}>
              {plantedCrops.map(crop => (
                <div key={crop.id} onClick={() => setSelectedCrop(crop)} style={{ padding: '0.6rem 1.1rem', borderRadius: '99px', background: selectedCrop?.id === crop.id ? 'var(--bg-sidebar)' : '#f1f5f9', color: selectedCrop?.id === crop.id ? 'white' : '#475569', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                  <Sprout size={14} /> <span style={{ textTransform: 'capitalize' }}>{crop.crop_name}</span>
                </div>
              ))}
            </div>
          )}

          {/* Crop hero — mirrors "Weather Today" glass card */}
          <div className="dashboard-card matching-card glass-morph">
            <div className="card-header-simple"><h3><Sprout size={20} color="var(--accent-emerald)" /> Crop Performance</h3></div>
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
          {/* Actions card — identical dark style to home page "Things You Can Do" */}
          <div className="dashboard-card matching-card" style={{ background: 'var(--bg-sidebar)', color: 'white' }}>
            <div className="card-header-simple"><h3 style={{ color: 'white' }}><Zap size={20} color="var(--accent-emerald)" /> Things You Can Do</h3></div>
            <div className="actions-list-simple" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
              <button className="action-btn-pro" onClick={handleCheckSoilAgain} style={{ background: 'var(--accent-emerald)', color: 'var(--bg-sidebar)', border: 'none', justifyContent: 'center', padding: '1rem' }}>
                <FlaskConical size={18} /> Re-test Soil Health
              </button>
              <button className="action-btn-pro" onClick={() => setActiveTab('crop-status')} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', justifyContent: 'center', padding: '1rem' }}>
                <Activity size={18} /> View Growth Journey
              </button>
            </div>
          </div>

          {/* Farm Status */}
          <div className="dashboard-card matching-card">
            <div className="card-header-simple"><h3><Sprout size={20} color="var(--accent-emerald)" /> Phase Analysis</h3></div>
            <div style={{ marginTop: '0.5rem' }}>
              <FarmStatusCards latestHealth={latestHealth} />
            </div>
          </div>

          {/* Recommendations & Fertilizer */}
          <RecommendedActions latestPlan={latestPlan} latestSoil={latestSoil} alerts={alerts} />
          <FertilizerPlanGrid latestPlan={latestPlan} />
          <SoilRetestCTA onRetest={handleCheckSoilAgain} />
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard-view animate-2" style={{ paddingTop: 0 }}>

      {/* Banner — identical structure to home page "Ready to plant?" */}
      <div className="pro-welcome-banner farmer-banner">
        <div className="banner-content">
          <h2>Ready to monitor?</h2>
          <p>Check your crop health today to see how well your plants are growing on your land.</p>
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
    </div>
  );
};

export default Monitoring;
