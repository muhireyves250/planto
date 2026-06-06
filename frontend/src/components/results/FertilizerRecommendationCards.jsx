import { useState } from 'react';
import { Leaf, AlertTriangle, CheckCircle2 } from 'lucide-react';

const FertilizerRecommendationCards = ({ fertilizers }) => {
  const defaultSize = parseFloat(localStorage.getItem('planto_user_farm_size')) || 1;
  const [landSize, setLandSize] = useState(defaultSize);

  if (!fertilizers || fertilizers.length === 0) {
    return (
      <div className="dashboard-card matching-card" style={{ textAlign: 'center', padding: '2rem' }}>
        <Leaf size={36} color="var(--accent-emerald)" style={{ margin: '0 auto 0.75rem' }} />
        <h3 style={{ color: 'var(--text-dark)', fontFamily: 'var(--font-heading)', fontWeight: 800, marginBottom: '0.4rem' }}>No Fertilizers Needed</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Your soil has a perfect nutrient balance for this crop.</p>
      </div>
    );
  }

  const getFriendlyReason = (target = '') => {
    if (target.includes('Nitrogen')) return 'Nitrogen levels are below the healthy range.';
    if (target.includes('Phosphorus')) return 'Phosphorus is below the ideal level.';
    if (target.includes('Potassium')) return 'Potassium needed for disease resistance.';
    return 'Your crop needs nutrient support.';
  };

  const getFriendlyPurpose = (target = '') => {
    if (target.includes('Nitrogen')) return 'Greener, stronger growth.';
    if (target.includes('Phosphorus')) return 'Strong root development.';
    if (target.includes('Potassium')) return 'Better yield and quality.';
    return 'Essential soil nutrition.';
  };

  return (
    <div className="dashboard-card matching-card" style={{ marginBottom: '1rem' }}>
      <div className="card-header-simple" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h3><Leaf size={18} color="var(--accent-emerald)" style={{ verticalAlign: 'middle', marginRight: '0.4rem' }} />Fertilizer Recommendations</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-main)', padding: '0.35rem 0.75rem', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.06)' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Farm (ha):</span>
          <input
            type="number" min="0.1" step="0.1" value={landSize}
            onChange={e => setLandSize(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
            style={{ width: '54px', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0.3rem 0.4rem', fontWeight: 700, color: 'var(--text-dark)', fontSize: '0.9rem', textAlign: 'center', background: 'white' }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {fertilizers.map((rec, idx) => {
          const isHigh = idx === 0;
          const kg = ((rec.kg !== undefined ? rec.kg : rec.quantity_kg || 0) * landSize).toFixed(0);
          return (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--bg-main)', borderRadius: '12px', padding: '0.9rem 1rem', border: `1px solid ${isHigh ? 'rgba(239,68,68,0.15)' : 'rgba(0,0,0,0.05)'}` }}>
              <div style={{ width: '36px', height: '36px', background: isHigh ? '#fee2e2' : '#fff7ed', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {isHigh ? <AlertTriangle size={18} color="#ef4444" /> : <CheckCircle2 size={18} color="#f59e0b" />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-dark)' }}>{rec.type}</span>
                  <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.1rem', color: 'var(--accent-emerald)', flexShrink: 0 }}>{kg} kg</span>
                </div>
                <p style={{ margin: '0.1rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  {getFriendlyPurpose(rec.nutrient_target || '')} — {getFriendlyReason(rec.nutrient_target || '')}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FertilizerRecommendationCards;
