import React from 'react';
import { AlertTriangle } from 'lucide-react';

const SmartAlerts = ({ alerts }) => {
  if (!alerts || alerts.length === 0) return null;

  // Only take maximum 2 alerts to keep it clean
  const visibleAlerts = alerts.slice(0, 2);

  return (
    <div style={{ marginBottom: '2rem' }}>
      <h3 style={{ fontFamily: 'var(--font-heading)', color: '#0f172a', fontSize: '1.2rem', fontWeight: 800, margin: '0 0 1rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        Farm Alerts
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {visibleAlerts.map((alert, idx) => (
          <div key={idx} style={{ background: '#fffbeb', borderLeft: '3px solid #f59e0b', borderRadius: '8px', padding: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div style={{ background: '#fef3c7', padding: '0.4rem', borderRadius: '6px' }}>
              <AlertTriangle size={16} color="#d97706" />
            </div>
            <div>
              <p style={{ color: '#92400e', fontWeight: 800, fontSize: '0.9rem', margin: '0 0 0.15rem' }}>
                {alert.title || "Attention Needed"}
              </p>
              <p style={{ color: '#b45309', fontSize: '0.8rem', margin: 0, lineHeight: 1.4 }}>
                {alert.message || "Please check your crop status."}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SmartAlerts;
