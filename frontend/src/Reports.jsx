import { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  TrendingDown,
  TrendingUp,
  Layers,
  Search,
  History,
  FileSpreadsheet,
  Leaf,
  Mail
} from 'lucide-react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip
} from 'recharts';

import { getCached, setCached } from './api/cache';
import { monitoringApi } from './api/monitoringApi';

const ANALYTICS_URL = `${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8080'}/predictions`;

const Reports = ({ user, impersonatedFarmId, impersonatedFarm, setHeaderActions, setReportModal }) => {
  const [data, setData] = useState([]);
  const [sendingReport, setSendingReport] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [plantedCrops, setPlantedCrops] = useState([]);

  const exportCSV = useCallback(() => {
    const headers = ['ID', 'Timestamp', 'Crop', 'Confidence', 'N', 'P', 'K', 'Temp', 'Humidity', 'pH', 'Rainfall'];
    const rows = data.map(item => [
      item.id, item.created_at, item.predicted_crop, item.confidence,
      item.n, item.p, item.k, item.temperature, item.humidity, item.ph, item.rainfall
    ]);
    let csvContent = "data:text/csv;charset=utf-8,"
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `planto_pro_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [data]);

  const handleSendReport = useCallback(async () => {
    setSendingReport(true);
    try {
      const storedUser = JSON.parse(localStorage.getItem('planto_user') || '{}');
      const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8080';
      const res = await fetch(`${BASE_URL}/reports/send-email`, {
        method: 'POST',
        headers: storedUser?.access_token
          ? { Authorization: `Bearer ${storedUser.access_token}` }
          : {},
      });
      if (res.ok) {
        setReportModal('success');
      } else {
        setReportModal('error');
      }
    } catch {
      setReportModal('error');
    } finally {
      setSendingReport(false);
    }
  }, [setReportModal]);

  useEffect(() => {
    const cacheKey = impersonatedFarmId ? `predictions_farm_${impersonatedFarmId}` : 'predictions';
    const fetchData = async () => {
      const cached = getCached(cacheKey);
      if (cached) {
        setData(cached);
        setLoading(false);
      } else {
        setData([]);
      }
      try {
        const storedUser = JSON.parse(localStorage.getItem('planto_user'));
        let cropsData = [];
        let fetchedData = [];

        if (impersonatedFarmId && impersonatedFarm) {
          cropsData = impersonatedFarm.crops || [];
          const predUrl = `${ANALYTICS_URL}?farm_id=${impersonatedFarmId}`;
          const predRes = await fetch(predUrl, {
            headers: storedUser?.access_token ? { 'Authorization': `Bearer ${storedUser.access_token}` } : {}
          });
          if (predRes.ok) fetchedData = await predRes.json();
        } else {
          const fetches = [
            fetch(ANALYTICS_URL, {
              headers: storedUser?.access_token ? { 'Authorization': `Bearer ${storedUser.access_token}` } : {}
            })
          ];
          if (storedUser?.id) {
            fetches.push(monitoringApi.getMyCrops(storedUser.id));
          }
          const results = await Promise.all(fetches);
          if (results[0].ok) fetchedData = await results[0].json();
          cropsData = results[1] || [];
        }

        const sorted = (fetchedData || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setCached(cacheKey, sorted);
        setData(sorted);
        if (cropsData) setPlantedCrops(cropsData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [impersonatedFarmId, impersonatedFarm]);

  useEffect(() => {
    if (setHeaderActions && !loading) {
      setHeaderActions(
        <>
          <div className="search-bar-mini">
            <Search size={16} />
            <input 
              type="text" 
              placeholder="Filter by crop..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button onClick={exportCSV} className="pro-action-btn primary shadow-btn">
            <FileSpreadsheet size={18} />
            <span>Export Dataset</span>
          </button>
          {user?.role === 'farmer' && (
            <button
              onClick={handleSendReport}
              disabled={sendingReport}
              className="pro-action-btn primary shadow-btn"
              style={{ background: sendingReport ? '#e2e8f0' : '#16a34a', color: sendingReport ? '#94a3b8' : '#fff' }}
            >
              <Mail size={18} />
              <span>{sendingReport ? 'Sending…' : 'Send Report'}</span>
            </button>
          )}
        </>
      );
    }
  }, [searchTerm, loading, setHeaderActions, user?.role, sendingReport, exportCSV, handleSendReport]);

  const filteredData = data.filter(item => 
    item.predicted_crop.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Stats calculations
  const avgConfidence = data.length > 0
    ? (data.reduce((acc, c) => acc + (c.confidence || 0), 0) / data.length * 100).toFixed(1)
    : 0;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const storedUser = (() => {
    try { return JSON.parse(localStorage.getItem('planto_user')); } catch { return null; }
  })();
  const firstName = impersonatedFarm
    ? (impersonatedFarm.farmer?.full_name?.split(' ')[0] || impersonatedFarm.farm_name || 'Farmer')
    : (storedUser?.full_name?.split(' ')[0] || 'Farmer');
  const recordSummary = data.length === 0
    ? 'No soil tests recorded yet. Run your first test to begin building your archive.'
    : `${data.length} soil test record${data.length === 1 ? '' : 's'} found. Filter by crop or export to CSV.`;

  const radarData = [
    { subject: 'Nitrogen', A: data.length > 0 ? data.reduce((acc, c) => acc + c.n, 0) / data.length : 0, fullMark: 140 },
    { subject: 'Phosphorus', A: data.length > 0 ? data.reduce((acc, c) => acc + c.p, 0) / data.length : 0, fullMark: 140 },
    { subject: 'Potassium', A: data.length > 0 ? data.reduce((acc, c) => acc + c.k, 0) / data.length : 0, fullMark: 140 },
    { subject: 'pH Balance', A: data.length > 0 ? (data.reduce((acc, c) => acc + c.ph, 0) / data.length) * 10 : 0, fullMark: 140 },
    { subject: 'Humidity', A: data.length > 0 ? data.reduce((acc, c) => acc + c.humidity, 0) / data.length : 0, fullMark: 140 },
  ];

  const computedInsights = (() => {
    if (data.length < 2) return [];
    const insights = [];

    const half = Math.ceil(data.length / 2);
    const recent = data.slice(0, half);
    const older = data.slice(half);

    const avgNRecent = recent.reduce((s, d) => s + d.n, 0) / recent.length;
    const avgNOlder = older.reduce((s, d) => s + d.n, 0) / older.length;
    const nChange = Math.round(((avgNRecent - avgNOlder) / Math.max(avgNOlder, 1)) * 100);
    if (nChange <= -10) {
      insights.push({
        type: 'warning', icon: 'down',
        title: 'Nitrogen Declining',
        body: `N levels dropped ~${Math.abs(nChange)}% across your last ${data.length} tests. Consider Urea top-dressing.`
      });
    } else if (nChange >= 10) {
      insights.push({
        type: 'success', icon: 'up',
        title: 'Nitrogen Improving',
        body: `N levels rose ~${nChange}% in recent tests. Current soil management is effective.`
      });
    }

    const phValues = data.map(d => d.ph);
    const phMin = Math.min(...phValues).toFixed(1);
    const phMax = Math.max(...phValues).toFixed(1);
    const phRange = parseFloat(phMax) - parseFloat(phMin);
    if (phRange < 0.6) {
      insights.push({
        type: 'success', icon: 'up',
        title: 'pH Stability Confirmed',
        body: `pH range is ${phMin}–${phMax} across all tests. Consistent and within normal bounds.`
      });
    } else {
      insights.push({
        type: 'warning', icon: 'down',
        title: 'pH Variance Detected',
        body: `pH swings between ${phMin} and ${phMax}. Unstable pH reduces nutrient uptake.`
      });
    }

    const avgConfRecent = recent.reduce((s, d) => s + (d.confidence || 0), 0) / recent.length;
    const avgConfOlder = older.reduce((s, d) => s + (d.confidence || 0), 0) / older.length;
    if (avgConfRecent > avgConfOlder + 0.05) {
      insights.push({
        type: 'success', icon: 'up',
        title: 'Prediction Accuracy Rising',
        body: `Recent AI confidence is ${Math.round(avgConfRecent * 100)}% vs ${Math.round(avgConfOlder * 100)}% historically. Soil is becoming more predictable.`
      });
    }

    return insights.slice(0, 3);
  })();

  const formatDate = (ts) => {
    const d = new Date(ts);
    if (isNaN(d.getTime())) return 'Unknown date';
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const isMobile = window.innerWidth <= 768;

  if (isMobile) {
    return (
      <div style={{ background: '#f0f2ef', minHeight: '100dvh', fontFamily: "'Outfit', sans-serif" }}>

        {/* Fixed hero */}
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 20, borderRadius: '0 0 22px 22px', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.15)' }}>
          <div style={{ background: 'linear-gradient(135deg,#1e362a 0%,#2d5240 100%)', padding: '1rem 1rem 1rem' }}>
            <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.55)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.25rem' }}>Soil Intelligence</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#fff', marginBottom: '0.75rem', letterSpacing: '-0.5px' }}>
              {loading ? 'Loading...' : data.length === 0 ? 'No tests yet' : `${data.length} Test${data.length === 1 ? '' : 's'} Recorded`}
            </div>
            <div style={{ display: 'flex', gap: '0.45rem' }}>
              {[
                { val: loading ? '—' : plantedCrops.filter(c => c.status === 'active').length, lbl: 'Active Crops' },
                { val: loading ? '—' : data.length, lbl: 'Past Tests' },
                { val: loading ? '—' : `${avgConfidence}%`, lbl: 'Avg Confidence' },
              ].map(({ val, lbl }) => (
                <div key={lbl} style={{ flex: 1, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', borderRadius: '12px', padding: '0.55rem 0.4rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '1rem', fontWeight: 900, color: '#fff' }}>{val}</div>
                  <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.7)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1.3, marginTop: '0.1rem' }}>{lbl}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scrollable cards below fixed hero */}
        <div style={{ paddingTop: '165px', padding: '165px 1rem 0', paddingBottom: 'calc(100px + env(safe-area-inset-bottom))' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

          {loading ? (
            [1,2,3].map(i => (
              <div key={i} className="skeleton-card skeleton-shimmer" style={{ height: 100, borderRadius: 20 }} />
            ))
          ) : (
            <>
              {/* Radar chart */}
              <div style={{ background: '#fff', borderRadius: '20px', padding: '1.1rem', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a' }}>Nutrient Equilibrium</div>
                  <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#64748b', background: '#f1f5f9', borderRadius: '99px', padding: '0.2rem 0.6rem' }}>Global Avg</span>
                </div>
                <div style={{ height: 220 }}>
                  {data.length === 0 ? (
                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #e2e8f0' }}>
                      <Layers size={24} color="#cbd5e1" />
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>No soil data yet</p>
                      <p style={{ margin: 0, fontSize: '0.68rem', color: '#cbd5e1' }}>Run a soil test to see nutrient averages</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                        <PolarGrid stroke="rgba(0,0,0,0.06)" />
                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }} />
                        <Radar name="Soil Index" dataKey="A" stroke="#2d5240" fill="#2d5240" fillOpacity={0.18} strokeWidth={2} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', fontSize: '0.75rem' }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Insights */}
              <div style={{ background: '#fff', borderRadius: '20px', padding: '1.1rem', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a' }}>Agronomic Insights</div>
                  <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#8b5cf6', background: '#ede9fe', borderRadius: '99px', padding: '0.2rem 0.6rem' }}>AI Analysis</span>
                </div>
                {computedInsights.length === 0 ? (
                  <div style={{ background: '#f0fdf4', borderRadius: '14px', padding: '1.25rem', textAlign: 'center', border: '1px dashed rgba(16,185,129,0.25)' }}>
                    <p style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, margin: 0 }}>Run at least 2 soil tests to see AI-computed insights here.</p>
                  </div>
                ) : (
                  computedInsights.map((ins, i) => (
                    <div key={i} style={{ display: 'flex', gap: '0.75rem', padding: '0.75rem', background: ins.type === 'success' ? '#f0fdf4' : '#fef3c7', borderRadius: '14px', marginBottom: i < computedInsights.length - 1 ? '0.5rem' : 0, border: `1px solid ${ins.type === 'success' ? '#bbf7d0' : '#fde68a'}` }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: ins.type === 'success' ? '#dcfce7' : '#fef9c3', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {ins.icon === 'up' ? <TrendingUp size={14} color="#16a34a" /> : <TrendingDown size={14} color="#d97706" />}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.78rem', fontWeight: 800, color: ins.type === 'success' ? '#166534' : '#92400e', marginBottom: '0.2rem' }}>{ins.title}</div>
                        <div style={{ fontSize: '0.72rem', color: ins.type === 'success' ? '#15803d' : '#b45309', lineHeight: 1.45 }}>{ins.body}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Audit log as cards */}
              <div style={{ background: '#fff', borderRadius: '20px', padding: '1.1rem', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a' }}>Soil Audit Log</div>
                  <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#64748b', background: '#f1f5f9', borderRadius: '99px', padding: '0.2rem 0.6rem' }}>{filteredData.length} records</span>
                </div>
                {filteredData.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                    <FileText size={32} style={{ opacity: 0.3, display: 'block', margin: '0 auto 0.5rem' }} />
                    <p style={{ fontSize: '0.8rem', fontWeight: 600, margin: 0 }}>No soil tests yet</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {filteredData.map((item, idx) => (
                      <div key={item.id || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: '#f8fafc', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Leaf size={12} color="#059669" />
                            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', textTransform: 'capitalize' }}>{item.predicted_crop}</span>
                          </div>
                          <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 600 }}>{formatDate(item.created_at)}</div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.3rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: item.confidence > 0.8 ? '#10b981' : '#f59e0b' }} />
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0f172a' }}>{Math.round(item.confidence * 100)}%</span>
                          </div>
                          <div style={{ display: 'flex', gap: '0.25rem' }}>
                            {[{l:'N',v:item.n,c:'#059669',bg:'rgba(16,185,129,0.1)'},{l:'P',v:item.p,c:'#d97706',bg:'rgba(245,158,11,0.1)'},{l:'K',v:item.k,c:'#2563eb',bg:'rgba(59,130,246,0.1)'}].map(({l,v,c,bg}) => (
                              <span key={l} style={{ background: bg, color: c, padding: '0.15rem 0.35rem', borderRadius: '4px', fontSize: '0.6rem', fontWeight: 800 }}>{l}:{v}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Export button */}
              <button onClick={exportCSV} style={{ width: '100%', background: '#1e362a', color: '#fff', border: 'none', borderRadius: '16px', padding: '1rem', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <FileText size={16} /> Export as CSV
              </button>
              {user?.role === 'farmer' && (
                <button
                  onClick={handleSendReport}
                  disabled={sendingReport}
                  style={{ width: '100%', background: sendingReport ? '#e2e8f0' : '#16a34a', color: sendingReport ? '#94a3b8' : '#fff', border: 'none', borderRadius: '16px', padding: '1rem', fontWeight: 700, fontSize: '0.9rem', cursor: sendingReport ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.5rem' }}
                >
                  <Mail size={16} /> {sendingReport ? 'Sending…' : 'Send Report to My Inbox'}
                </button>
              )}
            </>
          )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-view animate-2" style={{ paddingTop: 0 }}>

      {/* Reports Welcome Banner - Matching Dashboard Template */}
      <div className="pro-welcome-banner farmer-banner animate-1">
        <div className="banner-content">
          <h2>{greeting}, {firstName}</h2>
          <p>{recordSummary}</p>
          <div style={{marginTop: '1rem', display: 'flex', gap: '0.5rem'}}>
            <span className="badge-mini-text" style={{background: 'rgba(255,255,255,0.1)', color: 'white'}}>AUDIT LOG</span>
            <span className="badge-mini-text" style={{background: 'rgba(255,255,255,0.1)', color: 'white'}}>{data.length} ENTRIES</span>
          </div>
        </div>
        <div className="banner-icon">
          <FileText size={120} color="rgba(255,255,255,0.1)" />
        </div>
      </div>

      {loading ? (
        <>
          <div className="stats-strip animate-1">
            {[1,2,3,4].map(i => (
              <div key={i} className="stat-pill-card skeleton-card skeleton-shimmer">
                <div className="skeleton-circle"></div>
                <div className="skeleton-data">
                  <div className="skeleton-line-sm"></div>
                  <div className="skeleton-line-lg"></div>
                </div>
              </div>
            ))}
          </div>
          <div className="dashboard-grid-matching">
            <div className="dashboard-col">
              <div className="dashboard-card matching-card skeleton-card skeleton-shimmer" style={{height: '240px'}}></div>
              <div className="dashboard-card matching-card skeleton-card skeleton-shimmer" style={{height: '150px'}}></div>
            </div>
            <div className="dashboard-col">
              <div className="dashboard-card matching-card skeleton-card skeleton-shimmer flex-1">
                <div className="skeleton-table-header"></div>
                {[1,2,3,4,5,6,7,8].map(i => (
                  <div key={i} className="skeleton-table-row"></div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Summary Pills - Matching Analytics/My Crops */}
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

          <div className="dashboard-grid-matching animate-fade-in">
        {/* Left Column: Visual Analytics */}
        <div className="dashboard-col">
          <div className="dashboard-card matching-card">
            <div className="card-header-simple">
              <div className="header-flex-compact">
                <h3>Nutrient Equilibrium</h3>
                <span className="badge-mini-text">Global Avg</span>
              </div>
            </div>
            <div className="chart-container" style={{height: '240px'}}>
              {data.length === 0 ? (
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #e2e8f0' }}>
                  <Layers size={28} color="#cbd5e1" />
                  <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>No soil data yet</p>
                  <p style={{ margin: 0, fontSize: '0.72rem', color: '#cbd5e1' }}>Run a soil test to see nutrient averages</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                    <PolarGrid stroke="rgba(0,0,0,0.05)" />
                    <PolarAngleAxis dataKey="subject" tick={{fontSize: 10, fill: 'var(--text-muted)', fontWeight: 600}} />
                    <Radar
                      name="Soil Index"
                      dataKey="A"
                      stroke="var(--accent-emerald)"
                      fill="var(--accent-emerald)"
                      fillOpacity={0.15}
                      strokeWidth={2}
                    />
                    <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'}} />
                  </RadarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="dashboard-card matching-card">
            <div className="card-header-simple">
              <div className="header-flex-compact">
                <h3>Agronomic Insights</h3>
                <span className="badge-mini-text">AI Analysis</span>
              </div>
            </div>
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
          </div>
        </div>

        {/* Right Column: Record Table */}
        <div className="dashboard-col">
          <div className="dashboard-card matching-card flex-1">
            <div className="card-header-simple">
              <div className="header-flex-compact">
                <h3>Full Soil Audit Log</h3>
                <div className="record-count">{filteredData.length} records</div>
              </div>
            </div>
            
            <div className="table-wrapper-ultra-compact">
              <table className="alerts-table-simple">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Optimal Crop</th>
                    <th>Health</th>
                    <th>N-P-K</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((item, idx) => (
                    <tr key={item.id || idx}>
                      <td style={{fontSize: '0.7rem', color: '#64748b'}}>
                        {new Date(item.created_at).toLocaleDateString([], {month: 'short', day: 'numeric', year: 'numeric'})}
                      </td>
                      <td>
                        <div className="crop-pill-pro" style={{display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'var(--widget-light-green)', color: 'var(--bg-sidebar)', padding: '0.3rem 0.6rem', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 800}}>
                          <Leaf size={12} color="#059669" />
                          <span style={{textTransform: 'capitalize'}}>{item.predicted_crop}</span>
                        </div>
                      </td>
                      <td>
                        <div className="prob-indicator" style={{display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 700}}>
                          <div className="prob-dot" style={{width: '6px', height: '6px', borderRadius: '50%', background: item.confidence > 0.8 ? '#10b981' : '#f59e0b'}}></div>
                          <span>{Math.round(item.confidence * 100)}%</span>
                        </div>
                      </td>
                      <td>
                        <div className="npk-cell" style={{display: 'flex', gap: '0.3rem'}}>
                          <span className="npk-badge n" style={{background: 'rgba(16, 185, 129, 0.1)', color: '#059669', padding: '0.2rem 0.4rem', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 800}}>N:{item.n}</span>
                          <span className="npk-badge p" style={{background: 'rgba(245, 158, 11, 0.1)', color: '#d97706', padding: '0.2rem 0.4rem', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 800}}>P:{item.p}</span>
                          <span className="npk-badge k" style={{background: 'rgba(59, 130, 246, 0.1)', color: '#2563eb', padding: '0.2rem 0.4rem', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 800}}>K:{item.k}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredData.length === 0 && (
                    <tr>
                      <td colSpan="4" className="empty-state">
                        <div className="empty-content" style={{padding: '3rem 0', textAlign: 'center', color: 'var(--text-muted)'}}>
                          <Search size={24} style={{opacity: 0.2, marginBottom: '0.5rem'}} />
                          <p style={{fontSize: '0.8rem'}}>No records match your search</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        </div>
      </>
    )}

      <style>{`
        .header-actions {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .search-bar-mini {
          background: white;
          border: 1px solid rgba(0,0,0,0.05);
          padding: 0.5rem 1rem;
          border-radius: var(--radius-full);
          display: flex;
          align-items: center;
          gap: 0.75rem;
          box-shadow: var(--shadow-soft);
          color: var(--text-muted);
          width: 200px;
        }

        .search-bar-mini input {
          border: none;
          outline: none;
          background: none;
          font-size: 0.8rem;
          width: 100%;
          font-weight: 500;
        }

        .pro-action-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-radius: var(--radius-full);
          border: none;
          font-weight: 700;
          font-size: 0.75rem;
          cursor: pointer;
          transition: all 0.3s;
        }

        .pro-action-btn.primary {
          background: var(--bg-sidebar);
          color: white;
        }

        .pro-action-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(30, 54, 42, 0.2);
        }

        .pro-insights-list { display: flex; flex-direction: column; }
        .pro-insight-item {
          display: flex;
          gap: 0.75rem;
          border-radius: var(--radius-lg);
          transition: transform 0.2s;
          align-items: flex-start;
        }
        .pro-insight-item:hover { transform: translateX(5px); }
        .pro-insight-item.warning { background: #fffbeb; border: 1px solid rgba(245, 158, 11, 0.1); }
        .pro-insight-item.success { background: #f0fdf4; border: 1px solid rgba(22, 163, 74, 0.1); }
        .pro-insight-item.info { background: #f0f9ff; border: 1px solid rgba(14, 165, 233, 0.1); }

        .insight-icon {
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
          box-shadow: 0 2px 5px rgba(0,0,0,0.05);
          flex-shrink: 0;
        }
        .warning .insight-icon { color: var(--accent-amber); }
        .success .insight-icon { color: var(--accent-emerald); }
        .info .insight-icon { color: var(--accent-blue); }

        .insight-content h4 { font-weight: 700; margin-bottom: 0.1rem; color: var(--text-dark); }
        .insight-content p { line-height: 1.3; color: var(--text-muted); }

        .record-count { font-size: 0.65rem; font-weight: 800; color: var(--text-muted); background: #f1f5f9; padding: 0.2rem 0.5rem; border-radius: 6px; text-transform: uppercase; }
        
        .empty-content { display: flex; flex-direction: column; align-items: center; }
      `}</style>
    </div>
  );
};

export default Reports;
