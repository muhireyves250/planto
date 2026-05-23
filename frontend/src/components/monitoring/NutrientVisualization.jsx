import React from 'react';

const CROP_TARGETS = {
  rice: { n: 120, p: 60, k: 40, ph: 6.5, moisture: 80 },
  maize: { n: 150, p: 60, k: 60, ph: 6.0, moisture: 70 },
  beans: { n: 30, p: 50, k: 30, ph: 6.8, moisture: 60 },
  coffee: { n: 150, p: 50, k: 150, ph: 5.5, moisture: 75 },
};

const getTargetRequirements = (cropName) => {
  return CROP_TARGETS[cropName.toLowerCase()] || { n: 100, p: 50, k: 50, ph: 6.5, moisture: 70 };
};

const NutrientVisualization = ({ latestSoil, cropName }) => {
  const targets = getTargetRequirements(cropName || '');
  
  const metrics = [
    { label: 'Nitrogen (N)', key: 'nitrogen', target: targets.n, current: latestSoil?.nitrogen || 0, unit: 'mg/kg', max: 200, color: '#be123c' },
    { label: 'Phosphorus (P)', key: 'phosphorus', target: targets.p, current: latestSoil?.phosphorus || 0, unit: 'mg/kg', max: 120, color: '#c2410c' },
    { label: 'Potassium (K)', key: 'potassium', target: targets.k, current: latestSoil?.potassium || 0, unit: 'mg/kg', max: 200, color: '#0369a1' },
    { label: 'Acid Level (pH)', key: 'ph', target: targets.ph, current: latestSoil?.ph || 7.0, unit: 'pH', max: 14, color: '#8b5cf6' },
    { label: 'Moisture', key: 'moisture', target: targets.moisture, current: latestSoil?.moisture || 0, unit: '%', max: 100, color: '#10b981' },
  ];

  return (
    <div className="dashboard-card matching-card glass-morph animate-3">
      <div className="card-header-simple">
        <div className="header-flex-compact">
          <h3>Soil Health Analyser</h3>
          <span className="badge-mini-text">Current vs. Target</span>
        </div>
      </div>
      <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {metrics.map((m, idx) => {
          const currentPct = Math.min(100, (m.current / m.max) * 100);
          const targetPct = Math.min(100, (m.target / m.max) * 100);

          return (
            <div key={idx} className="metric-row">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.8rem', fontWeight: 700 }}>
                <span style={{ color: 'var(--text-dark)' }}>{m.label}</span>
                <span style={{ color: 'var(--text-muted)' }}>
                  Current: <strong style={{ color: m.color }}>{m.current}{m.unit}</strong> (Target: {m.target}{m.unit})
                </span>
              </div>
              <div className="visualization-bar-container" style={{ position: 'relative', height: '10px', background: 'rgba(0,0,0,0.05)', borderRadius: '10px', overflow: 'visible' }}>
                {/* Target line */}
                <div 
                  className="target-marker" 
                  style={{ 
                    position: 'absolute', 
                    left: `${targetPct}%`, 
                    top: '-3px', 
                    width: '3px', 
                    height: '16px', 
                    background: '#1e293b', 
                    zIndex: 2,
                    borderRadius: '2px'
                  }}
                  title={`Target: ${m.target}`}
                ></div>
                {/* Current fill */}
                <div 
                  className="current-fill" 
                  style={{ 
                    width: `${currentPct}%`, 
                    height: '100%', 
                    background: m.color, 
                    borderRadius: '10px',
                    transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                ></div>
              </div>
            </div>
          );
        })}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <div style={{ width: '12px', height: '4px', background: 'var(--accent-emerald)', borderRadius: '2px' }}></div> Current Soil Level
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <div style={{ width: '3px', height: '12px', background: '#1e293b', borderRadius: '1px' }}></div> Optimal Growth Target
          </div>
        </div>
      </div>
    </div>
  );
};

export default NutrientVisualization;
