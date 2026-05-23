import React from 'react';
import { Sprout, AlertTriangle, ShieldCheck } from 'lucide-react';

const FarmStatusCards = ({ latestHealth }) => {
  const stage = latestHealth?.stage || 'Germination';
  let stageText = 'Seed establishment stage';
  if (stage.toLowerCase().includes('vegetative')) stageText = 'Active leaf and stem growth';
  if (stage.toLowerCase().includes('flowering')) stageText = 'Crop is producing flowers';

  const hasRisk = latestHealth?.health_score < 75;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
      {/* Card 1: Growth Stage */}
      <div style={{ background: 'white', padding: '1.25rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'all 0.2s' }}>
        <div style={{ width: '40px', height: '40px', background: '#ecfdf5', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Sprout size={20} color="#10b981" />
        </div>
        <div>
          <p style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 800, margin: '0 0 0.15rem' }}>Current Phase</p>
          <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.15rem' }}>{stage}</h4>
          <p style={{ fontSize: '0.75rem', color: '#475569', margin: 0, lineHeight: 1.2 }}>{stageText}</p>
        </div>
      </div>

      {/* Card 3: Risk (Overall Health) */}
      <div style={{ background: 'white', padding: '1.25rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'all 0.2s' }}>
        <div style={{ width: '40px', height: '40px', background: hasRisk ? '#fef2f2' : '#f0fdf4', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {hasRisk ? <AlertTriangle size={20} color="#ef4444" /> : <ShieldCheck size={20} color="#10b981" />}
        </div>
        <div>
          <p style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 800, margin: '0 0 0.15rem' }}>Overall Health</p>
          <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.15rem' }}>{hasRisk ? 'Needs Attention' : 'Looking Good'}</h4>
          <p style={{ fontSize: '0.75rem', color: '#475569', margin: 0, lineHeight: 1.2 }}>{hasRisk ? 'Check soil nutrients' : 'Keep up the good work'}</p>
        </div>
      </div>
    </div>
  );
};

export default FarmStatusCards;
