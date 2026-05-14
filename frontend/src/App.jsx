import React, { useState } from 'react';
import Analytics from './Analytics';
import Reports from './Reports';
import Settings from './Settings';
import LandingPage from './LandingPage';
import AuthPage from './AuthPage'; // Imported AuthPage correctly
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
  LogOut
} from 'lucide-react';

const API_URL = 'http://127.0.0.1:8000/predict';

function App() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [envLoading, setEnvLoading] = useState(false);
  const [envError, setEnvError] = useState(null);
  const [locationActive, setLocationActive] = useState(true);
  const [toast, setToast] = useState(null);
  
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('planto_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('planto_user'));
  
  const [showAuth, setShowAuth] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('planto_user');
    setIsAuthenticated(false);
    setUser(null);
    setShowAuth(false);
    setResult(null);
  };


  const [activeTab, setActiveTab] = useState('dashboard');

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
        headers: { 'Content-Type': 'application/json' },
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
      const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY; 

      try {
        let temp, humidity, rainfall;

        if (!apiKey || apiKey === 'YOUR_OPENWEATHER_API_KEY') {
          // If no API key is provided, use realistic mock data for the demo
          console.log("No OpenWeather API key found. Using mock weather data.");
          await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay
          temp = (22 + Math.random() * 5).toFixed(2);
          humidity = (60 + Math.random() * 20).toFixed(2);
          rainfall = (Math.random() * 50).toFixed(2);
        } else {
          // Use real OpenWeather API if key is present
          const response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&units=metric&appid=${apiKey}`);
          if (!response.ok) throw new Error("Failed to fetch forecast data. Check your API Key.");

          const data = await response.json();
          let tempSum = 0;
          let humSum = 0;
          let totalRain = 0;
          let count = data.list.length;

          data.list.forEach(item => {
              tempSum += item.main.temp;
              humSum += item.main.humidity;
              if (item.rain && item.rain['3h']) {
                  totalRain += item.rain['3h'];
              }
          });
          
          temp = (tempSum / count).toFixed(2);
          humidity = (humSum / count).toFixed(2);
          rainfall = totalRain.toFixed(2);
        }

        setFormData(prev => ({
          ...prev,
          temperature: temp,
          humidity: humidity,
          rainfall: rainfall
        }));
        
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

  if (!isAuthenticated) {
    if (showAuth) {
      return (
        <AuthPage 
          onLogin={(userData) => { 
            localStorage.setItem('planto_user', JSON.stringify(userData));
            setUser(userData); 
            setIsAuthenticated(true); 
          }} 
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
            <div className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>Home</div>
            <div className={`nav-item ${activeTab === 'test-soil' ? 'active' : ''}`} onClick={() => setActiveTab('test-soil')}>Check My Soil</div>
            <div className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>My Crops</div>
            <div className={`nav-item ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')}>Records</div>
            <div className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>Settings</div>
          </div>
        </nav>

        <div className="scrollable-content">
          {activeTab === 'test-soil' ? (
          <>
            {/* Header */}
            <header className="page-header pro-header animate-2">
              <div className="header-left">
                <h1 className="welcome-text">Diagnostic Laboratory <span className="pro-badge">ACTIVE</span></h1>
                <div className="date-text"><Activity size={14} color="#10b981" className="lucide-pulse" /> Precision Engine Online • {today}</div>
              </div>
            </header>

            <div className="pro-welcome-banner farmer-banner animate-1">
              <div className="banner-content">
                <h2>Field Diagnostic</h2>
                <p>Input your soil and environmental metrics below to generate a precision AI crop recommendation.</p>

              </div>
              <div className="banner-icon">
                <ShieldCheck size={120} color="rgba(255,255,255,0.1)" />
              </div>
            </div>

            {/* Widgets Area */}
            <form onSubmit={handleSubmit} className="widgets-grid animate-3">
              
              {/* Weather / Environmental Widget */}
              <div className="widget weather-widget">
                <div className="weather-bg-circles">
                  <div className="weather-circle" style={{width: '150px', height: '150px', top: '-20px', left: '-50px'}}></div>
                  <div className="weather-circle" style={{width: '80px', height: '80px', bottom: '20px', right: '40px'}}></div>
                  <div className="weather-circle" style={{width: '200px', height: '200px', bottom: '-80px', right: '-80px', opacity: 0.03}}></div>
                </div>
                
                <div className="weather-content">
                  <div className="widget-header" style={{marginBottom: '0.75rem'}}>
                    <span className="widget-title" style={{color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                      <CloudSun size={20} color="rgba(255,255,255,0.8)" />
                      Weather
                    </span>
                    <button 
                      type="button" 
                      onClick={handleAutoFetchEnv} 
                      className="planto-btn-secondary"
                      disabled={envLoading || !locationActive}
                      style={{ opacity: locationActive ? 1 : 0.5, cursor: locationActive ? 'pointer' : 'not-allowed' }}
                    >
                      {envLoading ? <Loader2 size={14} className="lucide-spin" style={{animation: 'spin 1s linear infinite'}}/> : <MapPin size={14}/>}
                      {envLoading ? 'Detecting...' : 'Auto-detect'}
                    </button>
                  </div>
                  
                  {envError && <div className="planto-alert alert-error" style={{marginBottom: '1rem'}}>{envError}</div>}
                  
                  <div className="input-group-grid" style={{marginTop: 'auto', position: 'relative'}}>
                    <div>
                      <label style={{fontSize: '0.7rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)', marginBottom: '0.2rem', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Temp (°C)</label>
                      <div className="pro-input-wrapper">
                        <div className="pro-input-icon"><ThermometerSun size={16} /></div>
                        <input type="text" name="temperature" className="pro-input" value={formData.temperature} onChange={handleInputChange} placeholder="e.g. 24.5" />
                      </div>
                      {formErrors.temperature && <div style={{color: '#f87171', fontSize: '0.65rem', marginTop: '0.2rem', fontWeight: 600}}>{formErrors.temperature}</div>}
                    </div>
                    
                    <div>
                      <label style={{fontSize: '0.7rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)', marginBottom: '0.2rem', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Humidity (%)</label>
                      <div className="pro-input-wrapper">
                        <div className="pro-input-icon"><Droplets size={16} /></div>
                        <input type="text" name="humidity" className="pro-input" value={formData.humidity} onChange={handleInputChange} placeholder="e.g. 82.0" />
                      </div>
                      {formErrors.humidity && <div style={{color: '#f87171', fontSize: '0.65rem', marginTop: '0.2rem', fontWeight: 600}}>{formErrors.humidity}</div>}
                    </div>
                    
                    <div style={{gridColumn: '1 / -1'}}>
                      <label style={{fontSize: '0.7rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)', marginBottom: '0.2rem', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Rainfall (mm)</label>
                      <div className="pro-input-wrapper">
                        <div className="pro-input-icon"><CloudRain size={16} /></div>
                        <input type="text" name="rainfall" className="pro-input" value={formData.rainfall} onChange={handleInputChange} placeholder="e.g. 200" />
                      </div>
                      {formErrors.rainfall && <div style={{color: '#f87171', fontSize: '0.65rem', marginTop: '0.2rem', fontWeight: 600}}>{formErrors.rainfall}</div>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Soil Details Widget */}
              <div className="widget growth-widget" style={{position: 'relative', overflow: 'hidden'}}>
                <div style={{position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(232, 236, 204, 0.5) 0%, transparent 70%)', borderRadius: '50%'}}></div>

                <div className="widget-header">
                  <span className="widget-title" style={{display: 'flex', alignItems: 'center', gap: '0.5rem', position: 'relative'}}>
                    <FlaskConical size={20} color="var(--bg-sidebar)" />
                    Soil Details
                  </span>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.7rem', fontWeight: 800, 
                    color: 'var(--bg-sidebar)', background: 'var(--widget-light-yellow)', 
                    padding: '0.4rem 0.8rem', borderRadius: '50px', border: '1px solid rgba(42, 67, 53, 0.1)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)', position: 'relative'
                  }}>
                    <div style={{width: '6px', height: '6px', background: '#10b981', borderRadius: '50%', boxShadow: '0 0 6px #10b981', animation: 'pulseGlow 2s infinite'}}></div>
                    MANUAL INPUT
                  </div>
                </div>
                
                <div className="input-group-grid" style={{marginTop: '0.2rem', position: 'relative'}}>
                  <div>
                    <label style={{fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.2rem', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Nitrogen (N)</label>
                    <div className="pro-input-wrapper">
                      <div className="pro-input-icon"><Leaf size={16} /></div>
                      <input type="text" name="n" className="pro-input" value={formData.n} onChange={handleInputChange} placeholder="e.g. 90" />
                    </div>
                    {formErrors.n && <div style={{color: '#ef4444', fontSize: '0.65rem', marginTop: '0.2rem', fontWeight: 600}}>{formErrors.n}</div>}
                  </div>
                  
                  <div>
                    <label style={{fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.2rem', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Phosphorus (P)</label>
                    <div className="pro-input-wrapper">
                      <div className="pro-input-icon"><Sprout size={16} /></div>
                      <input type="text" name="p" className="pro-input" value={formData.p} onChange={handleInputChange} placeholder="e.g. 42" />
                    </div>
                    {formErrors.p && <div style={{color: '#ef4444', fontSize: '0.65rem', marginTop: '0.2rem', fontWeight: 600}}>{formErrors.p}</div>}
                  </div>

                  <div>
                    <label style={{fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.2rem', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Potassium (K)</label>
                    <div className="pro-input-wrapper">
                      <div className="pro-input-icon"><Droplets size={16} /></div>
                      <input type="text" name="k" className="pro-input" value={formData.k} onChange={handleInputChange} placeholder="e.g. 43" />
                    </div>
                    {formErrors.k && <div style={{color: '#ef4444', fontSize: '0.65rem', marginTop: '0.2rem', fontWeight: 600}}>{formErrors.k}</div>}
                  </div>

                  <div>
                    <label style={{fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.2rem', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px'}}>Soil pH</label>
                    <div className="pro-input-wrapper">
                      <div className="pro-input-icon"><FlaskConical size={16} /></div>
                      <input type="text" name="ph" className="pro-input" value={formData.ph} onChange={handleInputChange} placeholder="e.g. 6.5" />
                    </div>
                    {formErrors.ph && <div style={{color: '#ef4444', fontSize: '0.65rem', marginTop: '0.2rem', fontWeight: 600}}>{formErrors.ph}</div>}
                  </div>
                </div>

                {currentAlerts.length > 0 && (
                  <div style={{display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: 'auto', paddingTop: '0.5rem', position: 'relative'}}>
                    {currentAlerts.map((alert, idx) => (
                      <div key={idx} className="planto-alert alert-warning" style={{boxShadow: '0 2px 6px rgba(180,83,9,0.1)'}}>
                        <AlertTriangle size={12} /> {alert}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="execute-row animate-3" style={{gridColumn: '1 / -1', marginTop: '1rem'}}>
                <button type="submit" className="action-btn-pro" style={{width: '100%', justifyContent: 'center'}} disabled={loading}>
                  {loading ? <Loader2 size={18} className="lucide-spin" /> : <Sprout size={18} />}
                  {loading ? 'Analyzing Soil...' : 'Run Analysis Now'}
                </button>
                {error && <div className="planto-alert alert-error" style={{marginTop: '1rem'}}>{error}</div>}
              </div>
            </form>
          </>

        ) : activeTab === 'analytics' ? (
          <Analytics />
        ) : activeTab === 'reports' ? (
          <Reports />
        ) : activeTab === 'settings' ? (
          <Settings user={user} setUser={setUser} />
        ) : (
          <div className="dashboard-view animate-2">
            <header className="page-header pro-header">
              <div className="header-left">
                <h1 className="welcome-text">My Farm Dashboard <span className="pro-badge">PRO-FARMER</span></h1>
                <div className="date-text"><Activity size={14} color="var(--accent-emerald)" className="lucide-pulse" /> Global Link Secured • {today}</div>
              </div>
            </header>
            
            <div className="pro-welcome-banner farmer-banner">
              <div className="banner-content">
                <h2>Ready to plant?</h2>
                <p>Test your soil today to see which crop will grow best on your land.</p>
                <button className="banner-btn farmer-btn-large" onClick={() => setActiveTab('test-soil')}>Start Soil Test Now</button>
              </div>
              <div className="banner-icon">
                <Sprout size={120} color="rgba(255,255,255,0.1)" />
              </div>
            </div>

            {/* Top Stats Row - Matching Image */}
            <div className="stats-strip animate-1">
              <div className="stat-pill-card">
                <div className="stat-icon-circle green-soft"><Droplets size={20} color="#10b981" /></div>
                <div className="stat-data">
                  <span className="stat-label">Soil</span>
                  <span className="stat-main">23 %</span>
                </div>
              </div>
              <div className="stat-pill-card">
                <div className="stat-icon-circle orange-soft"><ThermometerSun size={20} color="#f59e0b" /></div>
                <div className="stat-data">
                  <span className="stat-label">Temperature</span>
                  <span className="stat-main">18,7°C</span>
                </div>
              </div>
              <div className="stat-pill-card">
                <div className="stat-icon-circle emerald-soft"><Leaf size={20} color="#059669" /></div>
                <div className="stat-data">
                  <span className="stat-label">Crop Health</span>
                  <span className="stat-main">Good</span>
                </div>
              </div>
              <div className="stat-pill-card">
                <div className="stat-icon-circle yellow-soft"><Zap size={20} color="#eab308" /></div>
                <div className="stat-data">
                  <span className="stat-label">Energy</span>
                  <span className="stat-main">45 %</span>
                </div>
              </div>
            </div>

            <div className="dashboard-grid-matching">
              {/* Left Column */}
              <div className="dashboard-col">
                {/* Moisture Over Time */}
                <div className="dashboard-card matching-card animate-2">
                  <div className="card-header-simple">
                    <h3>Moisture Over Time</h3>
                  </div>
                  <div className="chart-placeholder-wavy">
                    <svg viewBox="0 0 400 120" className="wavy-line-svg">
                      <path 
                        d="M0,60 Q25,40 50,60 T100,60 T150,60 T200,80 T250,60 T300,50 T350,40 T400,30" 
                        fill="none" 
                        stroke="#10b981" 
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                      <line x1="0" y1="30" x2="400" y2="30" stroke="rgba(0,0,0,0.03)" />
                      <line x1="0" y1="60" x2="400" y2="60" stroke="rgba(0,0,0,0.03)" />
                      <line x1="0" y1="90" x2="400" y2="90" stroke="rgba(0,0,0,0.03)" />
                    </svg>
                  </div>
                </div>

                {/* Alerts Table */}
                <div className="dashboard-card matching-card animate-3">
                  <div className="card-header-simple">
                    <h3>Alerts</h3>
                  </div>
                  <table className="alerts-table-simple">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Description</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>10 Apr</td>
                        <td>Low Soil Moisture</td>
                        <td><span className="status-tag critical">Critical</span></td>
                      </tr>
                      <tr>
                        <td>08 Apr</td>
                        <td>High Temperature</td>
                        <td><span className="status-tag warning">Warning</span></td>
                      </tr>
                      <tr>
                        <td>02 Apr</td>
                        <td>Low Soil Moisture</td>
                        <td><span className="status-tag warning">Warning</span></td>
                      </tr>
                      <tr>
                        <td>28 Dec</td>
                        <td>Device Disconnec</td>
                        <td><span className="status-tag disabled">Disabled</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right Column */}
              <div className="dashboard-col">
                {/* Field Overview (Isometric) */}
                <div className="dashboard-card matching-card animate-2">
                  <div className="card-header-simple">
                    <h3>Field Overview</h3>
                  </div>
                  <div className="isometric-map-container">
                    <div className="isometric-grid">
                      <div className="iso-plot plot-1"></div>
                      <div className="iso-plot plot-2"></div>
                      <div className="iso-plot plot-3"></div>
                      <div className="iso-plot plot-4"></div>
                      <div className="iso-plot plot-5"></div>
                      <div className="iso-plot plot-6"></div>
                      {/* Pins */}
                      <div className="iso-pin pin-1"><Droplets size={12} fill="white" /></div>
                      <div className="iso-pin pin-2"><Droplets size={12} fill="white" /></div>
                      <div className="iso-pin pin-3"><Droplets size={12} fill="white" /></div>
                    </div>
                  </div>
                </div>

                <div className="quick-actions-row">
                  <div className="dashboard-card matching-card flex-1 animate-3">
                    <div className="card-header-simple">
                      <h3>Quick Actions</h3>
                    </div>
                    <div className="actions-list-simple">
                      <button className="action-btn-simple">Start Irrigation Cycle</button>
                      <button className="action-btn-simple">Schedule Report Export</button>
                    </div>
                  </div>
                  <div className="dashboard-card matching-card flex-1 animate-3">
                    <div className="card-header-simple">
                      <h3>Quick Actions</h3>
                    </div>
                    <div className="isometric-mini">
                       <div className="iso-plot-mini"></div>
                       <div className="iso-plot-mini active"></div>
                    </div>
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
            <button className="icon-btn"><Bell size={20} /></button>
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
                  <div className="meter-label">HEALTH</div>
                </div>
              </div>
              <div style={{marginTop: '1.5rem'}}>
                <div className="sidebar-title" style={{color: 'white', textAlign: 'center'}}>Welcome, {user?.full_name?.split(' ')[0] || 'Farmer'}</div>
                <div style={{fontSize: '0.85rem', opacity: 0.8, textAlign: 'center'}}>Please check your soil to see your full harvest plan.</div>
              </div>
            </div>
          ) : (
            <div className="report-section">
              <h2 className="sidebar-title">Soil Results</h2>
              <p className="sidebar-subtitle">Here is what our AI found in your soil today.</p>
              
              <div className="result-crop-card">
                <div className="crop-icon-wrapper">
                  <Leaf size={24} />
                </div>
                <div className="crop-details">
                  <div className="crop-label">Optimal Crop</div>
                  <div className="crop-name">{result.crop}</div>
                </div>
                <div className="confidence-badge">
                  {Math.round((result.confidence || 0) * 100)}%
                </div>
              </div>

              <h3 style={{fontFamily: 'var(--font-heading)', fontSize: '1.1rem', marginBottom: '1rem'}}>What to do next</h3>
              
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
          font-weight: 600;
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
