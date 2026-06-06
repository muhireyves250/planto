import { Sprout, Activity, Heart, Zap } from 'lucide-react';

const CropHealthSummary = ({ stage, healthScore, status }) => {
  let healthColor = '#10b981';
  let healthBg = 'green-soft';
  if (healthScore < 60) { healthColor = '#ef4444'; healthBg = 'orange-soft'; }
  else if (healthScore < 80) { healthColor = '#f59e0b'; healthBg = 'yellow-soft'; }

  let stageDesc = 'Seed establishment';
  if (stage?.toLowerCase().includes('vegetative')) stageDesc = 'Leaf & stem growth';
  if (stage?.toLowerCase().includes('flowering')) stageDesc = 'Flowering stage';
  if (stage?.toLowerCase().includes('maturity')) stageDesc = 'Near harvest';

  let statusLabel = 'Healthy';
  if (healthScore < 60) statusLabel = 'Critical';
  else if (healthScore < 80) statusLabel = 'Moderate';

  return (
    <div className="stats-strip animate-1" style={{ marginBottom: '1rem' }}>
      <div className="stat-pill-card">
        <div className={`stat-icon-circle ${healthBg}`}>
          <Heart size={20} color={healthColor} />
        </div>
        <div className="stat-data">
          <span className="stat-label">Health Score</span>
          <span className="stat-main" style={{ color: healthColor }}>{healthScore}/100</span>
        </div>
      </div>
      <div className="stat-pill-card">
        <div className="stat-icon-circle green-soft">
          <Sprout size={20} color="#10b981" />
        </div>
        <div className="stat-data">
          <span className="stat-label">Growth Stage</span>
          <span className="stat-main" style={{ textTransform: 'capitalize' }}>{stage || 'Germination'}</span>
        </div>
      </div>
      <div className="stat-pill-card">
        <div className="stat-icon-circle blue-soft">
          <Activity size={20} color="#3b82f6" />
        </div>
        <div className="stat-data">
          <span className="stat-label">Vitality</span>
          <span className="stat-main">{statusLabel}</span>
        </div>
      </div>
      <div className="stat-pill-card">
        <div className="stat-icon-circle yellow-soft">
          <Zap size={20} color="#eab308" />
        </div>
        <div className="stat-data">
          <span className="stat-label">Phase</span>
          <span className="stat-main" style={{ fontSize: '0.85rem' }}>{stageDesc}</span>
        </div>
      </div>
    </div>
  );
};

export default CropHealthSummary;
