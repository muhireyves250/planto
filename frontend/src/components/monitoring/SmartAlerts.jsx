import { AlertTriangle, CheckCircle2 } from 'lucide-react';

const SmartAlerts = ({ alerts }) => {
  if (!alerts || alerts.length === 0) {
    return (
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
          <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--bg-sidebar)', marginBottom: '0.2rem' }}>Status: Excellent</h4>
          <p style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>Your monitoring data looks perfect. No issues detected.</p>
        </div>
      </div>
    );
  }

  // Only take maximum 2 alerts to keep it clean
  const visibleAlerts = alerts.slice(0, 2);

  return (
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
  );
};

export default SmartAlerts;
