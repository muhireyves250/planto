import { Sprout, Heart } from 'lucide-react';

const CropHeroCard = ({ crop, cropAge, latestHealth }) => {
  const healthScore = latestHealth ? latestHealth.health_score : 85;
  let healthColor = '#10b981';
  let healthBg = '#dcfce7';
  let healthStatus = 'Healthy';
  let healthSentence = 'Your crop is growing well. Keep up the good work.';

  if (healthScore < 60) {
    healthColor = '#ef4444';
    healthBg = '#fee2e2';
    healthStatus = 'Needs Attention';
    healthSentence = 'Your crop has some problems that need fixing soon.';
  } else if (healthScore < 80) {
    healthColor = '#f59e0b';
    healthBg = '#fef3c7';
    healthStatus = 'Moderate';
    healthSentence = 'Your crop is doing okay, but a few things need attention.';
  }

  return (
    <div className="weather-summary" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem' }}>
      <div style={{ textAlign: 'left' }}>
        <div style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--bg-sidebar)', letterSpacing: '-1.5px', textTransform: 'capitalize' }}>
          {crop.crop_name}
        </div>
        <div className="badge-mini-text" style={{ background: healthBg, color: healthColor, padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800, marginBottom: '0.4rem' }}>
          {healthStatus.toUpperCase()}
        </div>
        <p style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 500, margin: 0, maxWidth: '200px', lineHeight: 1.4 }}>
          {healthSentence}
        </p>
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
          <Heart size={16} color={healthColor} fill={healthColor} />
          <div className="pill-text">
            <span className="pill-label">Health Score</span>
            <span className="pill-val" style={{ color: healthColor }}>{healthScore}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CropHeroCard;
