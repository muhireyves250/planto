import React from 'react';
import {
  Sprout,
  Layers,
  AlertTriangle,
  Zap,
  CloudSun,
  Loader2,
  Droplets,
  Wind,
  Bell,
  CheckCircle2
} from 'lucide-react';
import ActiveCropsSummary from './ActiveCropsSummary';
import TodayActions from './TodayActions';

export default function FarmerDashboardView({
  greeting,
  firstName,
  bannerSubtitle,
  farmsCount,
  cropsCount,
  alerts = [],
  latestHealthScore,
  weatherLoading,
  weatherData,
  weatherContextLine,
  weatherTimestamp,
  crops = [],
  setSoilTestParams
}) {
  return (
    <div className="dashboard-view animate-2" style={{ paddingTop: 0 }}>
      {/* Section 1 — Personalised Banner */}
      <div className="pro-welcome-banner farmer-banner">
        <div className="banner-content">
          <h2>{greeting}, {firstName}</h2>
          <p>{bannerSubtitle}</p>
        </div>
        <div className="banner-icon">
          <Sprout size={120} color="rgba(255,255,255,0.1)" />
        </div>
      </div>

      {/* Section 2 — Stats Strip */}
      <div className="stats-strip animate-1">
        {farmsCount !== undefined && (
          <div className="stat-pill-card">
            <div className="stat-icon-circle blue-soft"><Layers size={20} color="#3b82f6" /></div>
            <div className="stat-data">
              <span className="stat-label">My Farms</span>
              <span className="stat-main">{farmsCount} {farmsCount === 1 ? 'Farm' : 'Farms'}</span>
            </div>
          </div>
        )}
        <div className="stat-pill-card">
          <div className="stat-icon-circle green-soft"><Sprout size={20} color="#10b981" /></div>
          <div className="stat-data">
            <span className="stat-label">Crops Planted</span>
            <span className="stat-main">{cropsCount} {cropsCount === 1 ? 'Crop' : 'Crops'}</span>
          </div>
        </div>
        <div className="stat-pill-card">
          <div className="stat-icon-circle orange-soft"><AlertTriangle size={20} color="#f59e0b" /></div>
          <div className="stat-data">
            <span className="stat-label">Active Alerts</span>
            <span className="stat-main">{alerts.length === 0 ? 'No Issues' : `${alerts.length} Active`}</span>
          </div>
        </div>
        <div className="stat-pill-card">
          <div className="stat-icon-circle yellow-soft"><Zap size={20} color="#eab308" /></div>
          <div className="stat-data">
            <span className="stat-label">Soil Health</span>
            <span className="stat-main">
              {latestHealthScore !== null && latestHealthScore !== undefined ? `${Math.round(latestHealthScore)}/100` : 'No Data'}
            </span>
          </div>
        </div>
      </div>

      <div className="dashboard-grid-matching animate-3">
        <div className="dashboard-col">
          {/* Weather Card */}
          <div className="dashboard-card matching-card glass-morph">
            <div className="card-header-simple"><h3><CloudSun size={20} color="var(--accent-blue)" /> Weather Today</h3></div>
            {weatherLoading ? (
              <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1.5rem 0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600}}>
                <Loader2 size={16} style={{animation: 'spin 1s linear infinite'}} /> Fetching weather...
              </div>
            ) : !weatherData ? (
              <div style={{padding: '1.25rem 0.5rem', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600}}>
                Weather unavailable. Add a location to your farm to enable this.
              </div>
            ) : (
              <>
                <div className="weather-summary" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem'}}>
                  <div style={{textAlign: 'center'}}>
                    <div style={{fontSize: '2.8rem', fontWeight: 800, color: 'var(--bg-sidebar)', letterSpacing: '-2px'}}>{weatherData.temp}°C</div>
                    <div className="badge-mini-text" style={{background: 'var(--green-soft)', color: 'var(--accent-emerald)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800}}>{(weatherData.condition || 'Clear').toUpperCase()}</div>
                  </div>
                  <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
                    <div className="weather-pill"><Droplets size={16} color="var(--accent-blue)" /> <div className="pill-text"><span className="pill-label">Humidity</span><span className="pill-val">{weatherData.humidity}%</span></div></div>
                    <div className="weather-pill"><Wind size={16} color="var(--text-muted)" /> <div className="pill-text"><span className="pill-label">Wind Speed</span><span className="pill-val">{weatherData.windSpeed ?? '--'} km/h</span></div></div>
                  </div>
                </div>
                {weatherContextLine && (
                  <div style={{marginTop: '0.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', padding: '0 0.5rem 0.25rem'}}>
                    {weatherContextLine}
                  </div>
                )}
                {weatherTimestamp && (
                  <div style={{fontSize: '0.68rem', color: 'var(--text-muted)', opacity: 0.7, padding: '0 0.5rem 0.25rem'}}>
                    {weatherTimestamp}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Alerts Card */}
          <div className="dashboard-card matching-card">
            <div className="card-header-simple"><h3><Bell size={20} color="var(--accent-rose)" /> Farm Warnings & Notifications</h3></div>
            <div className="table-wrapper-ultra-compact" style={{marginTop: '0.5rem'}}>
              {alerts.length > 0 ? (
                <table className="alerts-table-simple" style={{width: '100%', borderCollapse: 'separate', borderSpacing: '0 0.75rem'}}>
                  <tbody>
                    {alerts.map((alert, idx) => (
                      <tr key={alert.id} className={`animate-${(idx % 5) + 1}`}>
                        <td style={{background: 'rgba(0,0,0,0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.02)'}}>
                          <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                            <div className={`status-tag-mini ${alert.type}`} style={{
                              background: alert.type === 'critical' ? '#fee2e2' : '#fef3c7',
                              color: alert.type === 'critical' ? '#ef4444' : '#f59e0b',
                              padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 800
                            }}>
                              {alert.type.toUpperCase()}
                            </div>
                            <span style={{fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-dark)'}}>{alert.message}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="all-operational-state" style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '2.25rem 1.5rem',
                  background: 'var(--green-soft)',
                  borderRadius: '16px',
                  border: '1px dashed rgba(16, 185, 129, 0.25)',
                  textAlign: 'center',
                  gap: '0.75rem',
                  transition: 'all 0.3s'
                }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    background: '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                  }}>
                    <CheckCircle2 size={22} />
                  </div>
                  <div>
                    <h4 style={{fontSize: '0.85rem', fontWeight: 800, color: 'var(--bg-sidebar)', marginBottom: '0.2rem'}}>Status: Excellent</h4>
                    <p style={{fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)'}}>Your farm is doing great. No issues found today.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 3 — Right Column: Active Crops + Today's Actions */}
        <div className="dashboard-col">
          <ActiveCropsSummary crops={crops} />
          <TodayActions crops={crops} alerts={alerts} setSoilTestParams={setSoilTestParams} />
        </div>
      </div>
    </div>
  );
}
