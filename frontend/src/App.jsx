import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate, useLocation, Routes, Route, Navigate, Link } from 'react-router-dom';
import LandingPage from './LandingPage';
import AuthPage from './AuthPage';
import ActiveCropsSummary from './components/dashboard/ActiveCropsSummary';
import TodayActions from './components/dashboard/TodayActions';
import MobileDashboard from './components/MobileDashboard';
import MobileBottomNav from './components/MobileBottomNav';
import FarmerDashboardView from './components/dashboard/FarmerDashboardView';

const Reports = lazy(() => import('./Reports'));
const Settings = lazy(() => import('./Settings'));
const Monitoring = lazy(() => import('./pages/Monitoring'));
const SoilTest = lazy(() => import('./pages/SoilTest'));
const AgronomistDashboard = lazy(() => import('./pages/AgronomistDashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
import { useNotifications } from './hooks/useNotifications';
import NotificationCenter from './components/NotificationCenter';
import { monitoringApi } from './api/monitoringApi';
import { agronomistApi } from './api/agronomistApi';
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
  Mail,
  History,
  Settings as LucideSettings,
  ArrowLeft
} from 'lucide-react';


function App() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [restChoice, setRestChoice] = useState(null); // null | 'plant' | 'rest'
  const [locationActive, setLocationActive] = useState(true);
  const [toast, setToast] = useState(null);
  // Alert states managed by useNotifications hook now
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
  
  const notifications = useNotifications(user);
  const { alerts, unread: unreadAlertsCount, panelOpen, setPanelOpen } = notifications;

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
  const [impersonatedFarmId, setImpersonatedFarmId] = useState(() => sessionStorage.getItem('planto_impersonated_farm_id') || null);
  const [impersonatedFarm, setImpersonatedFarm] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [sidebarView, setSidebarView] = useState('default'); // 'default' | 'notifications' | 'search' | 'location'
  const [searchQuery, setSearchQuery] = useState('');
  const [locationLabel, setLocationLabel] = useState(null);
  const [locationInput, setLocationInput] = useState('');
  const [locationStatus, setLocationStatus] = useState(null); // null | 'loading' | 'success' | 'error'
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [reportModal, setReportModal] = useState(null); // null | 'success' | 'error'
  const [avatar, setAvatar] = useState(() => { try { return localStorage.getItem('planto_avatar') || null; } catch { return null; } });
  const avatarInputRef = React.useRef(null);

  useEffect(() => {
    if (impersonatedFarmId) {
      sessionStorage.setItem('planto_impersonated_farm_id', impersonatedFarmId);
    } else {
      sessionStorage.removeItem('planto_impersonated_farm_id');
    }
  }, [impersonatedFarmId]);

  const applyWeatherCoords = async (lat, lng, label) => {
    setWeatherLoading(true);
    try {
      const data = await weatherApi.getWeather(lat, lng);
      const w = { temp: Math.round(data.temp), condition: data.condition, humidity: data.humidity, windSpeed: data.wind_speed ?? null, rainfall: data.rainfall, _ts: Date.now() };
      setWeatherData(w);
      setWeatherFetchedAt(new Date());
      setCached('weather', w);
      if (label) setLocationLabel(label);
    } catch {
      // leave previous data
    } finally {
      setWeatherLoading(false);
    }
  };

  const handleManualLocation = async (text) => {
    if (!text.trim()) return;
    setLocationStatus('loading');
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(text)}&format=json&limit=1`, { headers: { 'Accept-Language': 'en' } });
      const results = await res.json();
      if (!results?.[0]) { setLocationStatus('error'); return; }
      const { lat, lon, display_name } = results[0];
      const label = display_name.split(',').slice(0, 2).join(',').trim();
      await applyWeatherCoords(parseFloat(lat), parseFloat(lon), label);
      setLocationStatus('success');
      setLocationActive(true);
    } catch {
      setLocationStatus('error');
    }
  };

  const handleGpsLocation = () => {
    if (!navigator.geolocation) { setLocationStatus('error'); return; }
    setLocationStatus('loading');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        await applyWeatherCoords(pos.coords.latitude, pos.coords.longitude, 'GPS location');
        setLocationStatus('success');
        setLocationActive(true);
      },
      () => setLocationStatus('error'),
      { timeout: 8000 }
    );
  };

  const confirmLogout = () => setShowLogoutModal(true);

  const handleLogout = () => {
    setShowLogoutModal(false);
    setLoggingOut(true);
    setTimeout(() => {
      localStorage.removeItem('planto_user');
      localStorage.removeItem('planto_avatar');
      setIsAuthenticated(false);
      setUser(null);
      setAvatar(null);
      setResult(null);
      setLoggingOut(false);
      navigate('/');
    }, 900);
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target.result;
      setAvatar(base64);
      localStorage.setItem('planto_avatar', base64);
      // Persist to backend
      const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8080';
      try {
        await fetch(`${BASE_URL}/settings/${user?.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user?.access_token}` },
          body: JSON.stringify({ avatar: base64 }),
        });
      } catch {}
    };
    reader.readAsDataURL(file);
  };

  const onLoginSuccess = async (userData) => {
    localStorage.setItem('planto_user', JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
    // Load avatar from backend
    try {
      const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8080';
      const res = await fetch(`${BASE_URL}/settings/${userData.id}`, {
        headers: { 'Authorization': `Bearer ${userData.access_token}` },
      });
      if (res.ok) {
        const profile = await res.json();
        if (profile.avatar) {
          setAvatar(profile.avatar);
          localStorage.setItem('planto_avatar', profile.avatar);
        }
      }
    } catch {}
    navigate(
      userData.role === 'agronomist' ? '/my-farms' :
      userData.role === 'admin' ? '/admin' :
      '/dashboard'
    );
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
        setRestChoice(null);
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
        setRestChoice(null);
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
    setRestChoice(null);
    setToast({ type: 'success', message: 'Crop recommendation declined. Form cleared.' });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchDashboardStats = async () => {
    if (!isAuthenticated || !user?.id) return;
    try {
      let farmsData = [];
      let cropsData = [];
      let firstFarm = null;
      let bestScore = null;

      if (impersonatedFarmId) {
        const farm = await agronomistApi.getFarmDetail(impersonatedFarmId);
        setImpersonatedFarm(farm);
        firstFarm = farm;
        farmsData = [farm];
        cropsData = farm.crops || [];
        setFarmsCount(1);
        setCropsCount(farm.active_crops || cropsData.length);
        setCrops(cropsData);
        bestScore = farm.health_score ?? null;
        setLatestHealthScore(bestScore);
        // Note: Agronomist viewing farm alerts could be handled by a specific hook.
        // For now, useNotifications handles the currently logged-in user's alerts.
      } else {
        const cacheKey = `dashboard_${user.id}`;
        const cached = getCached(cacheKey);
        if (cached) {
          setFarmsCount(cached.farmsCount);
          setCropsCount(cached.cropsCount);
          setCrops(cached.crops);
          setLatestHealthScore(cached.latestHealthScore);
        }

        const [fetchedFarms, fetchedCrops] = await Promise.all([
          farmApi.getFarms(),
          monitoringApi.getMyCrops(user.id)
        ]);
        farmsData = fetchedFarms;
        cropsData = fetchedCrops;
        setFarmsCount(farmsData.length);
        setCropsCount(cropsData.length);
        setCrops(cropsData);

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
        firstFarm = farmsData[0];
      }

      // Weather: show cached immediately, refresh in background
      // firstFarm is already defined above
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
      fetchDashboardStats();
      const interval = setInterval(() => {
        fetchDashboardStats();
      }, 30000);
      return () => clearInterval(interval);
    } else {
      const guestCrops = JSON.parse(localStorage.getItem('planto_guest_crops')) || [];
      setCropsCount(guestCrops.length);
      setFarmsCount(0);
    }
  }, [isAuthenticated, user?.id, impersonatedFarmId]);

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
            {user?.role === 'agronomist' && !impersonatedFarmId ? (
              <>
                <Link to="/my-farms" className={`nav-item ${activeTab === 'my-farms' ? 'active' : ''}`}>My Farms</Link>
                <Link to="/settings" className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}>Settings</Link>
              </>
            ) : (user?.role === 'farmer' || user?.role === 'admin' || impersonatedFarmId) && (
              <>
                {impersonatedFarmId && (
                  <button onClick={() => { setImpersonatedFarmId(null); setImpersonatedFarm(null); navigate('/my-farms'); }} className="nav-item" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1.5px solid rgba(239, 68, 68, 0.2)', fontWeight: 800, padding: '0.4rem 0.8rem', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', marginRight: '0.5rem' }}>
                    <ArrowLeft size={14} /> Exit Farm
                  </button>
                )}
                <Link to="/dashboard" className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}>Home</Link>
                <Link to="/soil-test" className={`nav-item ${activeTab === 'soil-test' ? 'active' : ''}`}>Soil Test</Link>
                <Link to="/monitoring" className={`nav-item ${activeTab === 'monitoring' ? 'active' : ''}`}>Monitoring</Link>
                <Link to="/crop-status" className={`nav-item ${activeTab === 'crop-status' ? 'active' : ''}`}>Crop Status</Link>
                {(!impersonatedFarmId) && <Link to="/settings" className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}>Settings</Link>}
                {user?.role === 'admin' && (
                  <button onClick={() => setActiveTab('admin')} className={`nav-item ${activeTab === 'admin' ? 'active' : ''}`}>
                    Admin
                  </button>
                )}
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
                <FarmerDashboardView
                  greeting={impersonatedFarmId ? "Farm Overview" : greeting}
                  firstName={impersonatedFarmId ? (impersonatedFarm?.farm_name || 'Loading Farm...') : firstName}
                  bannerSubtitle={impersonatedFarmId ? `Managed by ${impersonatedFarm?.farmer?.full_name || 'you'}. ${cropsCount} crops actively monitored.` : bannerSubtitle}
                  farmsCount={impersonatedFarmId ? undefined : farmsCount}
                  cropsCount={cropsCount}
                  alerts={alerts}
                  latestHealthScore={latestHealthScore}
                  weatherLoading={weatherLoading}
                  weatherData={weatherData}
                  weatherContextLine={weatherContextLine}
                  weatherTimestamp={weatherTimestamp}
                  crops={crops}
                  setSoilTestParams={setSoilTestParams}
                />
              );
            })()} />
            <Route path="/" element={<Navigate to={user?.role === 'agronomist' && !impersonatedFarmId ? '/my-farms' : '/dashboard'} replace />} />
            <Route path="/soil-test" element={<SoilTest user={user} impersonatedFarmId={impersonatedFarmId} impersonatedFarm={impersonatedFarm} params={soilTestParams} setParams={setSoilTestParams} setActiveTab={setActiveTab} setHeaderActions={setHeaderActions} setResult={(r) => { setRestChoice(null); setResult(r); }} setToast={setToast} />} />
            <Route path="/monitoring" element={<Monitoring user={user} impersonatedFarmId={impersonatedFarmId} impersonatedFarm={impersonatedFarm} setActiveTab={setActiveTab} setSoilTestParams={setSoilTestParams} setHeaderActions={setHeaderActions} />} />
            <Route path="/crop-status" element={<Reports user={user} impersonatedFarmId={impersonatedFarmId} impersonatedFarm={impersonatedFarm} setHeaderActions={setHeaderActions} setReportModal={setReportModal} />} />
            <Route path="/settings" element={<Settings user={user} onUpdate={(u) => { setUser(u); localStorage.setItem('planto_user', JSON.stringify(u)); }} setHeaderActions={setHeaderActions} />} />
            <Route path="/my-farms" element={
              <AgronomistDashboard
                user={user}
                setHeaderActions={setHeaderActions}
                onSelectFarm={(farm) => {
                  setImpersonatedFarmId(farm.farm_id);
                  navigate('/dashboard');
                }}
              />
            } />
            <Route path="/admin" element={
              user?.role === 'admin'
                ? <AdminDashboard />
                : <Navigate to="/dashboard" replace />
            } />
          </Routes>
          </Suspense>
        </div>
      </main>

      {/* Right Sidebar */}
      <aside className="right-sidebar animate-4">
        <div className="sidebar-bg"></div>
        <div className="sidebar-content">
          
          <div className="sidebar-top">
            <button className="icon-btn" onClick={() => { setSidebarView(v => v === 'location' ? 'default' : 'location'); setLocationStatus(null); setLocationInput(''); }} title="Configure Location">
              <MapPin size={20} style={{ color: sidebarView === 'location' ? '#10b981' : locationActive ? '#10b981' : 'inherit', opacity: locationActive ? 1 : 0.5 }} />
            </button>
            <button className="icon-btn" onClick={() => { setSidebarView(v => v === 'search' ? 'default' : 'search'); setSearchQuery(''); }} title="Search">
              <Search size={20} style={{ color: sidebarView === 'search' ? '#10b981' : 'inherit' }} />
            </button>
            <button className="icon-btn"><MessageSquare size={20} /></button>
            <button className="icon-btn" style={{ position: 'relative' }} onClick={() => setSidebarView(v => v === 'notifications' ? 'default' : 'notifications')}>
              <Bell size={20} style={{ color: sidebarView === 'notifications' ? '#10b981' : 'inherit' }} />
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
            <button className="icon-btn" onClick={confirmLogout} title="Log Out"><LogOut size={20} /></button>
            <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
            <button
              onClick={() => avatarInputRef.current?.click()}
              title="Change profile photo"
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', position: 'relative' }}
            >
              {avatar ? (
                <img src={avatar} alt="Profile" className="profile-avatar" style={{ objectFit: 'cover' }} />
              ) : (
                <div className="profile-avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', fontWeight: 800, fontSize: '0.8rem', letterSpacing: '0.03em' }}>
                  {user?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'}
                </div>
              )}
              <span style={{ position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, background: '#10b981', borderRadius: '50%', border: '1.5px solid #1e362a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.45rem', color: '#fff' }}>✎</span>
            </button>
          </div>

          {sidebarView === 'location' ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              {/* Header */}
              <div style={{ padding: '1.5rem 1.4rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.3rem' }}>
                  <MapPin size={15} style={{ color: '#10b981' }} />
                  <span style={{ color: '#fff', fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.01em' }}>Location</span>
                </div>
                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.02em' }}>
                  Used for live weather on your dashboard
                </div>
              </div>

              <div style={{ padding: '1.25rem 1.4rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                {/* Current location chip */}
                <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.18)', borderRadius: '10px', padding: '0.85rem 1rem' }}>
                  <div style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#10b981', marginBottom: '0.35rem' }}>
                    Active location
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#fff', fontWeight: 600 }}>
                    {locationLabel || (weatherData ? 'Auto-detected' : 'Not set')}
                  </div>
                  {weatherData && (
                    <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.2rem' }}>
                      {weatherData.temp}°C · {weatherData.condition}
                    </div>
                  )}
                </div>

                {/* GPS button */}
                <button
                  onClick={handleGpsLocation}
                  disabled={locationStatus === 'loading'}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.6rem',
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '10px', padding: '0.75rem 1rem', cursor: 'pointer',
                    color: '#fff', fontSize: '0.8rem', fontWeight: 600, width: '100%',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                >
                  <span style={{ fontSize: '1rem' }}>📍</span>
                  <span>Use my GPS location</span>
                </button>

                {/* Divider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
                  <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.05em' }}>OR</span>
                  <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
                </div>

                {/* Manual input */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <label style={{ fontSize: '0.67rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Enter city or address
                  </label>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '10px', padding: '0.55rem 0.85rem',
                  }}>
                    <input
                      type="text"
                      placeholder="e.g. Kigali, Rwanda"
                      value={locationInput}
                      onChange={e => { setLocationInput(e.target.value); setLocationStatus(null); }}
                      onKeyDown={e => e.key === 'Enter' && handleManualLocation(locationInput)}
                      style={{ background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: '0.8rem', width: '100%' }}
                    />
                  </div>
                  <button
                    onClick={() => handleManualLocation(locationInput)}
                    disabled={!locationInput.trim() || locationStatus === 'loading'}
                    style={{
                      background: locationInput.trim() ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(255,255,255,0.06)',
                      border: 'none', borderRadius: '10px', padding: '0.7rem',
                      color: locationInput.trim() ? '#fff' : 'rgba(255,255,255,0.3)',
                      fontSize: '0.8rem', fontWeight: 700, cursor: locationInput.trim() ? 'pointer' : 'default',
                      transition: 'all 0.2s', letterSpacing: '0.02em',
                    }}
                  >
                    {locationStatus === 'loading' ? 'Locating…' : 'Update Weather Location'}
                  </button>
                </div>

                {/* Status feedback */}
                {locationStatus === 'success' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>
                    <span>✓</span> Location updated successfully
                  </div>
                )}
                {locationStatus === 'error' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#f87171', fontWeight: 600 }}>
                    <span>✕</span> Could not find location — try a different name
                  </div>
                )}
              </div>
            </div>
          ) : sidebarView === 'search' ? (() => {
            const q = searchQuery.toLowerCase().trim();
            const matchedCrops = q ? crops.filter(c =>
              c.crop_name?.toLowerCase().includes(q) || c.farm_name?.toLowerCase().includes(q)
            ) : [];
            const matchedAlerts = q ? alerts.filter(a =>
              a.title?.toLowerCase().includes(q) || a.message?.toLowerCase().includes(q) || a.type?.toLowerCase().includes(q)
            ) : [];
            const hasResults = matchedCrops.length > 0 || matchedAlerts.length > 0;

            return (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                {/* Search input */}
                <div style={{ padding: '1.25rem 1.4rem 0.75rem', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.6rem',
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '10px', padding: '0.55rem 0.85rem',
                  }}>
                    <Search size={14} style={{ color: 'rgba(255,255,255,0.4)', flexShrink: 0 }} />
                    <input
                      autoFocus
                      type="text"
                      placeholder="Search crops, alerts…"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      style={{
                        background: 'none', border: 'none', outline: 'none', color: '#fff',
                        fontSize: '0.82rem', width: '100%', letterSpacing: '0.01em',
                      }}
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: 0, lineHeight: 1 }}>✕</button>
                    )}
                  </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto' }}>
                  {!q ? (
                    <div style={{ padding: '2.5rem 1.4rem', textAlign: 'center' }}>
                      <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.75rem', letterSpacing: '0.03em' }}>
                        Search across crops and alerts
                      </div>
                    </div>
                  ) : !hasResults ? (
                    <div style={{ padding: '2.5rem 1.4rem', textAlign: 'center' }}>
                      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem', fontWeight: 600 }}>No results for "{searchQuery}"</div>
                      <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.7rem', marginTop: '0.3rem' }}>Try crop name or alert type</div>
                    </div>
                  ) : (
                    <div style={{ padding: '0.75rem 0' }}>
                      {/* Crops */}
                      {matchedCrops.length > 0 && (
                        <div>
                          <div style={{ padding: '0.4rem 1.4rem 0.5rem', fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>
                            Crops · {matchedCrops.length}
                          </div>
                          {matchedCrops.map(crop => {
                            const score = crop.health_history?.length
                              ? Math.round((crop.health_history[crop.health_history.length - 1].health_score ?? 0) * (crop.health_history[crop.health_history.length - 1].health_score <= 1 ? 100 : 1))
                              : null;
                            const scoreColor = score >= 70 ? '#10b981' : score >= 40 ? '#fbbf24' : '#f87171';
                            return (
                              <button key={crop.id} onClick={() => { navigate('/monitoring'); setSidebarView('default'); }} style={{
                                width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                                padding: '0.7rem 1.4rem', display: 'flex', alignItems: 'center', gap: '0.75rem',
                                transition: 'background 0.15s', textAlign: 'left',
                              }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'none'}
                              >
                                <div style={{
                                  width: 32, height: 32, borderRadius: '8px', flexShrink: 0,
                                  background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.2)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: '0.85rem',
                                }}>🌱</div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff', textTransform: 'capitalize', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {crop.crop_name}
                                  </div>
                                  {crop.farm_name && (
                                    <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.1rem' }}>{crop.farm_name}</div>
                                  )}
                                </div>
                                {score !== null && (
                                  <span style={{ fontSize: '0.7rem', fontWeight: 800, color: scoreColor }}>{score}%</span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Alerts */}
                      {matchedAlerts.length > 0 && (
                        <div style={{ marginTop: matchedCrops.length ? '0.5rem' : 0 }}>
                          <div style={{ padding: '0.4rem 1.4rem 0.5rem', fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>
                            Alerts · {matchedAlerts.length}
                          </div>
                          {matchedAlerts.map(alert => {
                            const isCrit = alert.type === 'critical';
                            return (
                              <button key={alert.id} onClick={() => { notifications.markRead(alert.id); setSidebarView('notifications'); }} style={{
                                width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                                padding: '0.7rem 1.4rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                                textAlign: 'left', borderLeft: `3px solid ${isCrit ? '#f87171' : '#fbbf24'}`,
                                transition: 'background 0.15s',
                              }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'none'}
                              >
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: isCrit ? '#f87171' : '#fbbf24', marginBottom: '0.2rem' }}>
                                    {alert.type}
                                  </div>
                                  <div style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                    {alert.message}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })() : sidebarView === 'notifications' ? (
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              {/* Header */}
              <div style={{ padding: '1.5rem 1.4rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{ color: '#fff', fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.01em' }}>Activity</span>
                    {unreadAlertsCount > 0 && (
                      <span style={{
                        background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                        color: '#fff', fontSize: '0.6rem', fontWeight: 800,
                        padding: '0.15rem 0.45rem', borderRadius: '999px', letterSpacing: '0.03em',
                        boxShadow: '0 0 10px rgba(239,68,68,0.4)',
                      }}>{unreadAlertsCount} NEW</span>
                    )}
                  </div>
                  {unreadAlertsCount > 0 && (
                    <button onClick={notifications.markAllRead} style={{
                      fontSize: '0.67rem', color: '#10b981', fontWeight: 700, background: 'none',
                      border: '1px solid rgba(16,185,129,0.3)', borderRadius: '4px',
                      cursor: 'pointer', padding: '0.2rem 0.55rem', letterSpacing: '0.02em',
                      transition: 'all 0.15s',
                    }}>
                      Clear all
                    </button>
                  )}
                </div>
                {alerts.length > 0 && (
                  <div style={{ marginTop: '0.6rem', fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.02em' }}>
                    {alerts.length} alert{alerts.length !== 1 ? 's' : ''} · {alerts.filter(a => a.type === 'critical').length} critical
                  </div>
                )}
              </div>

              {alerts.length === 0 ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', padding: '3rem 1.5rem' }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: '50%',
                    background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Bell size={22} style={{ color: 'rgba(255,255,255,0.25)' }} />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.82rem', fontWeight: 600 }}>All clear</div>
                    <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.72rem', marginTop: '0.25rem' }}>No alerts at this time</div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {alerts.map((alert, i) => {
                    const isCritical = alert.type === 'critical';
                    const accentColor = isCritical ? '#f87171' : '#fbbf24';
                    const accentGlow = isCritical ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.1)';
                    const ts = new Date(alert.created_at);
                    const now = new Date();
                    const diffMs = now - ts;
                    const diffMins = Math.floor(diffMs / 60000);
                    const timeLabel = diffMins < 60
                      ? `${diffMins}m ago`
                      : diffMins < 1440
                        ? `${Math.floor(diffMins / 60)}h ago`
                        : ts.toLocaleDateString('en', { month: 'short', day: 'numeric' });

                    return (
                      <div key={alert.id} style={{
                        padding: '1rem 1.4rem',
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        borderLeft: `3px solid ${!alert.is_read ? accentColor : 'rgba(255,255,255,0.08)'}`,
                        background: !alert.is_read ? accentGlow : 'transparent',
                        transition: 'background 0.2s',
                        position: 'relative',
                      }}>
                        {/* Top row */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            {!alert.is_read && (
                              <span style={{
                                width: 6, height: 6, borderRadius: '50%',
                                background: accentColor,
                                boxShadow: `0 0 6px ${accentColor}`,
                                flexShrink: 0,
                              }} />
                            )}
                            <span style={{
                              fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase',
                              letterSpacing: '0.08em', color: accentColor,
                            }}>
                              {isCritical ? '⚠ Critical' : '● Warning'}
                            </span>
                          </div>
                          <span style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>
                            {timeLabel}
                          </span>
                        </div>

                        {/* Title */}
                        {alert.title && (
                          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff', marginBottom: '0.25rem', lineHeight: 1.3 }}>
                            {alert.title}
                          </div>
                        )}

                        {/* Message */}
                        <p style={{ fontSize: '0.73rem', color: 'rgba(255,255,255,0.6)', margin: 0, lineHeight: 1.5 }}>
                          {alert.message}
                        </p>

                        {/* Actions */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.65rem' }}>
                          {!alert.is_read && (
                            <button onClick={() => notifications.markRead(alert.id)} style={{
                              fontSize: '0.65rem', color: '#10b981', fontWeight: 700,
                              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                              letterSpacing: '0.02em',
                            }}>
                              Mark read
                            </button>
                          )}
                          {alert.action_url && (
                            <a href={alert.action_url} style={{
                              fontSize: '0.65rem', color: 'rgba(255,255,255,0.45)', fontWeight: 600,
                              textDecoration: 'none', letterSpacing: '0.02em',
                            }}>
                              View →
                            </a>
                          )}
                          <button onClick={() => notifications.deleteAlert(alert.id)} style={{
                            fontSize: '0.65rem', color: 'rgba(255,255,255,0.2)', fontWeight: 500,
                            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                            marginLeft: 'auto', letterSpacing: '0.02em',
                            transition: 'color 0.15s',
                          }}>
                            Dismiss
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : !result ? (
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
                <div className="sidebar-title" style={{color: 'white', textAlign: 'center'}}>Welcome, {impersonatedFarmId ? (impersonatedFarm?.farm_name || 'Loading...') : (user?.full_name?.split(' ')[0] || 'Farmer')}</div>
                <div style={{fontSize: '0.85rem', opacity: 0.8, textAlign: 'center'}}>Please test your soil to see which crop is best to plant.</div>
              </div>
            </div>
          ) : (
            <div className="report-section">
              <h2 className="sidebar-title">Soil Analysis Report</h2>
              <p className="sidebar-subtitle">AI assessment based on your current soil readings.</p>

              {(() => {
                const conf = Math.round((result.confidence || 0) * 100);
                // Low-confidence: status is REST but we still have a crop match the farmer can choose
                const isLowConfidence = result.status === 'REST THE LAND' && result.crop !== 'Rest Land';
                const isTrueRest = result.crop === 'Rest Land';
                const isRest = isTrueRest || (isLowConfidence && restChoice === 'rest');
                const showChoice = isLowConfidence && restChoice === null;

                const badgeColor = isRest ? '#ef4444' : conf < 85 ? '#f59e0b' : '#10b981';
                const cardBg = isRest ? 'rgba(239,68,68,0.12)' : conf < 85 ? 'rgba(245,158,11,0.12)' : 'rgba(16,185,129,0.12)';
                const cropLabel = result.crop?.charAt(0).toUpperCase() + result.crop?.slice(1);

                const REST_ADVICE = [
                  "Rest your land this season. Do not plant any crop right now.",
                  "Add compost, animal manure, or green cover crops to feed and rebuild your soil.",
                  "After one full season, test your soil again before deciding what to plant next.",
                ];

                const adviceItems = isRest && isLowConfidence
                  ? REST_ADVICE
                  : (typeof result.advice === 'string' ? result.advice.split('. ') : result.advice);

                const planTitle = isTrueRest
                  ? 'Soil Recovery Plan'
                  : isLowConfidence && restChoice === 'rest'
                    ? 'Soil Recovery Plan'
                    : (user?.role === 'farmer' ? 'What To Do Next' : 'Agronomic Action Plan');

                return (
                  <>
                    {/* Crop result card */}
                    <div style={{ background: cardBg, border: `1px solid ${badgeColor}30`, borderRadius: '16px', padding: '1rem', marginBottom: '1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <div style={{ width: 36, height: 36, borderRadius: '10px', background: `${badgeColor}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {isTrueRest ? <AlertTriangle size={18} color={badgeColor} /> : <Leaf size={18} color={badgeColor} />}
                          </div>
                          <div>
                            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                              {isTrueRest ? 'Recommendation' : 'Best Match'}
                            </div>
                            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>
                              {isTrueRest ? 'Rest Your Land' : cropLabel}
                            </div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: badgeColor, lineHeight: 1 }}>{conf}%</div>
                          <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>compatibility</div>
                        </div>
                      </div>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: `${badgeColor}20`, borderRadius: '6px', padding: '0.25rem 0.65rem' }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: badgeColor }} />
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: badgeColor }}>
                          {isTrueRest ? 'Do Not Plant' : isLowConfidence ? 'Low Match' : conf < 85 ? 'Plant with Caution' : 'Safe to Plant'}
                        </span>
                      </div>
                    </div>

                    {/* Choice card — shown only for low-confidence, before user decides */}
                    {showChoice && (
                      <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '14px', padding: '1rem', marginBottom: '1.25rem' }}>
                        <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.6, margin: '0 0 1rem' }}>
                          Your soil is closest to <strong style={{ color: '#f59e0b' }}>{cropLabel}</strong> conditions at <strong style={{ color: '#f59e0b' }}>{conf}%</strong> — below the 65% planting threshold.
                          You can still choose to plant and follow the preparation steps, or rest your land this season.
                        </p>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => setRestChoice('plant')}
                            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', background: 'rgba(245,158,11,0.18)', border: '1px solid rgba(245,158,11,0.4)', color: '#f59e0b', borderRadius: '10px', padding: '0.6rem 0.5rem', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                          >
                            <Sprout size={14} /> Plant {cropLabel} Anyway
                          </button>
                          <button
                            onClick={() => setRestChoice('rest')}
                            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.65)', borderRadius: '10px', padding: '0.6rem 0.5rem', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
                          >
                            Rest My Land
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Guidance section — shown after choice or for normal/true-rest cases */}
                    {!showChoice && (
                      <>
                        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.95rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.85rem' }}>
                          {planTitle}
                        </h3>

                        <div style={{ overflowY: 'auto', paddingRight: '0.5rem', marginBottom: '4rem' }}>
                          {adviceItems.map((step, i) => {
                            if (!step?.trim()) return null;
                            return (
                              <div key={i} className="plan-item" style={{ marginBottom: '0.75rem' }}>
                                <div className="plan-icon" style={{ minWidth: 28, height: 28, fontSize: '0.72rem' }}>
                                  <span style={{ fontSize: '0.72rem', fontWeight: 800 }}>{i + 1}</span>
                                </div>
                                <div className="plan-text">
                                  <p style={{ fontSize: '0.82rem', lineHeight: 1.55, color: 'rgba(255,255,255,0.82)', margin: 0 }}>{step}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div style={{ position: 'absolute', bottom: '0', left: '0', right: '0', padding: '1.25rem 1.5rem', background: 'linear-gradient(to top, var(--bg-sidebar) 80%, transparent)', display: 'flex', flexDirection: 'column', gap: '0.6rem', zIndex: 10 }}>
                          {/* Show "Confirm & Plant" only when crop is valid (not a rest scenario) */}
                          {!isTrueRest && restChoice !== 'rest' && (
                            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'rgba(255,255,255,0.55)', textAlign: 'center' }}>
                              Would you like to add <strong style={{ color: '#fff' }}>{cropLabel}</strong> to your farm monitoring?
                            </div>
                          )}
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {!isTrueRest && restChoice !== 'rest' && (
                              <button
                                className="action-btn-pro"
                                style={{ flex: 1, justifyContent: 'center', background: 'var(--accent-emerald)', color: 'var(--bg-sidebar)', padding: '0.65rem 0.5rem', fontSize: '0.8rem', fontWeight: 700 }}
                                onClick={handlePlantCrop}
                                disabled={loading}
                              >
                                {loading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Sprout size={14} />}
                                Confirm & Plant
                              </button>
                            )}
                            {isLowConfidence && restChoice !== null && (
                              <button
                                className="action-btn-pro"
                                style={{ flex: 1, justifyContent: 'center', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)', padding: '0.65rem 0.5rem', fontSize: '0.8rem' }}
                                onClick={() => setRestChoice(null)}
                                disabled={loading}
                              >
                                Change My Mind
                              </button>
                            )}
                            <button
                              className="action-btn-pro"
                              style={{ flex: 1, justifyContent: 'center', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)', padding: '0.65rem 0.5rem', fontSize: '0.8rem' }}
                              onClick={handleDeclineCrop}
                              disabled={loading}
                            >
                              {isTrueRest || restChoice === 'rest' ? 'Clear Report' : 'Dismiss'}
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </>
                );
              })()}

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
      <MobileBottomNav user={user} impersonatedFarmId={impersonatedFarmId} />
      <NotificationCenter notifications={notifications} isOpen={panelOpen} onClose={() => setPanelOpen(false)} />

      {/* Report sent modal */}
      {reportModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', padding: '1rem' }}>
          <div style={{ background: '#fff', borderRadius: '24px', width: '100%', maxWidth: '420px', padding: '2rem 1.5rem 1.5rem', boxShadow: '0 24px 60px rgba(0,0,0,0.2)', animation: 'slideUpModal 0.22s cubic-bezier(0.34,1.56,0.64,1)', fontFamily: "'Outfit', sans-serif" }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', marginBottom: '1.75rem' }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: reportModal === 'success' ? '#f0fdf4' : '#fff1f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Mail size={24} color={reportModal === 'success' ? '#16a34a' : '#e11d48'} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', fontFamily: "'Outfit', sans-serif" }}>
                {reportModal === 'success' ? 'Report Sent!' : 'Could Not Send Report'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', textAlign: 'center', fontFamily: "'Outfit', sans-serif" }}>
                {reportModal === 'success'
                  ? 'Your weekly farm report has been sent to your inbox.'
                  : 'Something went wrong. Please try again in a moment.'}
              </p>
            </div>
            <button
              onClick={() => setReportModal(null)}
              style={{ width: '100%', padding: '0.85rem', borderRadius: '14px', border: 'none', background: reportModal === 'success' ? 'linear-gradient(135deg, #16a34a, #15803d)' : 'linear-gradient(135deg, #e11d48, #be123c)', color: '#fff', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}
            >
              {reportModal === 'success' ? 'Got it' : 'Dismiss'}
            </button>
          </div>
        </div>
      )}

      {/* Pro logout confirmation modal */}
      {showLogoutModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', padding: '1rem' }}>
          <div style={{ background: '#fff', borderRadius: '24px', width: '100%', maxWidth: '420px', padding: '2rem 1.5rem 1.5rem', boxShadow: '0 24px 60px rgba(0,0,0,0.2)', animation: 'slideUpModal 0.22s cubic-bezier(0.34,1.56,0.64,1)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', marginBottom: '1.75rem' }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#fff1f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <LogOut size={24} color="#e11d48" />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', fontFamily: "'Outfit', sans-serif" }}>Sign out?</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', textAlign: 'center', fontFamily: "'Outfit', sans-serif" }}>
                You'll need to sign in again to access your farm data.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setShowLogoutModal(false)} style={{ flex: 1, padding: '0.85rem', borderRadius: '14px', border: '2px solid #e2e8f0', background: '#fff', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', color: '#64748b', fontFamily: "'Outfit', sans-serif" }}>
                Cancel
              </button>
              <button onClick={handleLogout} style={{ flex: 1, padding: '0.85rem', borderRadius: '14px', border: 'none', background: 'linear-gradient(135deg, #e11d48, #be123c)', color: '#fff', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Signing out overlay */}
      {loggingOut && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1e362a 0%, #2d5240 100%)', gap: '1.25rem' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Leaf size={32} fill="#a7f3d0" color="#a7f3d0" />
          </div>
          <p style={{ color: '#a7f3d0', fontWeight: 700, fontSize: '1rem', margin: 0, fontFamily: "'Outfit', sans-serif", letterSpacing: '0.02em' }}>Signing you out...</p>
        </div>
      )}

      <style>{`
        @keyframes slideUpModal {
          from { transform: translateY(40px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default App;
