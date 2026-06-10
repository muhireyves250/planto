import React, { useState, useEffect } from 'react';
import { 
  User, 
  Settings as SettingsIcon, 
  Bell, 
  Shield, 
  MapPin, 
  Globe, 
  Database, 
  Cpu, 
  Cloud,
  Mail,
  Smartphone,
  Check,
  Save,
  LogOut,
  ChevronRight,
  Fingerprint
} from 'lucide-react';
import FarmManagement from './pages/FarmManagement';

const Settings = ({ user, setUser, setHeaderActions }) => {
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('profile');
  const [settingsData, setSettingsData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    farm_name: '',
    primary_phone: '',
    default_soil_type: 'Loamy',
    irrigation_system: 'Drip Irrigation',
    farm_location: '',
    notify_email: true,
    notify_push: true,
    notify_sms: false,
  });

  useEffect(() => {
    if (user?.id) {
      const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8080';
      fetch(`${BASE_URL}/settings/${user.id}`)
        .then(res => res.json())
        .then(data => {
          setSettingsData({
            full_name: data.full_name || '',
            email: data.email || '',
            farm_name: data.farm_name || '',
            primary_phone: data.phone || '',
            default_soil_type: data.farm_size || 'Loamy',
            irrigation_system: data.preferred_language || 'Drip Irrigation',
            farm_location: data.farm_location || '',
            notify_email: data.notify_email !== false,
            notify_push: data.notify_push !== false,
            notify_sms: data.notify_sms || false,
          });
        })
        .catch(err => console.error("Failed to load settings:", err));
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettingsData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8080';
      const res = await fetch(`${BASE_URL}/settings/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: settingsData.primary_phone,
          farm_location: settingsData.farm_location,
          farm_size: settingsData.default_soil_type,
          preferred_language: settingsData.irrigation_system,
        })
      });
      const updatedUser = await res.json();
      if (res.ok && setUser) {
        // Optionally update global user state
        setUser({ ...user, full_name: updatedUser.full_name, email: updatedUser.email });
      }
    } catch (err) {
      console.error("Failed to save settings:", err);
    } finally {
      setTimeout(() => setSaving(false), 500);
    }
  };

  useEffect(() => {
    if (setHeaderActions) {
      setHeaderActions(
        <button onClick={handleSave} className="action-btn-pro" style={{gap: '0.5rem', padding: '0.5rem 1.25rem', fontSize: '0.85rem'}}>
          {saving ? <div className="lucide-spin" style={{width: '16px', height: '16px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%'}}></div> : <Save size={16} />}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      );
    }
  }, [saving, settingsData, user, setHeaderActions]);

  const handleLogout = () => {
    localStorage.removeItem('planto_user');
    if (setUser) setUser(null);
  };

  const sections = [
    { id: 'profile', label: 'Profile Settings', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'preferences', label: 'Preferences', icon: Globe },
    { id: 'farm', label: 'Manage My Farms', icon: MapPin }
  ];

  const isMobile = window.innerWidth <= 768;

  if (isMobile) {
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.full_name || 'F')}&background=2d5240&color=fff&size=96&bold=true`;
    const mobileTabs = [
      { id: 'profile', label: 'Profile', icon: User },
      { id: 'security', label: 'Security', icon: Shield },
      { id: 'notifications', label: 'Alerts', icon: Bell },
      { id: 'preferences', label: 'Prefs', icon: Globe },
      { id: 'farm', label: 'Farms', icon: MapPin },
    ];

    return (
      <div style={{ background: '#f0f2ef', minHeight: '100dvh', fontFamily: "'Outfit', sans-serif" }}>

        {/* Fixed hero + tab nav */}
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 20, borderRadius: '0 0 22px 22px', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.15)' }}>
          <div style={{ background: 'linear-gradient(135deg,#1e362a 0%,#2d5240 100%)', padding: '1rem 1rem 1rem' }}>
            <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.55)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.5rem' }}>Account</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.85rem' }}>
              <img src={avatarUrl} alt="avatar" style={{ width: 44, height: 44, borderRadius: '50%', border: '2.5px solid rgba(255,255,255,0.3)', objectFit: 'cover', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#fff', lineHeight: 1.1, letterSpacing: '-0.5px' }}>{user?.full_name || 'Farmer'}</div>
                <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.65)', marginTop: '0.15rem' }}>{user?.email || ''}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              {mobileTabs.map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setActiveSection(id)} style={{ flex: 1, background: activeSection === id ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', border: activeSection === id ? '1.5px solid rgba(255,255,255,0.5)' : '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', padding: '0.55rem 0.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem', cursor: 'pointer', transition: 'all 0.2s', fontFamily: "'Outfit', sans-serif" }}>
                  <Icon size={15} color={activeSection === id ? '#fff' : 'rgba(255,255,255,0.6)'} />
                  <span style={{ fontSize: '0.55rem', fontWeight: 700, color: activeSection === id ? '#fff' : 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.04em', lineHeight: 1 }}>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Scrollable content below fixed hero */}
        <div style={{ paddingTop: '200px', padding: '200px 1rem 0', paddingBottom: 'calc(100px + env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

          {/* ── Profile ── */}
          {activeSection === 'profile' && (<>
            <div style={{ background: '#fff', borderRadius: '20px', padding: '1.25rem', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1rem' }}>Personal Details</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[
                  { label: 'Full Name', name: 'full_name', type: 'text', icon: User, placeholder: 'Your full name' },
                  { label: 'Email Address', name: 'email', type: 'email', icon: Mail, placeholder: 'your@email.com' },
                  { label: 'Farm Name', name: 'farm_name', type: 'text', icon: Globe, placeholder: 'e.g. Verdant Valley Estates' },
                  { label: 'Primary Phone', name: 'primary_phone', type: 'text', icon: Smartphone, placeholder: 'e.g. +250 7XX XXX XXX' },
                ].map(({ label, name, type, icon: Icon, placeholder }) => (
                  <div key={name}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>{label}</div>
                    <div style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }}><Icon size={15} /></div>
                      <input type={type} name={name} value={settingsData[name]} onChange={handleInputChange} placeholder={placeholder}
                        style={{ width: '100%', height: 48, borderRadius: '14px', border: '1.5px solid #e2e8f0', background: '#f8fafc', paddingLeft: '2.5rem', paddingRight: '1rem', fontSize: '0.9rem', fontWeight: 600, fontFamily: "'Outfit', sans-serif", outline: 'none', boxSizing: 'border-box', color: '#0f172a' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <button onClick={handleSave} disabled={saving} style={{ width: '100%', background: '#1e362a', color: '#fff', border: 'none', borderRadius: '16px', padding: '1rem', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontFamily: "'Outfit', sans-serif", opacity: saving ? 0.7 : 1 }}>
              {saving ? <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> : <Save size={16} />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </>)}

          {/* ── Notifications ── */}
          {activeSection === 'notifications' && (
            <div style={{ background: '#fff', borderRadius: '20px', padding: '1.25rem', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1rem' }}>Notification Channels</div>
              {[
                { name: 'notify_email', title: 'Email Alerts', desc: 'Daily harvest summaries via email', icon: Mail },
                { name: 'notify_push', title: 'Push Notifications', desc: 'Real-time soil & crop alerts', icon: Bell },
                { name: 'notify_sms', title: 'Critical SMS', desc: 'Weather emergency text messages', icon: Smartphone },
              ].map(({ name, title, desc, icon: Icon }, i, arr) => (
                <div key={name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 0', borderBottom: i < arr.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '10px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={16} color="#059669" /></div>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>{title}</div>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{desc}</div>
                    </div>
                  </div>
                  <label className="mob-pro-switch">
                    <input type="checkbox" name={name} checked={settingsData[name]} onChange={handleInputChange} />
                    <span className="mob-slider" />
                  </label>
                </div>
              ))}
            </div>
          )}

          {/* ── Preferences ── */}
          {activeSection === 'preferences' && (<>
            <div style={{ background: '#fff', borderRadius: '20px', padding: '1.25rem', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Farm Defaults</div>
              {[
                { label: 'Default Soil Type', name: 'default_soil_type', opts: ['Loamy','Sandy','Clay','Silty','Peaty','Chalky'] },
                { label: 'Irrigation System', name: 'irrigation_system', opts: ['Drip Irrigation','Sprinkler','Surface Irrigation','Subsurface Drip','Rain-fed'] },
              ].map(({ label, name, opts }) => (
                <div key={name}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>{label}</div>
                  <select name={name} value={settingsData[name]} onChange={handleInputChange}
                    style={{ width: '100%', height: 48, borderRadius: '14px', border: '1.5px solid #e2e8f0', background: '#f8fafc', padding: '0 1rem', fontSize: '0.9rem', fontWeight: 600, fontFamily: "'Outfit', sans-serif", outline: 'none', color: '#0f172a', cursor: 'pointer' }}>
                    {opts.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              ))}
              <div>
                <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>Farm Location</div>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }}><MapPin size={15} /></div>
                  <input type="text" name="farm_location" value={settingsData.farm_location} onChange={handleInputChange} placeholder="e.g. Musanze, Northern Province"
                    style={{ width: '100%', height: 48, borderRadius: '14px', border: '1.5px solid #e2e8f0', background: '#f8fafc', paddingLeft: '2.5rem', paddingRight: '1rem', fontSize: '0.9rem', fontWeight: 600, fontFamily: "'Outfit', sans-serif", outline: 'none', boxSizing: 'border-box', color: '#0f172a' }} />
                </div>
              </div>
            </div>
            <button onClick={handleSave} disabled={saving} style={{ width: '100%', background: '#1e362a', color: '#fff', border: 'none', borderRadius: '16px', padding: '1rem', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontFamily: "'Outfit', sans-serif", opacity: saving ? 0.7 : 1 }}>
              {saving ? <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> : <Save size={16} />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </>)}

          {/* ── Security ── */}
          {activeSection === 'security' && (<>
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '20px', padding: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
              <div style={{ width: 48, height: 48, borderRadius: '14px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(16,185,129,0.15)', flexShrink: 0 }}><Fingerprint size={22} color="#059669" /></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#166534', marginBottom: '0.2rem' }}>Two-Factor Auth</div>
                <div style={{ fontSize: '0.75rem', color: '#15803d', marginBottom: '0.75rem' }}>Add an extra layer of security.</div>
                <button style={{ background: '#1e362a', color: '#fff', border: 'none', borderRadius: '10px', padding: '0.45rem 1rem', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}>Enable 2FA</button>
              </div>
            </div>
            <div style={{ background: '#fff', borderRadius: '20px', padding: '1.25rem', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Change Password</div>
              <input type="password" placeholder="New password" style={{ width: '100%', height: 48, borderRadius: '14px', border: '1.5px solid #e2e8f0', background: '#f8fafc', padding: '0 1rem', fontSize: '0.9rem', fontWeight: 600, fontFamily: "'Outfit', sans-serif", outline: 'none', boxSizing: 'border-box', marginBottom: '0.75rem' }} />
              <button style={{ width: '100%', background: '#1e362a', color: '#fff', border: 'none', borderRadius: '14px', padding: '0.85rem', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}>Update Password</button>
            </div>
          </>)}

          {/* ── Farms ── */}
          {activeSection === 'farm' && (
            <div style={{ background: '#fff', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
              <FarmManagement user={user} />
            </div>
          )}

          {/* Sign Out — always at bottom like crop-status export button */}
          <button onClick={handleLogout} style={{ width: '100%', background: '#fff1f2', color: '#e11d48', border: 'none', borderRadius: '16px', padding: '1rem', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontFamily: "'Outfit', sans-serif" }}>
            <LogOut size={16} /> Sign Out
          </button>

        </div>

        <style>{`
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          .mob-pro-switch { position: relative; display: inline-block; width: 48px; height: 24px; flex-shrink: 0; }
          .mob-pro-switch input { opacity: 0; width: 0; height: 0; }
          .mob-slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background: #cbd5e1; transition: .3s; border-radius: 34px; }
          .mob-slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background: white; transition: .3s; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .mob-pro-switch input:checked + .mob-slider { background: #10b981; }
          .mob-pro-switch input:checked + .mob-slider:before { transform: translateX(24px); }
        `}</style>
      </div>
    );
  }

  return (
    <div className="dashboard-view animate-2" style={{ paddingTop: 0 }}>

      {/* Settings Welcome Banner - Matching Dashboard Template */}
      <div className="pro-welcome-banner farmer-banner animate-1" style={{padding: '1.5rem 2rem', marginBottom: '1.5rem'}}>
        <div className="banner-content">
          <h2 style={{fontSize: '1.8rem'}}>{user?.full_name?.split(' ')[0] || 'Farmer'}'s Settings</h2>
          <p style={{fontSize: '0.9rem', maxWidth: '450px'}}>
            Manage your profile, farm preferences, notifications, and security from one central hub.
          </p>
        </div>
        <div className="banner-icon">
          <SettingsIcon size={80} color="rgba(255,255,255,0.1)" />
        </div>
      </div>

      <div className="dashboard-grid-matching settings-grid-override">
        {/* Left Col: Navigation */}
        <div className="dashboard-col">
           <div className="dashboard-card matching-card" style={{padding: '0.25rem', height: '100%'}}>
              <div className="settings-nav">
                {sections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <div 
                      key={section.id} 
                      className={`settings-nav-item ${activeSection === section.id ? 'active' : ''}`}
                      onClick={() => setActiveSection(section.id)}
                      style={{padding: '0.65rem 1rem', fontSize: '0.85rem', gap: '0.75rem'}}
                    >
                      <Icon size={16} />
                      <span>{section.label}</span>
                      <ChevronRight size={12} className="nav-arrow" />
                    </div>
                  );
                })}
              </div>
              <div style={{marginTop: 'auto', padding: '0.75rem', borderTop: '1px solid rgba(0,0,0,0.05)'}}>
                 <button className="logout-btn" style={{padding: '0.65rem 1rem', fontSize: '0.85rem'}}>
                   <LogOut size={16} />
                   <span>Sign Out</span>
                 </button>
              </div>
           </div>
        </div>

        {/* Right Col: Content */}
        <div className="dashboard-col">
          <div className="dashboard-card matching-card flex-1">
            
            {activeSection === 'profile' && (
              <div className="settings-content-area animate-fade-in">
                <div className="content-header" style={{marginBottom: '1.5rem'}}>
                  <h3 style={{fontSize: '1.2rem'}}>Profile Information</h3>
                  <p style={{fontSize: '0.8rem'}}>Manage your personal details and farm identity.</p>
                </div>
                
                <div className="settings-form-grid" style={{gap: '1.25rem'}}>
                  <div className="form-group">
                    <label style={{fontSize: '0.65rem'}}>Full Name</label>
                    <div className="pro-input-wrapper">
                      <div className="pro-input-icon"><User size={14} /></div>
                      <input type="text" name="full_name" className="pro-input" value={settingsData.full_name} onChange={handleInputChange} style={{fontSize: '0.85rem', padding: '0.5rem 0.5rem 0.5rem 2.2rem'}} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label style={{fontSize: '0.65rem'}}>Email Address</label>
                    <div className="pro-input-wrapper">
                      <div className="pro-input-icon"><Mail size={14} /></div>
                      <input type="email" name="email" className="pro-input" value={settingsData.email} onChange={handleInputChange} style={{fontSize: '0.85rem', padding: '0.5rem 0.5rem 0.5rem 2.2rem'}} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label style={{fontSize: '0.65rem'}}>Farm Name</label>
                    <div className="pro-input-wrapper">
                      <div className="pro-input-icon"><Globe size={14} /></div>
                      <input type="text" name="farm_name" className="pro-input" value={settingsData.farm_name} onChange={handleInputChange} placeholder="e.g. Verdant Valley Estates" style={{fontSize: '0.85rem', padding: '0.5rem 0.5rem 0.5rem 2.2rem'}} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label style={{fontSize: '0.65rem'}}>Primary Phone</label>
                    <div className="pro-input-wrapper">
                      <div className="pro-input-icon"><Smartphone size={14} /></div>
                      <input type="text" name="primary_phone" className="pro-input" value={settingsData.primary_phone} onChange={handleInputChange} placeholder="e.g. +1 (555) 012-3456" style={{fontSize: '0.85rem', padding: '0.5rem 0.5rem 0.5rem 2.2rem'}} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'farm' && (
              <div className="settings-content-area animate-fade-in" style={{ padding: 0 }}>
                <FarmManagement user={user} />
              </div>
            )}

            {activeSection === 'notifications' && (
              <div className="settings-content-area animate-fade-in">
                <div className="content-header" style={{marginBottom: '1.5rem'}}>
                  <h3 style={{fontSize: '1.2rem'}}>Notification Preferences</h3>
                  <p style={{fontSize: '0.8rem'}}>Choose how you want to receive alerts and report updates.</p>
                </div>
                
                <div className="preference-list" style={{gap: '0.75rem'}}>
                  <div className="preference-item" style={{padding: '0.75rem 1rem'}}>
                    <div className="pref-info">
                      <h4 style={{fontSize: '0.9rem'}}>Email Alerts</h4>
                      <p style={{fontSize: '0.7rem'}}>Receive daily harvest summaries via email.</p>
                    </div>
                    <label className="pro-switch" style={{width: '40px', height: '20px'}}>
                      <input type="checkbox" name="notify_email" checked={settingsData.notify_email} onChange={handleInputChange} />
                      <span className="slider" style={{borderRadius: '20px'}}></span>
                    </label>
                  </div>
                  <div className="preference-item" style={{padding: '0.75rem 1rem'}}>
                    <div className="pref-info">
                      <h4 style={{fontSize: '0.9rem'}}>Push Notifications</h4>
                      <p style={{fontSize: '0.7rem'}}>Real-time alerts for low soil moisture or NPK imbalances.</p>
                    </div>
                    <label className="pro-switch" style={{width: '40px', height: '20px'}}>
                      <input type="checkbox" name="notify_push" checked={settingsData.notify_push} onChange={handleInputChange} />
                      <span className="slider" style={{borderRadius: '20px'}}></span>
                    </label>
                  </div>
                  <div className="preference-item" style={{padding: '0.75rem 1rem'}}>
                    <div className="pref-info">
                      <h4 style={{fontSize: '0.9rem'}}>Critical SMS</h4>
                      <p style={{fontSize: '0.7rem'}}>Immediate text messages for weather emergencies.</p>
                    </div>
                    <label className="pro-switch" style={{width: '40px', height: '20px'}}>
                      <input type="checkbox" name="notify_sms" checked={settingsData.notify_sms} onChange={handleInputChange} />
                      <span className="slider" style={{borderRadius: '20px'}}></span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'preferences' && (
              <div className="settings-content-area animate-fade-in">
                <div className="content-header" style={{marginBottom: '1.5rem'}}>
                  <h3 style={{fontSize: '1.2rem'}}>Farm Preferences</h3>
                  <p style={{fontSize: '0.8rem'}}>Set your default agronomic settings. These are used to pre-fill forms.</p>
                </div>

                <div className="settings-form-grid" style={{gap: '1.25rem'}}>
                  <div className="form-group">
                    <label style={{fontSize: '0.65rem'}}>Default Soil Type</label>
                    <select
                      name="default_soil_type"
                      className="pro-input"
                      value={settingsData.default_soil_type}
                      onChange={handleInputChange}
                      style={{paddingLeft: '0.75rem', fontSize: '0.85rem', height: '42px', cursor: 'pointer'}}
                    >
                      {['Loamy', 'Sandy', 'Clay', 'Silty', 'Peaty', 'Chalky'].map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label style={{fontSize: '0.65rem'}}>Irrigation System</label>
                    <select
                      name="irrigation_system"
                      className="pro-input"
                      value={settingsData.irrigation_system}
                      onChange={handleInputChange}
                      style={{paddingLeft: '0.75rem', fontSize: '0.85rem', height: '42px', cursor: 'pointer'}}
                    >
                      {['Drip Irrigation', 'Sprinkler', 'Surface Irrigation', 'Subsurface Drip', 'Rain-fed'].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group full-width">
                    <label style={{fontSize: '0.65rem'}}>Farm Location (City or Region)</label>
                    <div className="pro-input-wrapper">
                      <div className="pro-input-icon"><MapPin size={14} /></div>
                      <input
                        type="text"
                        name="farm_location"
                        className="pro-input"
                        value={settingsData.farm_location}
                        onChange={handleInputChange}
                        placeholder="e.g. Musanze, Northern Province"
                        style={{fontSize: '0.85rem', padding: '0.5rem 0.5rem 0.5rem 2.2rem'}}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'security' && (
              <div className="settings-content-area animate-fade-in">
                <div className="content-header" style={{marginBottom: '1.5rem'}}>
                  <h3 style={{fontSize: '1.2rem'}}>Security & Privacy</h3>
                  <p style={{fontSize: '0.8rem'}}>Secure your data and manage account access.</p>
                </div>
                
                <div className="security-card" style={{padding: '1.25rem'}}>
                   <div className="security-icon-box" style={{width: '48px', height: '48px'}}><Fingerprint size={24} color="var(--accent-emerald)" /></div>
                   <div className="security-text">
                      <h4 style={{fontSize: '1rem'}}>Two-Factor Authentication</h4>
                      <p style={{fontSize: '0.75rem'}}>Add an extra layer of security to your farm data.</p>
                      <button className="planto-btn-secondary" style={{color: 'var(--bg-sidebar)', borderColor: 'var(--bg-sidebar)', marginTop: '0.5rem', padding: '0.4rem 1rem', fontSize: '0.75rem'}}>Enable 2FA</button>
                   </div>
                </div>

                <div className="form-group" style={{marginTop: '1.5rem'}}>
                    <label style={{fontSize: '0.65rem'}}>Change Password</label>
                    <div style={{display: 'flex', gap: '0.75rem'}}>
                       <input type="password" placeholder="New Password" className="pro-input" style={{paddingLeft: '0.75rem', fontSize: '0.85rem', height: '36px'}} />
                       <button className="planto-btn-secondary" style={{color: 'var(--bg-sidebar)', borderColor: 'var(--bg-sidebar)', padding: '0.4rem 1rem', fontSize: '0.75rem'}}>Update</button>
                    </div>
                </div>
              </div>
            )}

            {activeSection === 'system' && (
              <div className="settings-content-area animate-fade-in">
                <div className="content-header" style={{marginBottom: '1.5rem'}}>
                  <h3 style={{fontSize: '1.2rem'}}>System & Integration</h3>
                  <p style={{fontSize: '0.8rem'}}>Monitor your VERA backend status and API connectivity.</p>
                </div>
                
                <div className="system-status-grid" style={{gap: '0.75rem'}}>
                   <div className="status-pill" style={{padding: '0.75rem'}}>
                      <div className="status-dot online"></div>
                      <div className="status-label" style={{fontSize: '0.6rem'}}>Backend API</div>
                      <div className="status-val" style={{fontSize: '0.8rem'}}>Operational</div>
                   </div>
                   <div className="status-pill" style={{padding: '0.75rem'}}>
                      <div className="status-dot online"></div>
                      <div className="status-label" style={{fontSize: '0.6rem'}}>Database</div>
                      <div className="status-val" style={{fontSize: '0.8rem'}}>Synchronized</div>
                   </div>
                   <div className="status-pill" style={{padding: '0.75rem'}}>
                      <div className="status-dot warning"></div>
                      <div className="status-label" style={{fontSize: '0.6rem'}}>Weather API</div>
                      <div className="status-val" style={{fontSize: '0.8rem'}}>Latency High</div>
                   </div>
                </div>

                <div className="form-group" style={{marginTop: '1.5rem'}}>
                    <label style={{fontSize: '0.65rem'}}>API Key</label>
                    <div className="pro-input-wrapper">
                      <div className="pro-input-icon"><Database size={14} /></div>
                      <input type="password" value="YOUR_API_KEY_HERE" className="pro-input" readOnly style={{fontSize: '0.85rem', padding: '0.5rem 0.5rem 0.5rem 2.2rem'}} />
                    </div>
                    <p style={{fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '0.4rem'}}>Keep this key secret. Do not share with unauthorized users.</p>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      <style>{`
        .settings-nav {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          padding: 0.5rem;
        }

        .settings-nav-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.85rem 1.25rem;
          border-radius: 12px;
          color: var(--text-muted);
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
        }

        .settings-nav-item:hover {
          background: rgba(16, 185, 129, 0.05);
          color: var(--bg-sidebar);
          transform: translateX(4px);
        }

        .settings-nav-item.active {
          background: var(--bg-sidebar);
          color: white;
          box-shadow: 0 4px 12px rgba(30, 54, 42, 0.2);
        }

        .nav-arrow {
          margin-left: auto;
          opacity: 0.3;
        }

        .settings-nav-item.active .nav-arrow {
          opacity: 1;
        }

        .logout-btn {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.85rem 1.25rem;
          border-radius: 12px;
          background: #fff1f2;
          color: #e11d48;
          border: none;
          font-weight: 700;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .logout-btn:hover {
          background: #ffe4e6;
          transform: translateY(-2px);
        }

        .settings-content-area {
          padding: 1rem;
        }

        .content-header {
          margin-bottom: 2.5rem;
        }

        .content-header h3 {
          font-family: var(--font-heading);
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--bg-sidebar);
          margin-bottom: 0.4rem;
        }

        .content-header p {
          color: var(--text-muted);
          font-size: 0.9rem;
        }

        .settings-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }

        .form-group.full-width {
          grid-column: 1 / -1;
        }

        .form-group label {
          font-size: 0.75rem;
          font-weight: 800;
          color: var(--text-dark);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .preference-list {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .preference-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.25rem;
          background: #f8fafc;
          border-radius: var(--radius-lg);
          border: 1px solid rgba(0,0,0,0.03);
        }

        .pref-info h4 {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text-dark);
          margin-bottom: 0.2rem;
        }

        .pref-info p {
          font-size: 0.8rem;
          color: var(--text-muted);
        }

        /* Toggle Switch */
        .pro-switch {
          position: relative;
          display: inline-block;
          width: 48px;
          height: 24px;
        }

        .pro-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #cbd5e1;
          transition: .4s;
          border-radius: 34px;
        }

        .slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: .4s;
          border-radius: 50%;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        input:checked + .slider {
          background-color: var(--accent-emerald);
        }

        input:checked + .slider:before {
          transform: translateX(24px);
        }

        .security-card {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          background: #f0fdf4;
          padding: 2rem;
          border-radius: var(--radius-xl);
          border: 1px solid rgba(16, 185, 129, 0.1);
        }

        .security-icon-box {
          width: 64px;
          height: 64px;
          background: white;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 16px rgba(16, 185, 129, 0.1);
        }

        .security-text h4 {
          font-size: 1.1rem;
          font-weight: 700;
          color: #065f46;
          margin-bottom: 0.25rem;
        }

        .security-text p {
          font-size: 0.85rem;
          color: #065f46;
          opacity: 0.8;
        }

        .system-status-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }

        .status-pill {
          background: white;
          padding: 1rem;
          border-radius: var(--radius-lg);
          border: 1px solid rgba(0,0,0,0.05);
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          box-shadow: var(--shadow-soft);
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin-bottom: 0.25rem;
        }

        .status-dot.online { background: var(--accent-emerald); box-shadow: 0 0 8px var(--accent-emerald); }
        .status-dot.warning { background: var(--accent-amber); box-shadow: 0 0 8px var(--accent-amber); }
        .status-dot.offline { background: var(--accent-rose); box-shadow: 0 0 8px var(--accent-rose); }

        .status-label {
          font-size: 0.65rem;
          font-weight: 800;
          color: var(--text-muted);
          text-transform: uppercase;
        }

        .status-val {
          font-size: 0.9rem;
          font-weight: 700;
          color: var(--text-dark);
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .lucide-spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
};

export default Settings;
