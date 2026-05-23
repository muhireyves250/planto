import React from 'react';
import { Bell, CheckCircle2, AlertTriangle, AlertCircle, Info } from 'lucide-react';

const AlertsPanel = ({ alerts, plantId, onMarkRead }) => {
  const cropAlerts = (alerts || []).filter(alert => alert.plant_id === plantId);

  const getAlertIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'critical':
        return <AlertCircle size={18} color="#ef4444" />;
      case 'warning':
        return <AlertTriangle size={18} color="#f59e0b" />;
      default:
        return <Info size={18} color="#3b82f6" />;
    }
  };

  const getAlertBadgeClass = (type) => {
    switch (type?.toLowerCase()) {
      case 'critical':
        return 'badge-critical';
      case 'warning':
        return 'badge-warning';
      default:
        return 'badge-info';
    }
  };

  return (
    <div className="dashboard-card matching-card glass-morph animate-3">
      <div className="card-header-simple">
        <div className="header-flex-compact">
          <h3>Active Crop Alerts</h3>
          <Bell size={16} color="var(--accent-rose)" />
        </div>
      </div>
      <div style={{ padding: '1.25rem' }}>
        {cropAlerts.length === 0 ? (
          <div style={{
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: '2.5rem 1.5rem',
            background: 'rgba(16, 185, 129, 0.04)',
            borderRadius: '16px',
            border: '1px dashed rgba(16, 185, 129, 0.2)',
            textAlign: 'center',
            gap: '0.75rem'
          }}>
            <div style={{
              width: '40px', 
              height: '40px', 
              borderRadius: '50%', 
              background: '#10b981', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: 'white',
              boxShadow: '0 4px 10px rgba(16, 185, 129, 0.2)'
            }}>
              <CheckCircle2 size={20} />
            </div>
            <div>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--bg-sidebar)', marginBottom: '0.2rem' }}>All Systems Nominal</h4>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No health anomalies or nutrient deficits detected.</p>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {cropAlerts.map(alert => (
              <div 
                key={alert.id} 
                style={{ 
                  padding: '1rem', 
                  background: '#f8fafc', 
                  borderRadius: '12px', 
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '1rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {getAlertIcon(alert.type)}
                  <div>
                    <span className={`alert-badge-tag ${getAlertBadgeClass(alert.type)}`} style={{ marginRight: '0.5rem', fontSize: '0.65rem' }}>
                      {alert.type?.toUpperCase()}
                    </span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-dark)' }}>{alert.message}</span>
                  </div>
                </div>
                {!alert.is_read && onMarkRead && (
                  <button 
                    onClick={() => onMarkRead(alert.id)}
                    className="planto-btn-secondary"
                    style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem', height: 'auto', border: '1px solid rgba(0,0,0,0.1)' }}
                  >
                    Dismiss
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertsPanel;
