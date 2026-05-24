import React from 'react';
import { Sprout } from 'lucide-react';

const CropHeroCard = ({ crop, cropAge, latestHealth }) => {
  // Determine health score based on latestHealth or defaults
  const healthScore = latestHealth ? latestHealth.health_score : 85;
  let healthColor = '#10b981'; // Green
  let healthBg = '#dcfce7';
  let healthStatus = 'Healthy';

  if (healthScore < 60) {
    healthColor = '#ef4444'; // Red
    healthBg = '#fee2e2';
    healthStatus = 'Critical';
  } else if (healthScore < 80) {
    healthColor = '#f59e0b'; // Orange
    healthBg = '#fef3c7';
    healthStatus = 'Moderate';
  }

  return (
    <div className="weather-summary" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem' }}>
      <div style={{ textAlign: 'left' }}>
        <div style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--bg-sidebar)', letterSpacing: '-1.5px', textTransform: 'capitalize' }}>
          {crop.crop_name}
        </div>
        <div className="badge-mini-text" style={{ background: healthBg, color: healthColor, padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800 }}>
          {healthStatus.toUpperCase()}
        </div>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div className="weather-pill">
          <Sprout size={16} color="var(--accent-emerald)" />
          <div className="pill-text">
            <span className="pill-label">Growing for</span>
            <span className="pill-val">{cropAge} {cropAge === 1 ? 'Day' : 'Days'}</span>
          </div>
        </div>
        <div className="weather-pill">
          <div style={{ 
            width: '16px', 
            height: '16px', 
            borderRadius: '50%', 
            border: `2px solid ${healthColor}`, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontSize: '8px',
            fontWeight: 900
          }}>
            !
          </div>
          <div className="pill-text">
            <span className="pill-label">Health Score</span>
            <span className="pill-val">{healthScore}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CropHeroCard;
