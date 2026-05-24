import React, { useState, useEffect } from 'react';
import { 
  FlaskConical, 
  Leaf, 
  Sprout, 
  Droplets, 
  ThermometerSun, 
  CloudRain, 
  CloudSun, 
  MapPin, 
  Loader2, 
  ShieldCheck, 
  AlertTriangle,
  Beaker,
  TrendingUp,
  Activity,
  ArrowLeft
} from 'lucide-react';
import { weatherApi } from '../api/farmApi';
import { monitoringApi } from '../api/monitoringApi';
import SoilTestResult from './SoilTestResult';

const API_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/predict` : 'http://127.0.0.1:8080/predict';

const calculateGuestIntelligence = (cropName, inputValues) => {
  const targets = {
    rice: { n: 120, p: 60, k: 40, ph: 6.5, moisture: 80 },
    maize: { n: 150, p: 60, k: 60, ph: 6.0, moisture: 70 },
    beans: { n: 30, p: 50, k: 30, ph: 6.8, moisture: 60 },
    coffee: { n: 150, p: 50, k: 150, ph: 5.5, moisture: 75 }
  }[cropName.toLowerCase()] || { n: 100, p: 50, k: 50, ph: 6.5, moisture: 70 };

  const deficits = {
    N: Math.max(0, targets.n - inputValues.n),
    P: Math.max(0, targets.p - inputValues.p),
    K: Math.max(0, targets.k - inputValues.k)
  };

  const fertilizers = [];
  if (deficits.N > 0) {
    const urea = deficits.N / 0.46;
    fertilizers.push({
      type: "Urea",
      kg: parseFloat(urea.toFixed(2)),
      nutrient_target: "Nitrogen (N)",
      reason: `Nitrogen levels are below optimal range of ${targets.n} mg/kg.`
    });
  }
  if (deficits.P > 0) {
    const dap = deficits.P / 0.46;
    fertilizers.push({
      type: "DAP",
      kg: parseFloat(dap.toFixed(2)),
      nutrient_target: "Phosphorus (P)",
      reason: `Phosphorus deficiency detected compared to target ${targets.p} mg/kg.`
    });
  }
  if (deficits.K > 0) {
    const npk = deficits.K / 0.17;
    fertilizers.push({
      type: "NPK (17%)",
      kg: parseFloat(npk.toFixed(2)),
      nutrient_target: "Potassium (K)",
      reason: `Potassium deficiency detected compared to target ${targets.k} mg/kg.`
    });
  }

  let score = 100;
  const nDev = Math.abs(inputValues.n - targets.n) / targets.n;
  const pDev = Math.abs(inputValues.p - targets.p) / targets.p;
  const kDev = Math.abs(inputValues.k - targets.k) / targets.k;
  const phDev = Math.abs(inputValues.ph - targets.ph) / targets.ph;
  const moistDev = Math.abs(inputValues.moisture - targets.moisture) / targets.moisture;

  score -= (nDev * 20 + pDev * 20 + kDev * 20 + phDev * 20 + moistDev * 20);
  score = Math.max(30, Math.min(100, Math.round(score)));

  let status = "Healthy";
  if (score < 60) status = "Critical Risk";
  else if (score < 80) status = "Moderate Risk";

  return {
    stage: "Germination",
    growth_stage: "Germination",
    health_score: score,
    status: status,
    deficit: deficits,
    nutrient_deficits: deficits,
    fertilizer: fertilizers.map(f => ({ type: f.type, kg: f.kg, reason: f.reason })),
    fertilizer_recommendations: fertilizers,
    next_action: "Apply recommended fertilizer within 5 days and retest soil in 10 days."
  };
};

const SoilTest = ({ 
  user, 
  params = { mode: 'prediction', plantId: null, cropName: '' }, 
  setParams, 
  setActiveTab,
  setHeaderActions,
  setResult,
  setToast
}) => {
  const isMonitoring = params.mode === 'monitoring';
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [envLoading, setEnvLoading] = useState(false);
  const [envError, setEnvError] = useState(null);
  const [locationActive, setLocationActive] = useState(true);
  
  // Monitoring result state after submission
  const [monitoringResult, setMonitoringResult] = useState(null);

  const [formData, setFormData] = useState({
    n: '',
    p: '',
    k: '',
    ph: '',
    moisture: '',
    temperature: '',
    humidity: '',
    rainfall: ''
  });

  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    // Clear custom header actions
    if (setHeaderActions) {
      setHeaderActions(null);
    }
  }, [setHeaderActions]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const errors = {};
    let isValid = true;

    const checkNumber = (val, fieldName, min = 0, max = 1000) => {
      if (val === '') {
        errors[fieldName] = "This field is required";
        isValid = false;
      } else if (isNaN(val)) {
        errors[fieldName] = "Must be a valid number";
        isValid = false;
      } else {
        const num = parseFloat(val);
        if (num < min || num > max) {
          errors[fieldName] = `Value must be between ${min} and ${max}`;
          isValid = false;
        }
      }
    };

    checkNumber(formData.n, 'n', 0, 500);
    checkNumber(formData.p, 'p', 0, 500);
    checkNumber(formData.k, 'k', 0, 500);
    checkNumber(formData.ph, 'ph', 0, 14);

    if (isMonitoring) {
      checkNumber(formData.moisture, 'moisture', 0, 100);
    } else {
      checkNumber(formData.temperature, 'temperature', -10, 60);
      checkNumber(formData.humidity, 'humidity', 0, 100);
      checkNumber(formData.rainfall, 'rainfall', 0, 1000);
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleAutoFetchEnv = () => {
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
          temperature: data.temp.toString(),
          humidity: data.humidity.toString(),
          rainfall: (data.rainfall || 100).toString()
        }));
        if (setToast) {
          setToast({ type: 'success', message: 'Environmental conditions updated!' });
          setTimeout(() => setToast(null), 3000);
        }
      } catch (err) {
        console.error('Weather API Error:', err);
        setEnvError("Failed to fetch weather. Please type manual readings.");
      } finally {
        setEnvLoading(false);
      }
    }, (err) => {
      console.error('Geolocation Error:', err);
      setEnvError("Could not retrieve GPS location.");
      setEnvLoading(false);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      if (isMonitoring) {
        // Monitoring Mode
        const reqData = {
          n: parseFloat(formData.n),
          p: parseFloat(formData.p),
          k: parseFloat(formData.k),
          ph: parseFloat(formData.ph),
          moisture: parseFloat(formData.moisture)
        };

        let res;
        if (user?.id) {
          res = await monitoringApi.submitMonitoring(params.plantId, reqData);
        } else {
          // Guest mode: offline calculation
          res = calculateGuestIntelligence(params.cropName, reqData);
          
          // Save results to guest crops in localStorage
          const guestCrops = JSON.parse(localStorage.getItem('planto_guest_crops')) || [];
          const updated = guestCrops.map(c => {
            if (c.id === params.plantId) {
              const newHist = [
                ...c.health_history,
                {
                  id: "hist-" + Date.now(),
                  health_score: res.health_score,
                  risk_level: res.status,
                  stage: res.stage,
                  notes: `Updated telemetry offline. Score: ${res.health_score}`,
                  created_at: new Date().toISOString()
                }
              ];
              const newPlan = [
                ...c.fertilizer_plans,
                ...res.fertilizer_recommendations.map((f, i) => ({
                  id: `fert-${Date.now()}-${i}`,
                  fertilizer_type: f.type,
                  quantity_kg: f.kg,
                  nutrient_target: f.nutrient_target,
                  explanation: f.reason,
                  created_at: new Date().toISOString()
                }))
              ];
              if (res.fertilizer_recommendations.length === 0) {
                newPlan.push({
                  id: "fert-" + Date.now(),
                  fertilizer_type: "None",
                  quantity_kg: 0,
                  explanation: "Optimal soil balance. No synthetic adjustments needed.",
                  created_at: new Date().toISOString()
                });
              }
              const newTelemetry = [
                ...c.monitoring_data,
                {
                  recorded_at: new Date().toISOString(),
                  nitrogen: reqData.n,
                  phosphorus: reqData.p,
                  potassium: reqData.k,
                  ph: reqData.ph,
                  moisture: reqData.moisture
                }
              ];
              return {
                ...c,
                health_history: newHist,
                fertilizer_plans: newPlan,
                monitoring_data: newTelemetry
              };
            }
            return c;
          });
          localStorage.setItem('planto_guest_crops', JSON.stringify(updated));
        }

        setMonitoringResult(res);
        if (setToast) {
          setToast({ type: 'success', message: 'Crop monitoring log updated successfully!' });
          setTimeout(() => setToast(null), 5000);
        }
      } else {
        // Prediction Mode
        const reqData = {
          n: parseFloat(formData.n),
          p: parseFloat(formData.p),
          k: parseFloat(formData.k),
          ph: parseFloat(formData.ph),
          temperature: parseFloat(formData.temperature),
          humidity: parseFloat(formData.humidity),
          rainfall: parseFloat(formData.rainfall),
        };

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
        if (setToast) {
          setToast({ type: 'success', message: `Analysis complete! Recommended: ${data.crop}` });
          setTimeout(() => setToast(null), 5000);
        }
      }
    } catch (err) {
      console.error('Submission error:', err);
      setError(isMonitoring ? 'Failed to log telemetry. Verify network status.' : 'Prediction link offline.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToMonitoring = () => {
    if (setParams) {
      setParams({ mode: 'prediction', plantId: null, cropName: '' });
    }
    setActiveTab('monitoring');
  };

  const getStatusColor = (status) => {
    if (status === 'Healthy') return 'var(--accent-emerald)';
    if (status === 'Moderate Risk') return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="dashboard-view animate-2" style={{ paddingTop: 0 }}>
      {/* If telemetry result is ready, display detailed crop analysis overview */}
      {isMonitoring && monitoringResult ? (
        <SoilTestResult 
          result={monitoringResult} 
          cropName={params.cropName || 'Planted Crop'} 
          onBack={handleBackToMonitoring} 
        />
      ) : (
        <>
          <div className="pro-welcome-banner farmer-banner animate-1">
            <div className="banner-content">
              {isMonitoring && (
                <button 
                  onClick={handleBackToMonitoring}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'white', background: 'transparent', border: 'none', cursor: 'pointer', marginBottom: '0.5rem', fontWeight: 700, fontSize: '0.8rem' }}
                >
                  <ArrowLeft size={14} /> Back to Monitoring
                </button>
              )}
              <h2>{isMonitoring ? `Soil Update for ${params.cropName || 'Planted Crop'}` : 'Test Your Soil'}</h2>
              <p>
                {isMonitoring 
                  ? 'Input new soil telemetry coordinates. The diagnostics core will run precision models to update crop health indices.' 
                  : 'Enter your soil information and local weather below. Our AI will find the best crops to plant on your land.'}
              </p>
            </div>
            <div className="banner-icon">
              <FlaskConical size={120} color="rgba(255,255,255,0.1)" />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="widgets-grid animate-3">
            
            {/* Weather / Environmental Widget (Prediction mode only) */}
            {!isMonitoring && (
              <div className="widget weather-widget">
                <div className="weather-bg-circles">
                  <div className="weather-circle" style={{ width: '150px', height: '150px', top: '-20px', left: '-50px' }}></div>
                  <div className="weather-circle" style={{ width: '80px', height: '80px', bottom: '20px', right: '40px' }}></div>
                </div>
                
                <div className="weather-content">
                  <div className="widget-header" style={{ marginBottom: '0.75rem' }}>
                    <span className="widget-title" style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <CloudSun size={20} color="rgba(255,255,255,0.8)" />
                      Local Weather
                    </span>
                    <button 
                      type="button" 
                      onClick={handleAutoFetchEnv} 
                      className="planto-btn-secondary"
                      disabled={envLoading}
                      style={{ cursor: 'pointer' }}
                    >
                      {envLoading ? <Loader2 size={14} className="lucide-spin" style={{ animation: 'spin 1s linear infinite' }}/> : <MapPin size={14}/>}
                      {envLoading ? 'Finding Weather...' : 'Find My Weather'}
                    </button>
                  </div>
                  
                  {envError && <div className="planto-alert alert-error" style={{ marginBottom: '1rem' }}>{envError}</div>}
                  
                  <div className="input-group-grid" style={{ marginTop: 'auto', position: 'relative' }}>
                    <div>
                      <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)', marginBottom: '0.2rem', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Temperature (°C)</label>
                      <div className="pro-input-wrapper">
                        <div className="pro-input-icon"><ThermometerSun size={16} /></div>
                        <input type="text" name="temperature" className="pro-input" value={formData.temperature} onChange={handleInputChange} placeholder="e.g. 24.5" />
                      </div>
                      {formErrors.temperature && <div style={{ color: '#f87171', fontSize: '0.65rem', marginTop: '0.2rem', fontWeight: 600 }}>{formErrors.temperature}</div>}
                    </div>
                    
                    <div>
                      <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)', marginBottom: '0.2rem', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Humidity (%)</label>
                      <div className="pro-input-wrapper">
                        <div className="pro-input-icon"><Droplets size={16} /></div>
                        <input type="text" name="humidity" className="pro-input" value={formData.humidity} onChange={handleInputChange} placeholder="e.g. 82.0" />
                      </div>
                      {formErrors.humidity && <div style={{ color: '#f87171', fontSize: '0.65rem', marginTop: '0.2rem', fontWeight: 600 }}>{formErrors.humidity}</div>}
                    </div>
                    
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)', marginBottom: '0.2rem', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Rainfall Amount (mm)</label>
                      <div className="pro-input-wrapper">
                        <div className="pro-input-icon"><CloudRain size={16} /></div>
                        <input type="text" name="rainfall" className="pro-input" value={formData.rainfall} onChange={handleInputChange} placeholder="e.g. 200" />
                      </div>
                      {formErrors.rainfall && <div style={{ color: '#f87171', fontSize: '0.65rem', marginTop: '0.2rem', fontWeight: 600 }}>{formErrors.rainfall}</div>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Soil Details Widget */}
            <div className="widget growth-widget" style={{ position: 'relative', overflow: 'hidden', gridColumn: isMonitoring ? '1 / -1' : 'span 1' }}>
              <div className="widget-header">
                <span className="widget-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', position: 'relative' }}>
                  <FlaskConical size={20} color="var(--bg-sidebar)" />
                  Soil Information
                </span>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.7rem', fontWeight: 800, 
                  color: 'var(--bg-sidebar)', background: 'var(--widget-light-yellow)', 
                  padding: '0.4rem 0.8rem', borderRadius: '50px', border: '1px solid rgba(42, 67, 53, 0.1)'
                }}>
                  <div style={{ width: '6px', height: '6px', background: '#10b981', borderRadius: '50%', boxShadow: '0 0 6px #10b981' }}></div>
                  TYPE IN DETAILS
                </div>
              </div>
              
              <div className="input-group-grid" style={{ marginTop: '0.2rem', position: 'relative' }}>
                <div>
                  <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.2rem', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Nitrogen level (N)</label>
                  <div className="pro-input-wrapper">
                    <div className="pro-input-icon"><Leaf size={16} /></div>
                    <input type="text" name="n" className="pro-input" value={formData.n} onChange={handleInputChange} placeholder="e.g. 90" />
                  </div>
                  {formErrors.n && <div style={{ color: '#ef4444', fontSize: '0.65rem', marginTop: '0.2rem', fontWeight: 600 }}>{formErrors.n}</div>}
                </div>
                
                <div>
                  <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.2rem', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Phosphorus level (P)</label>
                  <div className="pro-input-wrapper">
                    <div className="pro-input-icon"><Sprout size={16} /></div>
                    <input type="text" name="p" className="pro-input" value={formData.p} onChange={handleInputChange} placeholder="e.g. 42" />
                  </div>
                  {formErrors.p && <div style={{ color: '#ef4444', fontSize: '0.65rem', marginTop: '0.2rem', fontWeight: 600 }}>{formErrors.p}</div>}
                </div>

                <div>
                  <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.2rem', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Potassium level (K)</label>
                  <div className="pro-input-wrapper">
                    <div className="pro-input-icon"><Droplets size={16} /></div>
                    <input type="text" name="k" className="pro-input" value={formData.k} onChange={handleInputChange} placeholder="e.g. 43" />
                  </div>
                  {formErrors.k && <div style={{ color: '#ef4444', fontSize: '0.65rem', marginTop: '0.2rem', fontWeight: 600 }}>{formErrors.k}</div>}
                </div>

                <div>
                  <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.2rem', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Soil Acid Level (pH)</label>
                  <div className="pro-input-wrapper">
                    <div className="pro-input-icon"><FlaskConical size={16} /></div>
                    <input type="text" name="ph" className="pro-input" value={formData.ph} onChange={handleInputChange} placeholder="e.g. 6.5" />
                  </div>
                  {formErrors.ph && <div style={{ color: '#ef4444', fontSize: '0.65rem', marginTop: '0.2rem', fontWeight: 600 }}>{formErrors.ph}</div>}
                </div>

                {isMonitoring && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.2rem', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Soil Moisture (%)</label>
                    <div className="pro-input-wrapper">
                      <div className="pro-input-icon"><Droplets size={16} /></div>
                      <input type="text" name="moisture" className="pro-input" value={formData.moisture} onChange={handleInputChange} placeholder="e.g. 72" />
                    </div>
                    {formErrors.moisture && <div style={{ color: '#ef4444', fontSize: '0.65rem', marginTop: '0.2rem', fontWeight: 600 }}>{formErrors.moisture}</div>}
                  </div>
                )}
              </div>
            </div>

            <div className="execute-row animate-3" style={{ gridColumn: '1 / -1', marginTop: '1rem' }}>
              <button type="submit" className="action-btn-pro" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
                {loading ? <Loader2 size={18} className="lucide-spin" style={{ animation: 'spin 1s linear infinite' }} /> : <Sprout size={18} />}
                {loading 
                  ? (isMonitoring ? 'Updating Telemetry...' : 'Checking Your Soil...') 
                  : (isMonitoring ? 'Submit Monitoring Soil Readings' : 'Find Best Crops Now')}
              </button>
              {error && <div className="planto-alert alert-error" style={{ marginTop: '1rem' }}>{error}</div>}
            </div>
          </form>
        </>
      )}
    </div>
  );
};

export default SoilTest;
