import React, { useState, lazy, Suspense } from 'react';
import { useNavigate, useLocation, Routes, Route, Navigate, Link } from 'react-router-dom';
import LandingPage from './LandingPage';
import AuthPage from './AuthPage';
import ActiveCropsSummary from './components/dashboard/ActiveCropsSummary';
import TodayActions from './components/dashboard/TodayActions';
import MobileDashboard from './components/MobileDashboard';
import MobileBottomNav from './components/MobileBottomNav';

const Reports = lazy(() => import('./Reports'));
const Settings = lazy(() => import('./Settings'));
const Monitoring = lazy(() => import('./pages/Monitoring'));
const SoilTest = lazy(() => import('./pages/SoilTest'));
import { monitoringApi } from './api/monitoringApi';
import { farmApi, weatherApi, alertApi } from './api/farmApi';
import { getCached, setCached } from './api/cache';
import {
  Search,
  Bell,
  MessageSquare,
  Leaf,
  CloudSun,
  MapPin,
  Loader2,
  Droplets,
  Sprout,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Layers,
  Activity,
  Wand2,
  Zap,
  Wind,
  LogOut,
  History,
  Settings as LucideSettings
} from 'lucide-react';


function App() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [locationActive, setLocationActive] = useState(true);
  const [toast, setToast] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [unreadAlertsCount, setUnreadAlertsCount] = useState(0);
  const [farmsCount, setFarmsCount] = useState(0);
  const [cropsCount, setCropsCount] = useState(0);
  const [crops, setCrops] = useState([]);
  const [latestHealthScore, setLatestHealthScore] = useState(null);
  const [weatherFetchedAt, setWeatherFetchedAt] = useState(null);
  
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('planto_user');
      return (savedUser && savedUser !== 'undefined') ? JSON.parse(savedUser) : null;
    } catch (err) {
      console.error("Failed to parse planto_user:", err);
      localStorage.removeItem('planto_user');
      return null;
    }
  });
  
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      const savedUser = localStorage.getItem('planto_user');
      return !!(savedUser && savedUser !== 'undefined');
    } catch (err) {
      return false;
    }
  });
  
  const navigate = useNavigate();
  const location = useLocation();

  const activeTab = location.pathname.slice(1) || 'dashboard';
  const setActiveTab = (tab) => navigate(`/${tab}`);
  const [headerActions, setHeaderActions] = useState(null);
  const [soilTestParams, setSoilTestParams] = useState({ mode: 'prediction', plantId: null, cropName: '' });
  const [weatherData, setWeatherData] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('planto_user');
    setIsAuthenticated(false);
    setUser(null);
    setResult(null);
    navigate('/');
  };

  const onLoginSuccess = (userData) => {
    localStorage.setItem('planto_user', JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
    navigate('/dashboard');
  };

  const handlePlantCrop = async () => {
    if (!result?.crop) return;
    
    if (user?.id) {
      try {
        setLoading(true);
        await monitoringApi.plantCrop(user.id, result.crop, 'pending');
        setToast({ type: 'success', message: `${result.crop} has been added to your monitoring list!` });
        setTimeout(() => setToast(null), 5000);
        setResult(null);
        setActiveTab('monitoring');
      } catch (err) {
        setToast({ type: 'error', message: 'Failed to plant crop. Please try again.' });
        setTimeout(() => setToast(null), 5000);
      } finally {
        setLoading(false);
      }
    } else {
      try {
        setLoading(true);
        const guestCrops = JSON.parse(localStorage.getItem('planto_guest_crops')) || [];
        const newGuestCrop = {
          id: "guest-" + Math.random().toString(36).substring(2, 11),
          crop_name: result.crop,
          planting_date: new Date().toISOString().split('T')[0],
          status: "pending",
          monitoring_data: [{
            recorded_at: new Date().toISOString(),
            nitrogen: 120,
            phosphorus: 60,
            potassium: 40,
            ph: 6.5,
            moisture: 75.0,
            temperature: 24.0,
            humidity: 62.0
          }],
          health_history: [{
            id: "hist-1",
            health_score: 100.0,
            risk_level: "Healthy",
            stage: "Germination",
            notes: "Initial soil configuration.",
            created_at: new Date().toISOString()
          }],
          fertilizer_plans: [{
            id: "fert-1",
            fertilizer_type: "None",
            quantity_kg: 0,
            explanation: "Optimal soil balance. No synthetic adjustments needed.",
            created_at: new Date().toISOString()
          }]
        };
        guestCrops.push(newGuestCrop);
        localStorage.setItem('planto_guest_crops', JSON.stringify(guestCrops));
        
        setToast({ type: 'success', message: `${result.crop} has been added to your offline monitoring list!` });
        setTimeout(() => setToast(null), 5000);
        setResult(null);
        setActiveTab('monitoring');
      } catch (err) {
        setToast({ type: 'error', message: 'Failed to plant crop locally.' });
        setTimeout(() => setToast(null), 5000);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDeclineCrop = () => {
    setResult(null);
    setToast({ type: 'success', message: 'Crop recommendation declined. Form cleared.' });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchAlerts = async () => {
    if (!isAuthenticated) return;
    try {
      const cached = getCached('alerts');
      if (cached) { setAlerts(cached); setUnreadAlertsCount(cached.filter(a => !a.is_read).length); }
      const data = await alertApi.getAlerts();
      setAlerts(data);
      setUnreadAlertsCount(data.filter(a => !a.is_read).length);
      setCached('alerts', data);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
      if (err.status === 401) handleLogout();
    }
  };

  const fetchDashboardStats = async () => {
    if (!isAuthenticated || !user?.id) return;
    try {
      const cacheKey = `dashboard_${user.id}`;
      const cached = getCached(cacheKey);
      if (cached) {
        setFarmsCount(cached.farmsCount);
        setCropsCount(cached.cropsCount);
        setCrops(cached.crops);
        setLatestHealthScore(cached.latestHealthScore);
      }

      const [farmsData, cropsData] = await Promise.all([
        farmApi.getFarms(),
        monitoringApi.getMyCrops(user.id)
      ]);
      setFarmsCount(farmsData.length);
      setCropsCount(cropsData.length);
      setCrops(cropsData);

      let bestScore = null;
      let bestDate = null;
      for (const crop of cropsData) {
        if (crop.health_history?.length) {
          const last = crop.health_history[crop.health_history.length - 1];
          if (!bestDate || new Date(last.created_at) > new Date(bestDate)) {
            bestDate = last.created_at;
            bestScore = last.health_score ?? null;
          }
        }
      }
      setLatestHealthScore(bestScore);
      setCached(cacheKey, { farmsCount: farmsData.length, cropsCount: cropsData.length, crops: cropsData, latestHealthScore: bestScore });

      // Weather: show cached immediately, refresh in background
      const firstFarm = farmsData[0];
      const cachedWeather = getCached('weather');
      if (cachedWeather) {
        setWeatherData(cachedWeather);
        setWeatherFetchedAt(new Date(cachedWeather._ts || Date.now()));
      } else {
        setWeatherLoading(true);
      }

      const fetchWeather = async (lat, lng) => {
        try {
          const data = await weatherApi.getWeather(lat, lng);
          const w = {
            temp: Math.round(data.temp),
            condition: data.condition,
            humidity: data.humidity,
            windSpeed: data.wind_speed ?? null,
            rainfall: data.rainfall,
            _ts: Date.now(),
          };
          setWeatherData(w);
          setWeatherFetchedAt(new Date());
          setCached('weather', w);
        } catch {
          // leave weatherData as cached or null
        } finally {
          setWeatherLoading(false);
        }
      };

      const geocodeLocation = async (locationText) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationText)}&format=json&limit=1`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const results = await res.json();
          if (results?.[0]) return { lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) };
        } catch {}
        return null;
      };

      const ipGeoFallback = async () => {
        try {
          const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8080';
          const res = await fetch(`${BASE_URL}/weather/geoip`);
          const d = await res.json();
          if (d?.lat && d?.lng) fetchWeather(d.lat, d.lng);
          else setWeatherLoading(false);
        } catch { setWeatherLoading(false); }
      };

      if (firstFarm?.location_lat && firstFarm?.location_lng) {
        // Priority 1: stored farm GPS coordinates
        fetchWeather(firstFarm.location_lat, firstFarm.location_lng);
      } else if (navigator.geolocation) {
        // Priority 2: live browser GPS — ask immediately
        navigator.geolocation.getCurrentPosition(
          (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
          async () => {
            // Denied/failed → Priority 3: farm_location text geocoding
            const storedUser = (() => { try { return JSON.parse(localStorage.getItem('planto_user')); } catch { return null; } })();
            const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8080';
            try {
              const settingsRes = await fetch(`${BASE_URL}/settings/${storedUser?.id}`);
              if (settingsRes.ok) {
                const profile = await settingsRes.json();
                if (profile?.farm_location) {
                  const coords = await geocodeLocation(profile.farm_location);
                  if (coords) { fetchWeather(coords.lat, coords.lng); return; }
                }
              }
            } catch {}
            // Priority 4: IP-based geolocation
            await ipGeoFallback();
          },
          { timeout: 8000 }
        );
      } else {
        // No geolocation API → try farm_location then IP
        const storedUser = (() => { try { return JSON.parse(localStorage.getItem('planto_user')); } catch { return null; } })();
        const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8080';
        try {
          const settingsRes = await fetch(`${BASE_URL}/settings/${storedUser?.id}`);
          if (settingsRes.ok) {
            const profile = await settingsRes.json();
            if (profile?.farm_location) {
              const coords = await geocodeLocation(profile.farm_location);
              if (coords) { fetchWeather(coords.lat, coords.lng); return; }
            }
          }
        } catch {}
        await ipGeoFallback();
      }
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
    }
  };

  React.useEffect(() => {
    if (isAuthenticated) {
      Promise.all([fetchAlerts(), fetchDashboardStats()]);
      const interval = setInterval(() => {
        Promise.all([fetchAlerts(), fetchDashboardStats()]);
      }, 30000);
      return () => clearInterval(interval);
    } else {
      const guestCrops = JSON.parse(localStorage.getItem('planto_guest_crops')) || [];
      setCropsCount(guestCrops.length);
      setFarmsCount(0);
    }
  }, [isAuthenticated, user?.id]);

  React.useEffect(() => {
    setHeaderActions(null);
  }, [activeTab]);

  const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

  const getHeaderInfo = () => {
    switch (activeTab) {
      case 'dashboard':
        return {
          title: "Home",
          badge: "MY FARM OVERVIEW",
          subtext: (
            <>
              <Wand2 size={14} color="var(--accent-emerald)" /> My Farm Hub • {today}
            </>
          )
        };
      case 'soil-test':
        return {
          title: "Soil Testing Lab",
          badge: "READY",
          subtext: (
            <>
              <Activity size={14} color="#10b981" className="lucide-pulse" /> Diagnostic System Online • {today}
            </>
          )
        };
      case 'monitoring':
        return {
          title: "Monitoring",
          badge: "CORE INTELLIGENCE",
          subtext: (
            <>
              <TrendingUp size={14} color="#10b981" /> Post-Planting Health Tracking Active
            </>
          )
        };
      case 'crop-status':
        return {
          title: "Crop Status",
          badge: "LIFECYCLE HISTORY",
          subtext: (
            <>
              <History size={14} color="var(--accent-emerald)" className="lucide-pulse" /> Full visibility of farming lifecycle
            </>
          )
        };
      case 'settings':
        return {
          title: "System Settings",
          badge: "PRO-FARMER",
          subtext: (
            <>
              <LucideSettings size={12} color="var(--accent-emerald)" /> Platform Configuration
            </>
          )
        };
      default:
        return { title: "", badge: "", subtext: "" };
    }
  };

  const headerInfo = getHeaderInfo();

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<AuthPage onLogin={onLoginSuccess} onBack={() => navigate('/')} />} />
        <Route path="/signup" element={<AuthPage initialIsLogin={false} onLogin={onLoginSuccess} onBack={() => navigate('/')} />} />
        <Route path="*" element={<LandingPage onLogin={() => navigate('/login')} onSignup={() => navigate('/signup')} />} />
      </Routes>
    );
  }

  return (
    <div className="app-wrapper">
      
      {/* Left Main Area */}
      <main className="main-area">
        
        {/* Top Navigation */}
        <nav className="top-nav animate-1">
          <div className="brand">
            <Leaf fill="#2a4335" color="#2a4335" size={24} />
            Planto
          </div>
          <div className="nav-links">
            {(user?.role === 'farmer' || user?.role === 'agronomist' || user?.role === 'admin') && (
              <>
                <Link to="/dashboard" className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}>Home</Link>
                {user?.role === 'farmer' && <Link to="/soil-test" className={`nav-item ${activeTab === 'soil-test' ? 'active' : ''}`}>Soil Test</Link>}
                <Link to="/monitoring" className={`nav-item ${activeTab === 'monitoring' ? 'active' : ''}`}>Monitoring</Link>
                <Link to="/crop-status" className={`nav-item ${activeTab === 'crop-status' ? 'active' : ''}`}>Crop Status</Link>
                <Link to="/settings" className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}>Settings</Link>
              </>
            )}
          </div>
        </nav>

        <div className="scrollable-content">
          {isAuthenticated && (
            <header className="page-header pro-header animate-2" style={{ marginBottom: '1.5rem' }}>
              <div className="header-left">
                <h1 className="welcome-text">
                  {headerInfo.title} <span className="pro-badge">{headerInfo.badge}</span>
                </h1>
                <div className="date-text">{headerInfo.subtext}</div>
              </div>
              {headerActions && <div className="header-actions">{headerActions}</div>}
            </header>
          )}

          <Suspense fallback={
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
                  <div className="dashboard-card matching-card skeleton-card skeleton-shimmer" style={{height:'220px'}}></div>
                  <div className="dashboard-card matching-card skeleton-card skeleton-shimmer" style={{height:'160px'}}></div>
                </div>
                <div className="dashboard-col">
                  <div className="dashboard-card matching-card skeleton-card skeleton-shimmer" style={{height:'400px'}}></div>
                </div>
              </div>
            </div>
          }>
          <Routes>
            <Route path="/soil-test" element={
              <SoilTest
                user={user}
                params={soilTestParams}
                setParams={setSoilTestParams}
                setActiveTab={setActiveTab}
                setHeaderActions={setHeaderActions}
                setResult={setResult}
                setToast={setToast}
              />
            } />
            <Route path="/crop-status" element={<Reports user={user} setHeaderActions={setHeaderActions} />} />
            <Route path="/monitoring" element={
              <Monitoring
                user={user}
                setActiveTab={setActiveTab}
                setSoilTestParams={setSoilTestParams}
                setHeaderActions={setHeaderActions}
              />
            } />
            <Route path="/settings" element={<Settings user={user} setUser={setUser} setHeaderActions={setHeaderActions} />} />
<Route path="/dashboard" element={(() => {
              if (window.innerWidth <= 768) return (
                <MobileDashboard
                  user={user} crops={crops}
                  farmsCount={farmsCount} cropsCount={cropsCount}
                  alerts={alerts} latestHealthScore={latestHealthScore}
                  weatherData={weatherData} weatherLoading={weatherLoading}
                />
              );

              const hour = new Date().getHours();
              const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
              const firstName = user?.full_name?.split(' ')[0] || 'Farmer';
              const bannerSubtitle = cropsCount === 0
                ? 'Start by running a soil test to find the best crop for your land.'
                : `You have ${cropsCount} crop${cropsCount === 1 ? '' : 's'} growing. Here's your farm overview for today.`;

              const weatherContextLine = (() => {
                if (!weatherData?.condition) return null;
                const cond = (weatherData.condition || '').toLowerCase();
                const rain = parseFloat(weatherData.rainfall) || 0;
                if (rain > 10 || cond.includes('rain') || cond.includes('storm')) return 'Heavy rain — avoid fertilising today.';
                if (cond.includes('cloud')) return 'Overcast — moderate conditions for field work.';
                return 'Good conditions for field work today.';
              })();

              const weatherTimestamp = (() => {
                if (!weatherFetchedAt) return null;
                const mins = Math.floor((Date.now() - weatherFetchedAt.getTime()) / 60000);
                return mins < 1 ? 'Updated just now' : `Updated ${mins} min ago`;
              })();

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
                <div className="stat-pill-card">
                  <div className="stat-icon-circle blue-soft"><Layers size={20} color="#3b82f6" /></div>
                  <div className="stat-data">
                    <span className="stat-label">My Farms</span>
                    <span className="stat-main">{farmsCount} {farmsCount === 1 ? 'Farm' : 'Farms'}</span>
                  </div>
                </div>
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
                      {latestHealthScore !== null ? `${Math.round(latestHealthScore)}/100` : 'No Data'}
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
                  <TodayActions crops={crops} alerts={alerts} />
                </div>
              </div>
            </div>
              );
            })()} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
          </Suspense>
        </div>
      </main>

      {/* Right Sidebar */}
      <aside className="right-sidebar animate-4">
        <div className="sidebar-bg"></div>
        <div className="sidebar-content">
          
          <div className="sidebar-top">
            <button className="icon-btn" onClick={() => setLocationActive(!locationActive)} title={locationActive ? "Location On" : "Location Off"}>
              <MapPin size={20} style={{ color: locationActive ? '#10b981' : 'inherit', opacity: locationActive ? 1 : 0.5 }} />
            </button>
            <button className="icon-btn"><Search size={20} /></button>
            <button className="icon-btn"><MessageSquare size={20} /></button>
            <button className="icon-btn" style={{ position: 'relative' }}>
              <Bell size={20} />
              {unreadAlertsCount > 0 && (
                <span style={{ 
                  position: 'absolute', top: -5, right: -5, background: '#ef4444', 
                  color: 'white', borderRadius: '50%', width: 15, height: 15, 
                  fontSize: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center' 
                }}>
                  {unreadAlertsCount}
                </span>
              )}
            </button>
            <button className="icon-btn" onClick={handleLogout} title="Log Out"><LogOut size={20} /></button>
            <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" alt="Profile" className="profile-avatar" />
          </div>

          {!result ? (
            <div className="awaiting-state">
              <div className="land-health-meter">
                <svg viewBox="0 0 100 100" className="meter-svg">
                  <circle className="meter-bg" cx="50" cy="50" r="45" />
                  <circle className="meter-fill" cx="50" cy="50" r="45" />
                </svg>
                <div className="meter-content">
                  <div className="meter-val">--</div>
                  <div className="meter-label">SOIL HEALTH</div>
                </div>
              </div>
              <div style={{marginTop: '1.5rem'}}>
                <div className="sidebar-title" style={{color: 'white', textAlign: 'center'}}>Welcome, {user?.full_name?.split(' ')[0] || 'Farmer'}</div>
                <div style={{fontSize: '0.85rem', opacity: 0.8, textAlign: 'center'}}>Please test your soil to see which crop is best to plant.</div>
              </div>
            </div>
          ) : (
            <div className="report-section">
              <h2 className="sidebar-title">Your Soil Report</h2>
              <p className="sidebar-subtitle">Here are the results found by our AI today.</p>
              
              <div className="result-crop-card">
                <div className="crop-icon-wrapper">
                  <Leaf size={24} />
                </div>
                <div className="crop-details">
                  <div className="crop-label">Best Crop to Plant</div>
                  <div className="crop-name">{result.crop}</div>
                </div>
                <div className="confidence-badge">
                  {Math.round((result.confidence || 0) * 100)}%
                </div>
              </div>

              <h3 style={{fontFamily: 'var(--font-heading)', fontSize: '1.1rem', marginBottom: '1rem'}}>Steps to Take Next</h3>
              
              <div style={{overflowY: 'auto', paddingRight: '0.5rem', marginBottom: '4rem'}}>
                {(typeof result.advice === 'string' ? result.advice.split('. ') : result.advice).map((step, i) => {
                  if(!step) return null;
                  return (
                    <div key={i} className="plan-item">
                      <div className="plan-icon">
                        <span style={{fontSize: '0.8rem', fontWeight: 800}}>{i+1}</span>
                      </div>
                      <div className="plan-text">
                        <h4>Step {i+1}</h4>
                        <p>{step}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{
                position: 'absolute', bottom: '0', left: '0', right: '0', 
                padding: '1.5rem', background: 'linear-gradient(to top, var(--bg-sidebar) 85%, transparent)',
                borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                display: 'flex', flexDirection: 'column', gap: '0.75rem',
                zIndex: 10
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.7)', textAlign: 'center' }}>
                  Plant this recommended crop on your farm?
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    className="action-btn-pro" 
                    style={{ flex: 1, justifyContent: 'center', background: 'var(--accent-emerald)', color: 'var(--bg-sidebar)', padding: '0.6rem 0.5rem', fontSize: '0.8rem' }}
                    onClick={handlePlantCrop}
                    disabled={loading}
                  >
                    {loading ? <Loader2 size={14} className="lucide-spin" style={{ animation: 'spin 1s linear infinite' }} /> : <Sprout size={14} />}
                    Accept & Plant
                  </button>
                  <button 
                    className="action-btn-pro" 
                    style={{ flex: 1, justifyContent: 'center', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#fca5a5', padding: '0.6rem 0.5rem', fontSize: '0.8rem' }}
                    onClick={handleDeclineCrop}
                    disabled={loading}
                  >
                    Decline
                  </button>
                </div>
              </div>

            </div>
          )}
          

        </div>
      </aside>

      {/* Toast Notification */}
      {toast && (
        <div className={`pro-toast ${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .pro-toast {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          background: white;
          padding: 1rem 1.5rem;
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          gap: 0.75rem;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
          animation: slideUp 0.3s ease-out forwards;
          z-index: 1000;
          font-size: 0.9rem;
        }

        .pro-toast.success {
          border-left: 4px solid var(--accent-emerald);
          color: var(--bg-sidebar);
        }
        
        .pro-toast.success svg {
          color: var(--accent-emerald);
        }

        .pro-toast.error {
          border-left: 4px solid var(--accent-rose);
          color: var(--text-dark);
        }
        
        .pro-toast.error svg {
          color: var(--accent-rose);
        }

        @keyframes slideUp {
          from { transform: translateY(100px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
      <MobileBottomNav />
    </div>
  );
}

export default App;
