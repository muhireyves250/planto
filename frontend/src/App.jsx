import React, { useState } from 'react';
import Analytics from './Analytics';
import Reports from './Reports';
import Settings from './Settings';
import LandingPage from './LandingPage';
import AuthPage from './AuthPage';
import Monitoring from './pages/Monitoring';
import SoilTest from './pages/SoilTest';
import FarmManagement from './pages/FarmManagement';
import { monitoringApi } from './api/monitoringApi';
import { farmApi, weatherApi, alertApi } from './api/farmApi';
import { 
  Search,
  Bell,
  MessageSquare,
  Leaf,
  CloudSun,
  CloudRain,
  MapPin,
  Loader2,
  Droplets,
  ThermometerSun,
  Sprout,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Info,
  FlaskConical,
  TrendingUp,
  Map as MapIcon,
  BarChart3,
  Layers,
  Activity,
  Calendar,
  Waves,
  Wand2,
  Lightbulb,
  Zap,
  Check,
  Wind,
  ShieldCheck,
  LogOut,
  ChevronRight,
  History,
  Settings as LucideSettings
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/predict` : 'http://127.0.0.1:8080/predict';

function App() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [envLoading, setEnvLoading] = useState(false);
  const [envError, setEnvError] = useState(null);
  const [locationActive, setLocationActive] = useState(true);
  const [toast, setToast] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [unreadAlertsCount, setUnreadAlertsCount] = useState(0);
  const [farmsCount, setFarmsCount] = useState(0);
  const [cropsCount, setCropsCount] = useState(0);
  
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
  
  const [showAuth, setShowAuth] = useState(false);
  const [headerActions, setHeaderActions] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [soilTestParams, setSoilTestParams] = useState({ mode: 'prediction', plantId: null, cropName: '' });
  const [weatherData, setWeatherData] = useState({ temp: '24', condition: 'Sunny', humidity: '62' });
  const [formData, setFormData] = useState({
    n: '',
    p: '',
    k: '',
    temperature: '',
    humidity: '',
    ph: '',
    rainfall: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [timestamp, setTimestamp] = useState(null);

  const handleLogout = () => {
    localStorage.removeItem('planto_user');
    setIsAuthenticated(false);
    setUser(null);
    setShowAuth(false);
    setResult(null);
    setActiveTab('dashboard');
  };

  const onLoginSuccess = (userData) => {
    localStorage.setItem('planto_user', JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
    
    // Role-based redirection
    if (userData.role === 'admin') {
      setActiveTab('admin');
    } else if (userData.role === 'agronomist') {
      setActiveTab('agronomist');
    } else {
      setActiveTab('dashboard');
    }
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
            nitrogen: parseFloat(formData.n) || 120,
            phosphorus: parseFloat(formData.p) || 60,
            potassium: parseFloat(formData.k) || 40,
            ph: parseFloat(formData.ph) || 6.5,
            moisture: 75.0,
            temperature: parseFloat(formData.temperature) || 24.0,
            humidity: parseFloat(formData.humidity) || 62.0
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
      const data = await alertApi.getAlerts();
      setAlerts(data);
      setUnreadAlertsCount(data.filter(a => !a.is_read).length);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
      if (err.status === 401) {
        handleLogout();
      }
    }
  };

  const fetchDashboardStats = async () => {
    if (!isAuthenticated || !user?.id) return;
    try {
      const farmsData = await farmApi.getFarms();
      setFarmsCount(farmsData.length);
      const cropsData = await monitoringApi.getMyCrops(user.id);
      setCropsCount(cropsData.length);
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
    }
  };

  React.useEffect(() => {
    if (isAuthenticated) {
      fetchAlerts();
      fetchDashboardStats();
      const interval = setInterval(() => {
        fetchAlerts();
        fetchDashboardStats();
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    let isValid = true;
    let errors = {};
    Object.keys(formData).forEach(key => {
      if (formData[key] === '' || isNaN(formData[key])) {
        errors[key] = 'Required';
        isValid = false;
      }
    });
    setFormErrors(errors);
    return isValid;
  };

  const getAlerts = () => {
    const alerts = [];
    if (formData.n !== '' && parseFloat(formData.n) < 20) alerts.push("Low N");
    if (formData.humidity !== '' && parseFloat(formData.humidity) > 85) alerts.push("High Humidity");
    if (formData.ph !== '') {
        const ph = parseFloat(formData.ph);
        if (ph < 5.5 || ph > 7.5) alerts.push("pH out of range");
    }
    return alerts;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);
    setError(null);

    const reqData = {
      n: parseFloat(formData.n),
      p: parseFloat(formData.p),
      k: parseFloat(formData.k),
      temperature: parseFloat(formData.temperature),
      humidity: parseFloat(formData.humidity),
      ph: parseFloat(formData.ph),
      rainfall: parseFloat(formData.rainfall),
    };

    try {
      await new Promise(r => setTimeout(r, 800));
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(user?.access_token ? { 'Authorization': `Bearer ${user.access_token}` } : {})
        },
        body: JSON.stringify(reqData)
      });

      if (!response.ok) {
        throw new Error(`Server Error: ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
      setTimestamp(new Date().toLocaleString());
      setToast({ type: 'success', message: `Analysis complete! Recommended crop: ${data.crop}` });
      setTimeout(() => setToast(null), 5000);
    } catch (err) {
        console.error('API Error:', err);
        setError('Precision Link Offline: Ensure the VERA backend is active.');
        setToast({ type: 'error', message: 'Analysis failed. System offline.' });
        setTimeout(() => setToast(null), 5000);
    } finally {
        setLoading(false);
    }
  };

  const handleAutoFetchEnv = () => {
    if (!locationActive) {
      setEnvError("Location services are currently turned off in your sidebar.");
      return;
    }
    if (!navigator.geolocation) {
      setEnvError("Geolocation is not supported by your browser.");
      return;
    }

    setEnvLoading(true);
    setEnvError(null);

    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      
      try {
        const data = await weatherApi.getWeather(latitude, longitude);
        
        setFormData(prev => ({
          ...prev,
          temperature: data.temp,
          humidity: data.humidity,
          rainfall: data.rainfall
        }));
        
        setWeatherData({
          temp: Math.round(data.temp),
          condition: data.condition,
          humidity: data.humidity
        });
        
        setFormErrors(prev => ({ ...prev, temperature: null, humidity: null, rainfall: null }));

      } catch (err) {
        console.error('Weather API Error:', err);
        setEnvError(err.message);
      } finally {
        setEnvLoading(false);
      }
    }, (err) => {
      console.error('Geolocation Error:', err);
      setEnvError("Could not retrieve GPS location.");
      setEnvLoading(false);
    });
  };

  const currentAlerts = getAlerts();
  
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
    if (showAuth) {
      return (
        <AuthPage 
          onLogin={onLoginSuccess} 
          onBack={() => setShowAuth(false)} 
        />
      );
    }
    return <LandingPage onLogin={() => setShowAuth(true)} />;
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
                <div className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>Home</div>
                {user?.role === 'farmer' && <div className={`nav-item ${activeTab === 'soil-test' ? 'active' : ''}`} onClick={() => setActiveTab('soil-test')}>Soil Test</div>}
                <div className={`nav-item ${activeTab === 'monitoring' ? 'active' : ''}`} onClick={() => setActiveTab('monitoring')}>Monitoring</div>
                <div className={`nav-item ${activeTab === 'crop-status' ? 'active' : ''}`} onClick={() => setActiveTab('crop-status')}>Crop Status</div>
                <div className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>Settings</div>
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

          {activeTab === 'soil-test' ? (
            <SoilTest 
              user={user}
              params={soilTestParams}
              setParams={setSoilTestParams}
              setActiveTab={setActiveTab}
              setHeaderActions={setHeaderActions}
              setResult={setResult}
              setToast={setToast}
            />
          ) : activeTab === 'crop-status' ? (
            <Reports setHeaderActions={setHeaderActions} />
          ) : activeTab === 'monitoring' ? (
            <Monitoring 
              user={user} 
              setActiveTab={setActiveTab} 
              setSoilTestParams={setSoilTestParams} 
              setHeaderActions={setHeaderActions} 
            />
          ) : activeTab === 'settings' ? (
            <Settings user={user} setUser={setUser} setHeaderActions={setHeaderActions} />
          ) : (
            <div className="dashboard-view animate-2" style={{ paddingTop: 0 }}>
              <div className="pro-welcome-banner farmer-banner">
                <div className="banner-content">
                  <h2>Ready to plant?</h2>
                  <p>Check your soil today to see which crops will grow best on your land.</p>
                </div>
                <div className="banner-icon">
                  <Sprout size={120} color="rgba(255,255,255,0.1)" />
                </div>
              </div>

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
                    <span className="stat-label">Warnings</span>
                    <span className="stat-main">{alerts.length === 0 ? 'No Issues' : `${alerts.length} Active`}</span>
                  </div>
                </div>
                <div className="stat-pill-card">
                  <div className="stat-icon-circle yellow-soft"><Zap size={20} color="#eab308" /></div>
                  <div className="stat-data">
                    <span className="stat-label">Soil Health</span>
                    <span className="stat-main">Good</span>
                  </div>
                </div>
              </div>

              <div className="dashboard-grid-matching animate-3">
                <div className="dashboard-col">
                  {/* Weather Card */}
                  <div className="dashboard-card matching-card glass-morph">
                    <div className="card-header-simple"><h3><CloudSun size={20} color="var(--accent-blue)" /> Weather Today</h3></div>
                    <div className="weather-summary" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem'}}>
                      <div style={{textAlign: 'center'}}>
                        <div style={{fontSize: '2.8rem', fontWeight: 800, color: 'var(--bg-sidebar)', letterSpacing: '-2px'}}>{weatherData.temp}°C</div>
                        <div className="badge-mini-text" style={{background: 'var(--green-soft)', color: 'var(--accent-emerald)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800}}>{(weatherData.condition || 'Clouds').toUpperCase()}</div>
                      </div>
                      <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
                        <div className="weather-pill"><Droplets size={16} color="var(--accent-blue)" /> <div className="pill-text"><span className="pill-label">Humidity</span><span className="pill-val">{weatherData.humidity}%</span></div></div>
                        <div className="weather-pill"><Wind size={16} color="var(--text-muted)" /> <div className="pill-text"><span className="pill-label">Wind Speed</span><span className="pill-val">{weatherData.windSpeed || '12'} km/h</span></div></div>
                      </div>
                    </div>
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

                <div className="dashboard-col">
                  {/* Quick Actions */}
                  <div className="dashboard-card matching-card" style={{background: 'var(--bg-sidebar)', color: 'white'}}>
                    <div className="card-header-simple"><h3 style={{color: 'white'}}><Zap size={20} color="var(--accent-emerald)" /> Things You Can Do</h3></div>
                    <div className="actions-list-simple" style={{display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem'}}>
                      <button className="action-btn-pro" onClick={() => setActiveTab('soil-test')} style={{background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', justifyContent: 'center', padding: '1rem'}}>
                        <FlaskConical size={18} /> Check Soil Health
                      </button>
                      <button className="action-btn-pro" onClick={() => setActiveTab('monitoring')} style={{background: 'var(--accent-emerald)', color: 'var(--bg-sidebar)', border: 'none', justifyContent: 'center', padding: '1rem'}}>
                        <Activity size={18} /> View Crop Status
                      </button>
                    </div>
                  </div>
                  
                  {/* Field Overview Map */}
                  <div className="dashboard-card matching-card" style={{flex: 1, position: 'relative', overflow: 'hidden'}}>
                    <div className="card-header-simple"><h3><MapPin size={20} color="var(--accent-emerald)" /> My Land Map</h3></div>
                    
                    <div className="isometric-map-container" style={{background: 'var(--green-soft)', borderRadius: '16px', border: '1px solid rgba(16, 185, 129, 0.1)', overflow: 'hidden'}}>
                      <div className="isometric-grid">
                        <div className="iso-plot plot-1"></div>
                        <div className="iso-plot plot-2"></div>
                        <div className="iso-plot plot-3"></div>
                        <div className="iso-plot plot-4"></div>
                        <div className="iso-plot plot-5"></div>
                        <div className="iso-plot plot-6"></div>
                        {/* Droplets pins */}
                        <div className="iso-pin pin-1"><Droplets size={12} fill="white" /></div>
                        <div className="iso-pin pin-2"><Droplets size={12} fill="white" /></div>
                        <div className="iso-pin pin-3"><Droplets size={12} fill="white" /></div>
                      </div>
                    </div>

                    <div style={{marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                      <div style={{fontSize: '0.8rem', fontWeight: 600}}>Land In Use</div>
                      <div style={{fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent-emerald)'}}>82% Planted</div>
                    </div>
                    <div style={{width: '100%', height: '6px', background: 'rgba(0,0,0,0.05)', borderRadius: '10px', marginTop: '0.5rem'}}>
                      <div style={{width: '82%', height: '100%', background: 'var(--accent-emerald)', borderRadius: '10px', boxShadow: '0 0 10px rgba(16, 185, 129, 0.3)'}}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
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
    </div>
  );
}

export default App;
