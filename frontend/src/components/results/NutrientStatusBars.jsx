import React from 'react';

const NutrientStatusBars = ({ deficits }) => {
  if (!deficits) return null;

  // We map the deficit to a visual progress bar. 
  // If deficit is 0, bar is full (Good). 
  // The larger the deficit, the lower the bar.
  
  const metrics = [
    { label: 'Nitrogen (N)', deficit: deficits.N, color: '#3b82f6' },
    { label: 'Phosphorus (P)', deficit: deficits.P, color: '#8b5cf6' },
    { label: 'Potassium (K)', deficit: deficits.K, color: '#f59e0b' }
  ];

  return (
    <div style={{ background: 'white', borderRadius: '24px', padding: '2rem', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.03)', marginBottom: '2.5rem' }}>
      <h3 style={{ fontFamily: 'var(--font-heading)', color: '#0f172a', fontSize: '1.4rem', fontWeight: 800, margin: '0 0 1.5rem' }}>
        Soil Nutrient Status
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {metrics.map((metric, idx) => {
          // Simplistic logic: Max deficit assume ~100 for visual scaling
          const fillPercentage = Math.max(10, 100 - (metric.deficit > 100 ? 90 : metric.deficit));
          const isLow = metric.deficit > 0;

          return (
            <div key={idx}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 700, color: '#334155' }}>{metric.label}</span>
                <span style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: 600 }}>
                  Current Level: <span style={{ color: isLow ? '#ef4444' : '#10b981' }}>{isLow ? 'Low' : 'Good'}</span>
                </span>
              </div>
              
              <div style={{ width: '100%', height: '14px', background: '#f1f5f9', borderRadius: '99px', overflow: 'hidden', marginBottom: '0.5rem' }}>
                <div style={{
                  height: '100%',
                  width: `${fillPercentage}%`,
                  background: isLow ? '#f87171' : '#10b981', // Red if low, Green if good
                  borderRadius: '99px',
                  transition: 'width 1s ease-out'
                }} />
              </div>
              
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>
                {isLow ? 'Needs Improvement' : 'Optimal range achieved'}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default NutrientStatusBars;
