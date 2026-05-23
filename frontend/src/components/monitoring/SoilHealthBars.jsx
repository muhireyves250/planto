import React from 'react';
import { Beaker, Droplets, FlaskConical } from 'lucide-react';

const SoilHealthBars = ({ latestSoil }) => {
  if (!latestSoil) return null;

  // Real data parsing, preserving actual pH
  const metrics = [
    { label: 'Nitrogen (N)', value: latestSoil.n, unit: 'mg/kg', target: 80, color: '#3b82f6', icon: Beaker },
    { label: 'Phosphorus (P)', value: latestSoil.p, unit: 'mg/kg', target: 50, color: '#8b5cf6', icon: Beaker },
    { label: 'Potassium (K)', value: latestSoil.k, unit: 'mg/kg', target: 50, color: '#f59e0b', icon: Beaker },
    { label: 'Moisture', value: latestSoil.humidity, unit: '%', target: 60, color: '#0ea5e9', icon: Droplets },
    { label: 'pH Level', value: latestSoil.ph, unit: 'pH', target: 7, color: '#10b981', icon: FlaskConical, isPH: true }
  ];

  return (
    <div>
      <h4 style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 700, margin: '0 0 0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        Soil Health Metrics
      </h4>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
        {metrics.map((metric, idx) => {
          let percent = 0;
          let status = 'Good';
          let statusColor = '#10b981';
          let statusBg = '#dcfce7';
          
          if (metric.isPH) {
             percent = (metric.value / 14) * 100;
             if (metric.value < 5.5) { status = 'Acidic'; statusColor = '#ef4444'; statusBg = '#fee2e2'; }
             else if (metric.value > 7.5) { status = 'Alkaline'; statusColor = '#f59e0b'; statusBg = '#fef3c7'; }
             else { status = 'Optimal'; }
          } else {
             percent = Math.min(100, Math.max(0, (metric.value / metric.target) * 100));
             if (percent < 50) { status = 'Low'; statusColor = '#ef4444'; statusBg = '#fee2e2'; }
             else if (percent > 120) { status = 'High'; statusColor = '#f59e0b'; statusBg = '#fef3c7'; }
             else { status = 'Good'; }
          }

          const Icon = metric.icon;

          return (
            <div key={idx} style={{ background: 'white', borderRadius: '12px', padding: '0.75rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <div style={{ background: '#f1f5f9', padding: '0.25rem', borderRadius: '4px' }}>
                     <Icon size={12} color="#64748b" />
                  </div>
                  <span style={{ fontWeight: 800, color: '#475569', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{metric.label}</span>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.2rem', margin: '0 0 0.5rem' }}>
                <span style={{ fontSize: '1.4rem', fontFamily: 'var(--font-heading)', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
                  {metric.isPH ? metric.value.toFixed(1) : Math.round(metric.value)}
                </span>
                <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700 }}>{metric.unit}</span>
              </div>
              
              <div style={{ width: '100%', height: '4px', background: '#f1f5f9', borderRadius: '99px', overflow: 'hidden', position: 'relative', marginBottom: '0.5rem' }}>
                <div style={{
                  height: '100%',
                  width: `${percent}%`,
                  background: metric.color,
                  borderRadius: '99px',
                  transition: 'width 1s ease-out'
                }} />
              </div>
              
              <div style={{ display: 'flex' }}>
                <span style={{ 
                  background: statusBg, 
                  color: statusColor, 
                  fontSize: '0.6rem', 
                  fontWeight: 800, 
                  padding: '0.15rem 0.4rem', 
                  borderRadius: '4px', 
                  textTransform: 'uppercase' 
                }}>
                  {status}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SoilHealthBars;
