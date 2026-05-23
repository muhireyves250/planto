import React, { useState } from 'react';
import { Leaf } from 'lucide-react';

const FertilizerRecommendationCards = ({ fertilizers }) => {
  const defaultSize = parseFloat(localStorage.getItem('planto_user_farm_size')) || 1;
  const [landSize, setLandSize] = useState(defaultSize);
  if (!fertilizers || fertilizers.length === 0) {
    return (
      <div style={{ background: '#f0fdf4', padding: '2rem', borderRadius: '24px', textAlign: 'center', border: '1px dashed #86efac', marginBottom: '2.5rem' }}>
        <Leaf size={40} color="#16a34a" style={{ margin: '0 auto 1rem' }} />
        <h3 style={{ color: '#166534', fontSize: '1.4rem', marginBottom: '0.5rem' }}>No Fertilizers Needed!</h3>
        <p style={{ color: '#15803d', fontSize: '1rem' }}>Your soil has the perfect balance of nutrients for this crop right now.</p>
      </div>
    );
  }

  const getFriendlyReason = (target) => {
    if (target.includes('Nitrogen')) return "Nitrogen levels are currently low for healthy growth.";
    if (target.includes('Phosphorus')) return "Phosphorus levels are below ideal range.";
    if (target.includes('Potassium')) return "Potassium is needed for disease resistance.";
    return "Your crop needs more nutrients to continue healthy growth.";
  };

  const getFriendlyPurpose = (target) => {
    if (target.includes('Nitrogen')) return "Helps your crop grow greener and stronger.";
    if (target.includes('Phosphorus')) return "Supports strong root development.";
    if (target.includes('Potassium')) return "Improves overall crop quality and yields.";
    return "Provides essential soil nutrients.";
  };

  return (
    <div style={{ marginBottom: '2.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <h3 style={{ fontFamily: 'var(--font-heading)', color: '#0f172a', fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>
          Fertilizer Recommendations
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#f8fafc', padding: '0.5rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <label style={{ fontSize: '0.9rem', fontWeight: 700, color: '#475569' }}>Farm Size (Hectares):</label>
          <input 
            type="number" 
            min="0.1" 
            step="0.1" 
            value={landSize} 
            onChange={(e) => setLandSize(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
            style={{ width: '70px', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.4rem 0.5rem', fontWeight: 700, color: '#0f172a', fontSize: '1rem', textAlign: 'center' }}
          />
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {fertilizers.map((rec, idx) => {
          const isHighPriority = idx === 0;
          return (
            <div key={idx} style={{ background: 'white', borderRadius: '24px', padding: '1.5rem', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ background: '#f1f5f9', padding: '0.5rem', borderRadius: '12px' }}>
                    <Leaf size={24} color="#64748b" />
                  </div>
                  <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>{rec.type}</h4>
                </div>
                {isHighPriority ? (
                  <span style={{ background: '#fee2e2', color: '#b91c1c', fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 0.75rem', borderRadius: '99px' }}>
                    🔴 Apply Soon
                  </span>
                ) : (
                  <span style={{ background: '#ffedd5', color: '#c2410c', fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 0.75rem', borderRadius: '99px' }}>
                    🟠 Recommended
                  </span>
                )}
              </div>
              
              <div style={{ fontSize: '3rem', fontFamily: 'var(--font-heading)', fontWeight: 800, color: '#16a34a', margin: '0 0 1.5rem', lineHeight: 1 }}>
                {((rec.kg !== undefined ? rec.kg : rec.quantity_kg || 0) * landSize).toFixed(0)}<span style={{ fontSize: '1.2rem', color: '#64748b', fontWeight: 600, marginLeft: '0.5rem' }}>KG</span>
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <span style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Purpose:</span>
                <p style={{ color: '#0f172a', fontSize: '0.95rem', margin: 0 }}>{getFriendlyPurpose(rec.nutrient_target || '')}</p>
              </div>

              <div>
                <span style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Why Needed:</span>
                <p style={{ color: '#475569', fontSize: '0.95rem', margin: 0 }}>{getFriendlyReason(rec.nutrient_target || '')}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FertilizerRecommendationCards;
