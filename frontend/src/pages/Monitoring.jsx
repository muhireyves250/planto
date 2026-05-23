import React, { useState, useEffect } from 'react';
import { Loader2, AlertTriangle, Sprout, ChevronRight, Activity, FlaskConical } from 'lucide-react';
import { monitoringApi } from '../api/monitoringApi';
import { alertApi } from '../api/farmApi';

// New Subcomponents
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

  // Load user crops and general alerts
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
      if (user?.id) {
        setError('Could not retrieve farm data. Please check connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.id]);

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
        const updated = guestCrops.map(c => c.id === plantId ? { ...c, status: 'active' } : c);
        localStorage.setItem('planto_guest_crops', JSON.stringify(updated));
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
        const updated = guestCrops.filter(c => c.id !== plantId);
        localStorage.setItem('planto_guest_crops', JSON.stringify(updated));
      }
      setActiveTab('soil-test');
      if (setSoilTestParams) {
        setSoilTestParams({ mode: 'prediction', plantId: null, cropName: '' });
      }
      await loadData();
    } catch (err) {
      console.error('Failed to decline crop:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckSoilAgain = () => {
    if (!selectedCrop) return;
    if (setSoilTestParams) {
      setSoilTestParams({
        mode: 'monitoring',
        plantId: selectedCrop.id,
        cropName: selectedCrop.crop_name
      });
    }
    setActiveTab('soil-test');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ background: '#ecfdf5', padding: '1rem', borderRadius: '50%' }}>
          <Loader2 size={40} className="lucide-spin" style={{ color: 'var(--accent-emerald)', animation: 'spin 1.5s linear infinite' }} />
        </div>
        <span style={{ fontSize: '1.1rem', color: '#065f46', fontWeight: 600 }}>Gathering your field data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '3rem 2rem', textAlign: 'center', background: '#fff1f2', borderRadius: '16px', border: '2px dashed #fecdd3', maxWidth: '500px', margin: '2rem auto' }}>
        <AlertTriangle size={48} color="#e11d48" style={{ margin: '0 auto 1.5rem' }} />
        <h3 style={{ color: '#9f1239', marginBottom: '0.75rem', fontSize: '1.25rem', fontWeight: 700 }}>We couldn't load your farm data</h3>
        <p style={{ color: '#be123c', fontSize: '0.95rem', lineHeight: 1.5 }}>It seems we're having trouble connecting. Please check your internet connection and try again.</p>
        <button onClick={loadData} className="planto-btn-secondary" style={{ marginTop: '1.5rem', background: '#ffe4e6', border: 'none', color: '#9f1239', padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: 600 }}>
          Try Again
        </button>
      </div>
    );
  }

  // Extract latest telemetry data for selection
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

  return (
    <div className="dashboard-view animate-2" style={{ paddingTop: 0, paddingBottom: '3rem' }}>
      
      {/* Crop Selector Header for Mobile/Desktop to switch fields */}
      {plantedCrops.length > 1 && (
        <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '1.5rem', marginBottom: '1rem' }}>
          {plantedCrops.map(crop => (
            <div 
              key={crop.id}
              onClick={() => setSelectedCrop(crop)}
              style={{
                padding: '0.75rem 1.25rem',
                borderRadius: '99px',
                background: selectedCrop?.id === crop.id ? 'var(--bg-sidebar)' : '#f1f5f9',
                color: selectedCrop?.id === crop.id ? 'white' : '#475569',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Sprout size={16} /> <span style={{ textTransform: 'capitalize' }}>{crop.crop_name}</span>
            </div>
          ))}
        </div>
      )}

      {selectedCrop ? (
        selectedCrop.status === 'pending' ? (
          <div className="dashboard-card matching-card animate-1" style={{ padding: '3rem 2rem', textAlign: 'center', background: '#f0fdf4', border: '2px solid #bbf7d0', borderRadius: '24px', boxShadow: '0 10px 25px -5px rgba(22, 163, 74, 0.1)', maxWidth: '600px', margin: '2rem auto' }}>
            <div style={{ background: '#dcfce7', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <Sprout size={40} color="#16a34a" />
            </div>
            <h3 style={{ fontFamily: 'var(--font-heading)', color: '#166534', fontSize: '1.8rem', marginBottom: '1rem', fontWeight: 800 }}>
              Ready to Plant: <span style={{ textTransform: 'capitalize' }}>{selectedCrop.crop_name}</span>
            </h3>
            <p style={{ color: '#15803d', margin: '0 auto 2.5rem', fontSize: '1.05rem', lineHeight: 1.6, maxWidth: '90%' }}>
              Based on your recent soil test, this is the perfect crop for your field. Would you like to start growing it now and track its health?
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <button 
                onClick={() => handleAcceptCrop(selectedCrop.id)}
                style={{ background: '#16a34a', color: 'white', width: '100%', justifyContent: 'center', padding: '1.25rem', fontSize: '1.1rem', border: 'none', borderRadius: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(22, 163, 74, 0.2)' }}
              >
                <Sprout size={24} /> Yes, Start Growing!
              </button>
              <button 
                onClick={() => handleDeclineCrop(selectedCrop.id)}
                style={{ background: 'transparent', border: '2px solid #fca5a5', color: '#ef4444', width: '100%', justifyContent: 'center', padding: '1.25rem', fontSize: '1.1rem', borderRadius: '16px', fontWeight: 700, cursor: 'pointer' }}
              >
                No, I'll test again
              </button>
            </div>
          </div>
        ) : (
          <div className="dashboard-grid-matching animate-3">
            {/* Left Column */}
            <div className="dashboard-col">
              <CropHeroCard crop={selectedCrop} cropAge={cropAge} latestHealth={latestHealth} />
              
              <div style={{ background: 'white', borderRadius: '20px', padding: '1.5rem', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.03)', marginBottom: '2.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <h3 style={{ fontFamily: 'var(--font-heading)', color: '#0f172a', fontSize: '1.2rem', fontWeight: 800, margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Crop & Soil Telemetry
                  </h3>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <FarmStatusCards latestHealth={latestHealth} />
                  
                  <div style={{ height: '1px', background: '#e2e8f0', width: '100%' }}></div>
                  
                  <div style={{ marginTop: '-0.5rem' }}>
                    <SoilHealthBars latestSoil={latestSoil} />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="dashboard-col">
              <RecommendedActions latestPlan={latestPlan} latestSoil={latestSoil} alerts={alerts} />
            


              <FertilizerPlanGrid latestPlan={latestPlan} />
              <SmartAlerts alerts={alerts} />
              <SoilRetestCTA onRetest={handleCheckSoilAgain} />
            </div>
          </div>
        )
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px', textAlign: 'center', padding: '3rem 2rem', background: 'white', borderRadius: '24px', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.03)' }}>
          <div>
            <div style={{ background: '#f1f5f9', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <Activity size={40} color="#94a3b8" />
            </div>
            <h3 style={{ color: '#0f172a', fontSize: '1.5rem', marginBottom: '0.75rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>No Active Fields</h3>
            <p style={{ color: '#64748b', fontSize: '1.05rem', lineHeight: '1.5', maxWidth: '300px', margin: '0 auto 2rem' }}>
              You don't have any crops planted right now.
            </p>
            <button onClick={() => setActiveTab('soil-test')} style={{ background: '#10b981', color: 'white', padding: '1rem 2rem', borderRadius: '99px', fontWeight: 700, fontSize: '1.05rem', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 auto', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' }}>
              <FlaskConical size={20} /> Test Your Soil
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Monitoring;
