import React from 'react';
import { Sprout } from 'lucide-react';

const CropHeroCard = ({ crop, cropAge, latestHealth }) => {
  // Determine health score based on latestHealth or defaults
  const healthScore = latestHealth ? latestHealth.health_score : 85;
  let healthColor = '#10b981'; // Green
  let healthStatus = 'Healthy';

  if (healthScore < 60) {
    healthColor = '#ef4444'; // Red
    healthStatus = 'Critical';
  } else if (healthScore < 80) {
    healthColor = '#f59e0b'; // Orange
    healthStatus = 'Moderate';
  }

  return (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      padding: '1.5rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)',
      border: '1px solid #e2e8f0',
      marginBottom: '1.5rem',
      flexWrap: 'wrap',
      gap: '1rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{
          width: '56px',
          height: '56px',
          background: '#f0fdf4',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <Sprout size={28} color="#16a34a" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.2rem' }}>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', textTransform: 'capitalize', margin: 0 }}>
              {crop.crop_name}
            </h1>
            <span style={{ background: '#dcfce7', color: '#166534', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase' }}>
              🟢 Active
            </span>
          </div>
          <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0, fontWeight: 500 }}>
            Planted {cropAge} {cropAge === 1 ? 'day' : 'days'} ago
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          border: `3px solid ${healthColor}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: healthColor,
          fontFamily: 'var(--font-heading)',
          fontSize: '1.1rem',
          fontWeight: 800
        }}>
          {healthScore}
        </div>
        <div>
          <p style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>Overall Rating</p>
          <p style={{ fontSize: '0.95rem', color: '#0f172a', fontWeight: 800, margin: 0 }}>{healthStatus}</p>
        </div>
      </div>
    </div>
  );
};

export default CropHeroCard;
