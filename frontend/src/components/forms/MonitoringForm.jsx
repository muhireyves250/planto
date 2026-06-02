import { useState, useEffect } from 'react';
import { Droplets, ThermometerSun, FlaskConical, Leaf, Sprout, Send, Loader2, Activity, Waves, Wind } from 'lucide-react';
import { sensorApi } from '../../api/sensorApi';

const MonitoringForm = ({ onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    n: '',
    p: '',
    k: '',
    ph: '',
    moisture: '',
    temperature: '',
    humidity: ''
  });
  const [sensorActive, setSensorActive] = useState(false);

  useEffect(() => {
    const poll = async () => {
      try {
        const result = await sensorApi.getLatest();
        if (result.data) {
          setSensorActive(true);
          setFormData({
            n: String(result.data.n),
            p: String(result.data.p),
            k: String(result.data.k),
            ph: String(result.data.ph),
            moisture: String(result.data.moisture),
            temperature: String(result.data.temperature),
            humidity: String(result.data.humidity)
          });
        } else {
          setSensorActive(false);
        }
      } catch {
        setSensorActive(false);
      }
    };

    poll();
    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="widgets-grid" style={{gridTemplateColumns: '1fr'}}>
      <div className="widget growth-widget" style={{background: 'white', border: '1px solid #e2e8f0'}}>
        <div className="widget-header">
          <span className="widget-title" style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
            <Activity size={20} color="var(--bg-sidebar)" />
            Update Soil Health
          </span>
          <span style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            fontSize: '0.75rem', fontWeight: 600,
            color: sensorActive ? '#16a34a' : '#94a3b8'
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: sensorActive ? '#16a34a' : '#94a3b8',
              display: 'inline-block'
            }} />
            {sensorActive ? 'Sensor Active' : 'No Signal'}
          </span>
        </div>

        <div className="input-group-grid" style={{marginTop: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem'}}>
          <div className="pro-input-group">
            <label className="pro-label">NITROGEN (N)</label>
            <div className="pro-input-wrapper">
              <div className="pro-input-icon"><Leaf size={16} /></div>
              <input type="number" name="n" className="pro-input" value={formData.n} onChange={handleChange} required />
            </div>
          </div>
          <div className="pro-input-group">
            <label className="pro-label">PHOSPHORUS (P)</label>
            <div className="pro-input-wrapper">
              <div className="pro-input-icon"><Sprout size={16} /></div>
              <input type="number" name="p" className="pro-input" value={formData.p} onChange={handleChange} required />
            </div>
          </div>
          <div className="pro-input-group">
            <label className="pro-label">POTASSIUM (K)</label>
            <div className="pro-input-wrapper">
              <div className="pro-input-icon"><Droplets size={16} /></div>
              <input type="number" name="k" className="pro-input" value={formData.k} onChange={handleChange} required />
            </div>
          </div>
          <div className="pro-input-group">
            <label className="pro-label">SOIL PH</label>
            <div className="pro-input-wrapper">
              <div className="pro-input-icon"><FlaskConical size={16} /></div>
              <input type="number" step="0.1" name="ph" className="pro-input" value={formData.ph} onChange={handleChange} required />
            </div>
          </div>
          <div className="pro-input-group" style={{gridColumn: '1 / -1'}}>
            <label className="pro-label">MOISTURE (%)</label>
            <div className="pro-input-wrapper">
              <div className="pro-input-icon"><Waves size={16} /></div>
              <input type="number" name="moisture" className="pro-input" value={formData.moisture} onChange={handleChange} required />
            </div>
          </div>
          <div className="pro-input-group">
            <label className="pro-label">TEMPERATURE (°C)</label>
            <div className="pro-input-wrapper">
              <div className="pro-input-icon"><ThermometerSun size={16} /></div>
              <input type="number" step="0.1" name="temperature" className="pro-input" value={formData.temperature} onChange={handleChange} />
            </div>
          </div>
          <div className="pro-input-group">
            <label className="pro-label">HUMIDITY (%)</label>
            <div className="pro-input-wrapper">
              <div className="pro-input-icon"><Wind size={16} /></div>
              <input type="number" step="0.1" name="humidity" className="pro-input" value={formData.humidity} onChange={handleChange} />
            </div>
          </div>
        </div>

        <button type="submit" className="action-btn-pro" style={{marginTop: '1.5rem', width: '100%', justifyContent: 'center'}} disabled={loading}>
          {loading ? <Loader2 size={18} className="lucide-spin" /> : <Send size={18} />}
          {loading ? 'Submitting...' : 'Submit Soil Update'}
        </button>
      </div>
    </form>
  );
};

export default MonitoringForm;
