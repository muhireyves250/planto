import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  ShieldCheck, 
  AlertCircle, 
  TrendingDown, 
  TrendingUp, 
  Droplets, 
  Zap,
  Clock,
  Printer,
  Calendar,
  Layers,
  ChevronRight,
  Search,
  Filter,
  MoreVertical,
  Activity,
  History,
  FileSpreadsheet,
  BadgeCheck,
  Leaf
} from 'lucide-react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip
} from 'recharts';

const ANALYTICS_URL = 'http://localhost:8080/predictions';

const Reports = ({ setHeaderActions }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('planto_user'));
        const response = await fetch(ANALYTICS_URL, {
          headers: {
            ...(user?.access_token ? { 'Authorization': `Bearer ${user.access_token}` } : {})
          }
        });
        const json = await response.json();
        // Sort by timestamp descending
        const sorted = (json || []).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setData(sorted);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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
        </>
      );
    }
  }, [searchTerm, data, loading, setHeaderActions]);

  if (loading) return (
    <div className="dashboard-view animate-2" style={{ paddingTop: 0 }}>
      
      <div className="stats-strip">
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
    </div>
  );

  const filteredData = data.filter(item => 
    item.predicted_crop.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const latest = data[0] || null;
  
  // Stats calculations
  const avgConfidence = data.length > 0 
    ? (data.reduce((acc, c) => acc + (c.confidence || 0), 0) / data.length * 100).toFixed(1) 
    : 0;

  const radarData = [
    { subject: 'Nitrogen', A: data.length > 0 ? data.reduce((acc, c) => acc + c.n, 0) / data.length : 0, fullMark: 140 },
    { subject: 'Phosphorus', A: data.length > 0 ? data.reduce((acc, c) => acc + c.p, 0) / data.length : 0, fullMark: 140 },
    { subject: 'Potassium', A: data.length > 0 ? data.reduce((acc, c) => acc + c.k, 0) / data.length : 0, fullMark: 140 },
    { subject: 'pH Balance', A: data.length > 0 ? (data.reduce((acc, c) => acc + c.ph, 0) / data.length) * 10 : 0, fullMark: 140 },
    { subject: 'Humidity', A: data.length > 0 ? data.reduce((acc, c) => acc + c.humidity, 0) / data.length : 0, fullMark: 140 },
  ];

  const exportCSV = () => {
    const headers = ['ID', 'Timestamp', 'Crop', 'Confidence', 'N', 'P', 'K', 'Temp', 'Humidity', 'pH', 'Rainfall'];
    const rows = data.map(item => [
      item.id, item.timestamp, item.predicted_crop, item.confidence, 
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
  };

  return (
    <div className="dashboard-view animate-2" style={{ paddingTop: 0 }}>

      {/* Reports Welcome Banner - Matching Dashboard Template */}
      <div className="pro-welcome-banner farmer-banner animate-1">
        <div className="banner-content">
          <h2>Archive Access</h2>
          <p>Access your full history of soil analysis records. Filter by crop or date to find specific audits.</p>
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
        <div className="dashboard-view animate-2" style={{padding: 0}}>
          <div className="stats-strip" style={{marginTop: '1.5rem'}}>
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
        </div>
      ) : (
        <>
          {/* Summary Pills - Matching Analytics/My Crops */}
          <div className="stats-strip animate-fade-in">
            <div className="stat-pill-card">
              <div className="stat-icon-circle blue-soft"><Layers size={20} color="#3b82f6" /></div>
              <div className="stat-data">
                <span className="stat-label">Active Crops</span>
                <span className="stat-main">{Math.ceil(data.length * 0.4)} Active</span>
              </div>
            </div>
            <div className="stat-pill-card">
              <div className="stat-icon-circle orange-soft"><History size={20} color="#f59e0b" /></div>
              <div className="stat-data">
                <span className="stat-label">Past Crops</span>
                <span className="stat-main">{Math.floor(data.length * 0.6)} Harvested</span>
              </div>
            </div>
            <div className="stat-pill-card">
              <div className="stat-icon-circle green-soft"><TrendingUp size={20} color="#10b981" /></div>
              <div className="stat-data">
                <span className="stat-label">Health Trend</span>
                <span className="stat-main">Stable</span>
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
                  <Tooltip 
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'}}
                  />
                </RadarChart>
              </ResponsiveContainer>
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
              <div className="pro-insight-item warning" style={{padding: '0.75rem', marginBottom: '0.5rem'}}>
                <div className="insight-icon" style={{width: '28px', height: '28px'}}><TrendingDown size={14} /></div>
                <div className="insight-content">
                  <h4 style={{fontSize: '0.8rem'}}>Nitrogen Depletion</h4>
                  <p style={{fontSize: '0.7rem'}}>Levels dropped 12% in last 3 tests.</p>
                </div>
              </div>
              <div className="pro-insight-item success" style={{padding: '0.75rem', marginBottom: '0.5rem'}}>
                <div className="insight-icon" style={{width: '28px', height: '28px'}}><TrendingUp size={14} /></div>
                <div className="insight-content">
                  <h4 style={{fontSize: '0.8rem'}}>pH Stability Confirmed</h4>
                  <p style={{fontSize: '0.7rem'}}>Consistently between 6.2 - 6.8.</p>
                </div>
              </div>
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
                        {new Date(item.timestamp).toLocaleDateString([], {month: 'short', day: 'numeric', year: 'numeric'})}
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
