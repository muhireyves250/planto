import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  Leaf, 
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  AlertCircle
} from 'lucide-react';

const ANALYTICS_URL = 'http://localhost:8080/predictions';

const COLORS = ['#065f46', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#ecfdf5'];

const Analytics = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('planto_user'));
        const response = await fetch(ANALYTICS_URL, {
          headers: {
            ...(user?.access_token ? { 'Authorization': `Bearer ${user.access_token}` } : {})
          }
        });
        if (!response.ok) throw new Error('Failed to fetch analytics data');
        const json = await response.json();
        setData(json);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Data processing for charts
  const cropCounts = data.reduce((acc, curr) => {
    acc[curr.predicted_crop] = (acc[curr.predicted_crop] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.keys(cropCounts).map(crop => ({
    name: crop.charAt(0).toUpperCase() + crop.slice(1),
    value: cropCounts[crop]
  }));

  const timelineData = data.slice().reverse().map(item => ({
    time: new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    confidence: item.confidence * 100,
    n: item.n,
    p: item.p,
    k: item.k
  }));

  const stats = {
    total: data.length,
    avgConfidence: data.length > 0 ? (data.reduce((acc, curr) => acc + curr.confidence, 0) / data.length * 100).toFixed(1) : 0,
    topCrop: pieData.length > 0 ? pieData.sort((a, b) => b.value - a.value)[0].name : 'N/A'
  };

  return (
    <div className="analytics-container animate-2">
      <header className="page-header pro-header">
        <div className="header-left">
          <h1 className="welcome-text">My Crop Insights <span className="pro-badge">PRO-FARMER</span></h1>
          <div className="date-text"><Activity size={14} color="#10b981" className="lucide-pulse" /> {loading ? 'Synchronizing database...' : 'Database Synchronized • Analysis Active'}</div>
        </div>
      </header>

      {/* Analytics Welcome Banner - Matching Dashboard Template */}
      <div className="pro-welcome-banner farmer-banner animate-1">
        <div className="banner-content">
          <h2>Cultivation Intel</h2>
          <p>Explore your historical harvest performance and crop distribution across all seasons.</p>
          <div style={{marginTop: '1rem', display: 'flex', gap: '0.5rem'}}>
            <span className="badge-mini-text" style={{background: 'rgba(255,255,255,0.1)', color: 'white'}}>ACTIVE HARVEST</span>
            <span className="badge-mini-text" style={{background: 'rgba(255,255,255,0.1)', color: 'white'}}>Q2 ANALYSIS</span>
          </div>
        </div>
        <div className="banner-icon">
          <BarChart3 size={120} color="rgba(255,255,255,0.1)" />
        </div>
      </div>

      {loading ? (
        <>
          {/* Skeleton Stats */}
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
              <div className="dashboard-card matching-card skeleton-card skeleton-shimmer" style={{height: '180px'}}></div>
              <div className="dashboard-card matching-card skeleton-card skeleton-shimmer" style={{height: '180px'}}></div>
            </div>
            <div className="dashboard-col">
              <div className="dashboard-card matching-card skeleton-card skeleton-shimmer flex-1">
                <div className="skeleton-table-header"></div>
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} className="skeleton-table-row"></div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Summary Pills - Matching Homepage */}
          <div className="stats-strip animate-fade-in">
            <div className="stat-pill-card">
              <div className="stat-icon-circle green-soft"><Activity size={20} color="#10b981" /></div>
              <div className="stat-data">
                <span className="stat-label">Total Tests</span>
                <span className="stat-main">{stats.total}</span>
              </div>
            </div>
            <div className="stat-pill-card">
              <div className="stat-icon-circle orange-soft"><TrendingUp size={20} color="#f59e0b" /></div>
              <div className="stat-data">
                <span className="stat-label">Avg. Success</span>
                <span className="stat-main">{stats.avgConfidence}%</span>
              </div>
            </div>
            <div className="stat-pill-card">
              <div className="stat-icon-circle emerald-soft"><Leaf size={20} color="#059669" /></div>
              <div className="stat-data">
                <span className="stat-label">Top Crop</span>
                <span className="stat-main">{stats.topCrop}</span>
              </div>
            </div>
            <div className="stat-pill-card">
              <div className="stat-icon-circle yellow-soft"><Calendar size={20} color="#eab308" /></div>
              <div className="stat-data">
                <span className="stat-label">Last Activity</span>
                <span className="stat-main">Today</span>
              </div>
            </div>
          </div>

          <div className="dashboard-grid-matching animate-fade-in">
            {/* Left Col: Success & Distribution */}
            <div className="dashboard-col">
              <div className="dashboard-card matching-card">
                <div className="card-header-simple">
                  <div className="header-flex-compact">
                    <h3>Crop Distribution</h3>
                    <span className="badge-mini-text">Global Mix</span>
                  </div>
                </div>
                <div className="chart-container" style={{height: '180px'}}>
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={65}
                        paddingAngle={8}
                        dataKey="value"
                        stroke="none"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px rgba(0,0,0,0.05)', fontSize: '12px'}}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="dashboard-card matching-card">
                <div className="card-header-simple">
                  <div className="header-flex-compact">
                    <h3>Success Trend</h3>
                    <span className="badge-mini-text">Precision Analytics</span>
                  </div>
                </div>
                <div className="chart-container" style={{height: '180px'}}>
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <LineChart data={timelineData}>
                      <defs>
                        <linearGradient id="colorConf" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.02)" />
                      <XAxis dataKey="time" stroke="#94a3b8" fontSize={8} tickLine={false} axisLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={8} tickLine={false} axisLine={false} domain={[0, 100]} />
                      <Tooltip 
                        contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px rgba(0,0,0,0.05)', fontSize: '12px'}}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="confidence" 
                        stroke="#059669" 
                        strokeWidth={3} 
                        dot={false}
                        activeDot={{r: 4, stroke: '#fff', strokeWidth: 2}} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Right Col: Refined History */}
            <div className="dashboard-col">
              <div className="dashboard-card matching-card flex-1">
                <div className="card-header-simple">
                  <div className="header-flex-compact">
                    <h3>Field Analysis Log</h3>
                    <Activity size={14} color="#94a3b8" />
                  </div>
                </div>
                <div className="table-wrapper-ultra-compact">
                  <table className="alerts-table-simple">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Crop Target</th>
                        <th>Prob.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.slice(0, 10).map((item) => (
                        <tr key={item.id}>
                          <td style={{fontSize: '0.7rem', color: '#64748b'}}>{new Date(item.timestamp).toLocaleDateString([], {month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'})}</td>
                          <td>
                            <div className="crop-pill-pro">
                              <Leaf size={10} color="#059669" />
                              <span>{item.predicted_crop}</span>
                            </div>
                          </td>
                          <td>
                            <div className="prob-indicator">
                              <div className="prob-dot" style={{background: item.confidence > 0.8 ? '#10b981' : '#f59e0b'}}></div>
                              <span>{Math.round(item.confidence * 100)}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
;
};

export default Analytics;
