import React, { useState, useEffect } from 'react';
import { 
  Sprout, 
  Leaf, 
  Activity, 
  Calendar, 
  ChevronRight, 
  AlertTriangle, 
  Loader2, 
  Beaker,
  TrendingUp,
  History,
  Plus,
  ShieldCheck,
  Zap,
  Droplets,
  Gauge
} from 'lucide-react';
import { monitoringApi } from '../api/monitoringApi';
import { fertilizerApi } from '../api/fertilizerApi';
import MonitoringForm from '../components/forms/MonitoringForm';

const CropMonitoring = ({ user, setHeaderActions }) => {
  const [plantedCrops, setPlantedCrops] = useState([]);
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user?.id) {
      loadCrops();
    }
  }, [user]);

  const loadCrops = async () => {
    try {
      setLoading(true);
      let data;
      if (user?.role === 'agronomist' || user?.role === 'admin') {
        data = await monitoringApi.getAllCrops();
      } else {
        data = await monitoringApi.getMyCrops(user.id);
      }
      setPlantedCrops(data);
      if (data.length > 0 && !selectedCrop) {
        setSelectedCrop(data[0]);
      }
    } catch (err) {
      setError("Failed to load your crops.");
    } finally {
      setLoading(false);
    }
  };

  const handleMonitoringSubmit = async (formData) => {
    if (!selectedCrop) return;
    try {
      setSubmitting(true);
      const result = await monitoringApi.submitMonitoring(selectedCrop.id, formData);
      setAnalysis(result);
      // Refresh crop history in list
      loadCrops();
    } catch (err) {
      setError(err.message || "Failed to submit monitoring data.");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (selectedCrop) {
      fetchLatestAnalysis();
    }
  }, [selectedCrop]);

  const fetchLatestAnalysis = async () => {
    try {
      const data = await fertilizerApi.getRecommendation(selectedCrop.id);
      setAnalysis(data);
    } catch (err) {
      setAnalysis(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'healthy': return '#10b981';
      case 'moderate risk': return '#f59e0b';
      case 'critical': return '#ef4444';
      default: return '#94a3b8';
    }
  };

  if (loading) {
    return (
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px'}}>
        <Loader2 className="lucide-spin" size={40} color="var(--bg-sidebar)" />
      </div>
    );
  }

  return (
    <div className="dashboard-view animate-fade-in" style={{ paddingTop: 0 }}>

      {/* Hero Analysis Section */}
      {selectedCrop && analysis && (
        <div className="stats-strip animate-fade-in" style={{marginBottom: '1.5rem'}}>
          <div className="stat-pill-card">
            <div className="stat-icon-circle blue-soft"><Calendar size={20} color="#3b82f6" /></div>
            <div className="stat-data">
              <span className="stat-label">Growth Stage</span>
              <span className="stat-main" style={{textTransform: 'capitalize'}}>{analysis.stage}</span>
            </div>
          </div>
          <div className="stat-pill-card">
            <div className="stat-icon-circle green-soft" style={{backgroundColor: getStatusColor(analysis.status) + '20'}}>
              <Gauge size={20} color={getStatusColor(analysis.status)} />
            </div>
            <div className="stat-data">
              <span className="stat-label">Health Score</span>
              <span className="stat-main">{analysis.health_score}/100</span>
            </div>
          </div>
          <div className="stat-pill-card">
            <div className="stat-icon-circle orange-soft"><Zap size={20} color="#f59e0b" /></div>
            <div className="stat-data">
              <span className="stat-label">Status</span>
              <span className="stat-main" style={{color: getStatusColor(analysis.status)}}>{analysis.status}</span>
            </div>
          </div>
          <div className="stat-pill-card">
            <div className="stat-icon-circle emerald-soft"><ShieldCheck size={20} color="#059669" /></div>
            <div className="stat-data">
              <span className="stat-label">Last Checked</span>
              <span className="stat-main">Today</span>
            </div>
          </div>
        </div>
      )}

      <div className="dashboard-grid-matching">
        {/* Left Column: My Crops List */}
        <div className="dashboard-col">
          <div className="dashboard-card matching-card">
            <div className="card-header-simple">
              <h3>My Farm Ledger</h3>
            </div>
            <div style={{padding: '1rem'}}>
              {plantedCrops.length === 0 ? (
                <div style={{textAlign: 'center', padding: '2rem'}}>
                  <Sprout size={48} color="#e2e8f0" />
                  <p style={{marginTop: '1rem', color: 'var(--text-muted)'}}>No crops planted yet.</p>
                </div>
              ) : (
                <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
                  {plantedCrops.map(crop => (
                    <div 
                      key={crop.id}
                      onClick={() => setSelectedCrop(crop)}
                      style={{
                        padding: '1rem',
                        borderRadius: '12px',
                        background: selectedCrop?.id === crop.id ? 'var(--bg-sidebar)' : '#f8fafc',
                        color: selectedCrop?.id === crop.id ? 'white' : 'var(--text-dark)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.2s',
                        border: selectedCrop?.id === crop.id ? 'none' : '1px solid #e2e8f0'
                      }}
                    >
                      <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                        <div style={{
                          width: '40px', 
                          height: '40px', 
                          background: selectedCrop?.id === crop.id ? 'rgba(255,255,255,0.1)' : 'white',
                          borderRadius: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Leaf size={20} color={selectedCrop?.id === crop.id ? 'white' : 'var(--accent-emerald)'} />
                        </div>
                        <div>
                          <div style={{fontWeight: 700, textTransform: 'capitalize'}}>{crop.crop_name}</div>
                          <div style={{fontSize: '0.7rem', opacity: 0.7}}>Planted: {new Date(crop.planting_date).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <ChevronRight size={16} opacity={0.5} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="dashboard-card matching-card" style={{marginTop: '1.5rem'}}>
            <div className="card-header-simple">
              <h3>Environmental History</h3>
            </div>
            <div style={{padding: '1rem'}}>
              {!selectedCrop?.monitoring_data?.length ? (
                <p style={{fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center'}}>No telemetry data recorded.</p>
              ) : (
                <div className="table-wrapper-ultra-compact">
                  <table className="alerts-table-simple" style={{fontSize: '0.8rem'}}>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>N-P-K</th>
                        <th>pH</th>
                        <th>M%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedCrop.monitoring_data.slice(-5).reverse().map((entry, idx) => (
                        <tr key={idx}>
                          <td style={{fontSize: '0.7rem'}}>{new Date(entry.timestamp).toLocaleDateString([], {month: 'short', day: 'numeric'})}</td>
                          <td>{entry.n}-{entry.p}-{entry.k}</td>
                          <td>{entry.ph}</td>
                          <td>{entry.moisture}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Intelligence Form & Actionable Recs */}
        <div className="dashboard-col">
          {selectedCrop ? (
            <>
              {/* Nutrient Deficit Panel */}
              {analysis && analysis.deficit && (
                <div className="dashboard-card matching-card" style={{marginBottom: '1.5rem'}}>
                  <div className="card-header-simple">
                    <div className="header-flex-compact">
                      <h3>Nutrient Deficiencies</h3>
                      <span className="badge-mini-text">Gap Analysis</span>
                    </div>
                  </div>
                  <div style={{padding: '1rem', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem'}}>
                    <div className="deficit-pill" style={{background: '#fff1f2', padding: '1rem', borderRadius: '12px', textAlign: 'center'}}>
                      <div style={{color: '#be123c', fontSize: '0.7rem', fontWeight: 800}}>NITROGEN</div>
                      <div style={{fontSize: '1.5rem', fontWeight: 800, color: '#9f1239'}}>-{analysis.deficit.N}</div>
                    </div>
                    <div className="deficit-pill" style={{background: '#fff7ed', padding: '1rem', borderRadius: '12px', textAlign: 'center'}}>
                      <div style={{color: '#c2410c', fontSize: '0.7rem', fontWeight: 800}}>PHOSPHORUS</div>
                      <div style={{fontSize: '1.5rem', fontWeight: 800, color: '#9a3412'}}>-{analysis.deficit.P}</div>
                    </div>
                    <div className="deficit-pill" style={{background: '#f0f9ff', padding: '1rem', borderRadius: '12px', textAlign: 'center'}}>
                      <div style={{color: '#0369a1', fontSize: '0.7rem', fontWeight: 800}}>POTASSIUM</div>
                      <div style={{fontSize: '1.5rem', fontWeight: 800, color: '#075985'}}>-{analysis.deficit.K}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Fertilizer Plan */}
              <div className="dashboard-card matching-card">
                <div className="card-header-simple">
                  <div className="header-flex-compact">
                    <h3>Precision Fertilization Plan</h3>
                    <Beaker size={14} color="var(--accent-emerald)" />
                  </div>
                </div>
                <div style={{padding: '1rem'}}>
                  {!analysis || !analysis.fertilizer || analysis.fertilizer.length === 0 ? (
                    <div style={{padding: '1.5rem', background: '#f0fdf4', borderRadius: '12px', border: '1px solid #dcfce7', textAlign: 'center'}}>
                      <ShieldCheck color="#16a34a" size={32} style={{margin: '0 auto 0.5rem'}} />
                      <div style={{fontWeight: 700, color: '#166534'}}>Optimal Balance</div>
                      <div style={{fontSize: '0.85rem', color: '#15803d'}}>No supplemental fertilization required at this stage.</div>
                    </div>
                  ) : (
                    <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
                      {analysis.fertilizer.map((rec, idx) => (
                        <div key={idx} className="pro-insight-item success" style={{padding: '1rem', border: '1px solid rgba(16, 185, 129, 0.1)'}}>
                          <div className="insight-icon" style={{background: 'var(--bg-sidebar)', color: 'white'}}><Activity size={16} /></div>
                          <div className="insight-content">
                            <h4 style={{display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center'}}>
                              <span>Apply {rec.type}</span>
                              <span style={{fontSize: '1.1rem', color: 'var(--accent-emerald)'}}>{rec.kg} KG</span>
                            </h4>
                            <p>Targeted application based on {analysis.stage} requirements.</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Update Form */}
              <div style={{marginTop: '1.5rem'}}>
                <MonitoringForm onSubmit={handleMonitoringSubmit} loading={submitting} />
              </div>
            </>
          ) : (
            <div className="dashboard-card matching-card" style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px', textAlign: 'center', padding: '2rem'}}>
              <div>
                <Activity size={48} color="#e2e8f0" style={{marginBottom: '1rem'}} />
                <h3 style={{color: '#64748b'}}>Telemetry Offline</h3>
                <p style={{color: '#94a3b8', fontSize: '0.9rem'}}>Select a field from your ledger to start precision monitoring.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CropMonitoring;
