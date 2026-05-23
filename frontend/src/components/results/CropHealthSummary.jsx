import React from 'react';
import { Sprout, Activity, Heart } from 'lucide-react';

const CropHealthSummary = ({ stage, healthScore, status }) => {
  let healthColor = '#10b981';
  let healthText = 'Healthy';
  if (healthScore < 60) {
    healthColor = '#ef4444';
    healthText = 'Critical';
  } else if (healthScore < 80) {
    healthColor = '#f59e0b';
    healthText = 'Moderate';
  }

  let stageDesc = 'Early root and seed growth stage.';
  if (stage?.toLowerCase().includes('vegetative')) stageDesc = 'Active leaf and stem growth.';
  if (stage?.toLowerCase().includes('flowering')) stageDesc = 'Crop is producing flowers.';

  let statusDesc = 'Your crop is growing well but might need light nutrient support.';
  if (healthScore < 60) statusDesc = 'Your crop needs immediate attention to recover health.';
  else if (healthScore > 90) statusDesc = 'Your crop is in excellent condition. Keep it up!';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
      
      <div style={{ background: 'white', padding: '1.5rem', borderRadius: '20px', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{ background: '#ecfdf5', padding: '0.5rem', borderRadius: '12px' }}><Sprout size={20} color="#10b981" /></div>
          <h3 style={{ fontSize: '1.1rem', color: '#0f172a', margin: 0, fontWeight: 700 }}>{stage || 'Growth Stage'}</h3>
        </div>
        <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.5, margin: 0 }}>{stageDesc}</p>
      </div>

      <div style={{ background: 'white', padding: '1.5rem', borderRadius: '20px', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{ background: `${healthColor}15`, padding: '0.5rem', borderRadius: '12px' }}><Heart size={20} color={healthColor} /></div>
          <h3 style={{ fontSize: '1.5rem', color: healthColor, margin: 0, fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
            {healthScore}/100
          </h3>
        </div>
        <p style={{ color: '#0f172a', fontSize: '1.05rem', fontWeight: 600, margin: '0 0 0.25rem' }}>{healthText}</p>
        <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>Overall plant vitality</p>
      </div>

      <div style={{ background: 'white', padding: '1.5rem', borderRadius: '20px', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{ background: '#eff6ff', padding: '0.5rem', borderRadius: '12px' }}><Activity size={20} color="#3b82f6" /></div>
          <h3 style={{ fontSize: '1.1rem', color: '#0f172a', margin: 0, fontWeight: 700 }}>Crop Status</h3>
        </div>
        <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.5, margin: 0 }}>{statusDesc}</p>
      </div>

    </div>
  );
};

export default CropHealthSummary;
