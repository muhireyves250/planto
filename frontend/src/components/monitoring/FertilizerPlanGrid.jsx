import React from 'react';
import { Leaf } from 'lucide-react';

const FertilizerPlanGrid = ({ latestPlan }) => {
  if (!latestPlan || !latestPlan.fertilizer_type || latestPlan.fertilizer_type === 'None') return null;

  return (
    <div style={{ marginBottom: '2.5rem' }}>
      <h3 style={{ fontFamily: 'var(--font-heading)', color: '#0f172a', fontSize: '1.2rem', fontWeight: 800, margin: '0 0 1rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        What Your Soil Needs Now
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div style={{ background: 'white', borderRadius: '16px', padding: '1.25rem', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '32px', height: '32px', background: '#f1f5f9', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Leaf size={16} color="#64748b" />
              </div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>{latestPlan.fertilizer_type}</h4>
            </div>
            {latestPlan.nutrient_target && (
              <span style={{ background: '#dcfce7', color: '#15803d', fontSize: '0.65rem', fontWeight: 800, padding: '0.2rem 0.5rem', borderRadius: '6px', textTransform: 'uppercase' }}>
                {latestPlan.nutrient_target}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', margin: '0.5rem 0 1rem' }}>
            <span style={{ fontSize: '2.2rem', fontFamily: 'var(--font-heading)', fontWeight: 800, color: '#16a34a', lineHeight: 1 }}>{latestPlan.quantity_kg ?? 0}</span>
            <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 700 }}>KG</span>
          </div>

          <p style={{ color: '#475569', fontSize: '0.85rem', lineHeight: 1.4, margin: '0 0 1rem', flex: 1 }}>
            {latestPlan.explanation || 'Apply evenly to improve soil health and boost crop growth.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default FertilizerPlanGrid;
