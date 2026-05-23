import React from 'react';
import { CheckCircle2 } from 'lucide-react';

const RecommendedActions = ({ latestPlan, latestSoil, alerts }) => {
  const actions = [];
  
  if (latestPlan && latestPlan.plan_data && latestPlan.plan_data.length > 0) {
    actions.push(`Apply ${latestPlan.plan_data[0].fertilizer} fertilizer`);
  } else {
    actions.push('No fertilizer needed right now');
  }

  if (latestSoil?.humidity < 40) {
    actions.push('Increase watering slightly');
  } else if (latestSoil?.humidity > 80) {
    actions.push('Reduce watering to let soil dry');
  } else {
    actions.push('Keep watering schedule normal');
  }

  actions.push('Retest soil in 7 days');

  return (
    <div style={{ background: '#fdfaf0', border: '1px solid #fde68a', borderRadius: '16px', padding: '1.25rem', marginBottom: '1.5rem', boxShadow: '0 2px 10px rgba(245, 158, 11, 0.05)' }}>
      <h3 style={{ fontFamily: 'var(--font-heading)', color: '#92400e', fontSize: '1.1rem', fontWeight: 800, margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        <span style={{ fontSize: '1.2rem' }}>🌿</span> Action Checklist Today
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {actions.map((action, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'white', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.03)', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
            <CheckCircle2 size={16} color="#10b981" />
            <span style={{ color: '#334155', fontSize: '0.9rem', fontWeight: 600 }}>{action}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecommendedActions;
