import React from 'react';
import { CheckCircle, ChevronRight, FlaskConical, Leaf, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const RETEST_THRESHOLD_DAYS = 14;

function daysSince(dateStr) {
  if (!dateStr) return Infinity;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

function buildActions(crops, alerts) {
  const actions = [];

  for (const crop of crops) {
    const lastEntry = crop.monitoring_data?.[0];
    const days = daysSince(lastEntry?.recorded_at);
    if (days > RETEST_THRESHOLD_DAYS) {
      const name = crop.crop_name
        ? crop.crop_name.charAt(0).toUpperCase() + crop.crop_name.slice(1).toLowerCase()
        : 'crop';
      actions.push({
        id: `retest-${crop.id}`,
        icon: <FlaskConical size={15} color="#3b82f6" />,
        iconBg: 'rgba(59,130,246,0.1)',
        text: `Retest soil for ${name}`,
        href: '/soil-test',
      });
    }
  }

  for (const crop of crops) {
    const plan = crop.fertilizer_plans?.[crop.fertilizer_plans.length - 1];
    if (plan && plan.fertilizer_type && plan.fertilizer_type !== 'None' && (plan.quantity_kg ?? 0) > 0) {
      const name = crop.crop_name
        ? crop.crop_name.charAt(0).toUpperCase() + crop.crop_name.slice(1).toLowerCase()
        : 'crop';
      actions.push({
        id: `fert-${crop.id}`,
        icon: <Leaf size={15} color="#10b981" />,
        iconBg: 'rgba(16,185,129,0.1)',
        text: `Apply ${plan.fertilizer_type} to ${name}`,
        href: '/monitoring',
      });
    }
  }

  if (alerts.length > 0) {
    actions.push({
      id: 'alerts',
      icon: <Bell size={15} color="#f59e0b" />,
      iconBg: 'rgba(245,158,11,0.1)',
      text: `Review ${alerts.length} active farm alert${alerts.length === 1 ? '' : 's'}`,
      href: null,
      scrollToAlerts: true,
    });
  }

  return actions;
}

export default function TodayActions({ crops, alerts }) {
  const navigate = useNavigate();
  const actions = buildActions(crops, alerts);

  const handleAction = (action) => {
    if (action.scrollToAlerts) {
      document.querySelector('.alerts-table-simple, .all-operational-state')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else if (action.href) {
      navigate(action.href);
    }
  };

  return (
    <div className="dashboard-card matching-card" style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
      <div className="card-header-simple" style={{ marginBottom: '0.85rem' }}>
        <h3>
          <CheckCircle size={20} color="var(--accent-emerald)" /> Today on Your Farm
        </h3>
      </div>

      {actions.length === 0 ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.75rem 1rem',
          background: 'var(--green-soft)',
          borderRadius: 'var(--radius-lg)',
          border: '1px dashed rgba(16,185,129,0.25)',
          textAlign: 'center',
          gap: '0.6rem',
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: '#10b981',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white',
            boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
          }}>
            <CheckCircle size={20} />
          </div>
          <div>
            <p style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--bg-sidebar)', marginBottom: '0.15rem' }}>All farm tasks are up to date ✓</p>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Nothing needs attention right now.</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {actions.map((action) => (
            <button
              key={action.id}
              onClick={() => handleAction(action)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                background: 'rgba(0,0,0,0.02)',
                border: '1px solid rgba(0,0,0,0.05)',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem 0.85rem',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                transition: 'var(--transition-fast)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(16,185,129,0.05)'; e.currentTarget.style.borderColor = 'rgba(16,185,129,0.15)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.02)'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.05)'; }}
            >
              <div style={{
                width: 30, height: 30, borderRadius: '8px',
                background: action.iconBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                {action.icon}
              </div>
              <span style={{ flex: 1, fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-dark)' }}>
                {action.text}
              </span>
              <ChevronRight size={15} color="var(--text-muted)" style={{ flexShrink: 0 }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
