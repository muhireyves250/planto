import { useState } from 'react';
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, XCircle } from 'lucide-react';

const severityRank = (alert) => {
  const s = (alert.severity || '').toLowerCase();
  if (s === 'critical' || s === 'high') return 0;
  if (s === 'warning' || s === 'medium') return 1;
  return 2;
};

const AlertRow = ({ alert }) => {
  const isCritical = severityRank(alert) === 0;
  return (
    <div style={{
      background: isCritical ? '#fff1f2' : '#fffbeb',
      borderLeft: `3px solid ${isCritical ? '#ef4444' : '#f59e0b'}`,
      borderRadius: '8px',
      padding: '1rem',
      display: 'flex',
      gap: '0.75rem',
      alignItems: 'flex-start'
    }}>
      <div style={{ background: isCritical ? '#fee2e2' : '#fef3c7', padding: '0.4rem', borderRadius: '6px', flexShrink: 0 }}>
        {isCritical
          ? <XCircle size={16} color="#ef4444" />
          : <AlertTriangle size={16} color="#d97706" />}
      </div>
      <div>
        <p style={{ color: isCritical ? '#9f1239' : '#92400e', fontWeight: 800, fontSize: '0.9rem', margin: '0 0 0.15rem' }}>
          {alert.title || 'Attention Needed'}
        </p>
        <p style={{ color: isCritical ? '#be123c' : '#b45309', fontSize: '0.8rem', margin: 0, lineHeight: 1.4 }}>
          {alert.message || 'Please check your crop status.'}
        </p>
      </div>
    </div>
  );
};

const SmartAlerts = ({ alerts }) => {
  const [expanded, setExpanded] = useState(false);

  if (!alerts || alerts.length === 0) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '2.25rem 1.5rem', background: 'var(--green-soft)', borderRadius: '16px',
        border: '1px dashed rgba(16, 185, 129, 0.25)', textAlign: 'center', gap: '0.75rem'
      }}>
        <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' }}>
          <CheckCircle2 size={22} />
        </div>
        <div>
          <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--bg-sidebar)', marginBottom: '0.2rem' }}>All Clear</h4>
          <p style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>No problems detected. Your crop looks healthy.</p>
        </div>
      </div>
    );
  }

  const sorted = [...alerts].sort((a, b) => severityRank(a) - severityRank(b));
  const visible = sorted.slice(0, 3);
  const hidden = sorted.slice(3);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {visible.map((alert, idx) => <AlertRow key={idx} alert={alert} />)}

      {expanded && hidden.map((alert, idx) => <AlertRow key={`h${idx}`} alert={alert} />)}

      {hidden.length > 0 && (
        <button
          onClick={() => setExpanded(e => !e)}
          style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.6rem 1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', color: '#64748b', fontSize: '0.82rem', fontWeight: 700 }}
        >
          {expanded
            ? <><ChevronUp size={14} /> Show less</>
            : <><ChevronDown size={14} /> {hidden.length} more alert{hidden.length > 1 ? 's' : ''}</>}
        </button>
      )}
    </div>
  );
};

export default SmartAlerts;
