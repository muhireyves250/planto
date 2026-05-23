import React from 'react';
import { Heart, Activity, Droplets, AlertTriangle } from 'lucide-react';

const HealthCards = ({ latestHealth, latestSoil, cropAge }) => {
  const healthScore = latestHealth?.health_score !== undefined ? latestHealth.health_score : 100;
  const riskLevel = latestHealth?.risk_level || 'Healthy';
  const moisture = latestSoil?.moisture !== undefined ? latestSoil.moisture : 75;

  const getStageDisplay = (days) => {
    if (days <= 14) return 'Germination';
    if (days <= 45) return 'Vegetative';
    return 'Flowering';
  };

  const getHealthColorClass = (score) => {
    if (score >= 80) return 'text-healthy';
    if (score >= 50) return 'text-warning';
    return 'text-critical';
  };

  const getRiskBadgeClass = (risk) => {
    switch (risk?.toLowerCase()) {
      case 'healthy':
        return 'risk-healthy';
      case 'moderate risk':
        return 'risk-warning';
      default:
        return 'risk-critical';
    }
  };

  return (
    <div className="health-cards-grid animate-2">
      {/* Health Score */}
      <div className="health-card glass-morph">
        <div className="card-top">
          <span className="card-label text-uppercase">Health Score</span>
          <Heart className="card-icon icon-healthy" size={20} />
        </div>
        <div className="card-value-container">
          <span className={`card-value ${getHealthColorClass(healthScore)}`}>{healthScore}</span>
          <span className="card-sub-value">/100</span>
        </div>
        <div className="card-footer-bar">
          <div className="footer-fill" style={{ width: `${healthScore}%`, background: healthScore >= 80 ? 'var(--accent-emerald)' : healthScore >= 50 ? '#f59e0b' : '#ef4444' }}></div>
        </div>
      </div>

      {/* Growth Stage */}
      <div className="health-card glass-morph">
        <div className="card-top">
          <span className="card-label text-uppercase">Growth Stage</span>
          <Activity className="card-icon text-muted" size={20} />
        </div>
        <div className="card-value-container">
          <span className="card-value text-medium text-capitalize">{getStageDisplay(cropAge)}</span>
        </div>
        <span className="card-subtext">Day {cropAge} since planting</span>
      </div>

      {/* Moisture Status */}
      <div className="health-card glass-morph">
        <div className="card-top">
          <span className="card-label text-uppercase">Moisture Status</span>
          <Droplets className="card-icon icon-moisture" size={20} />
        </div>
        <div className="card-value-container">
          <span className="card-value">{moisture}%</span>
        </div>
        <span className="card-subtext">{moisture < 50 ? 'Requires Irrigation' : 'Adequate Moisture'}</span>
      </div>

      {/* Risk Level */}
      <div className="health-card glass-morph">
        <div className="card-top">
          <span className="card-label text-uppercase">Risk Level</span>
          <AlertTriangle className="card-icon text-warning" size={20} />
        </div>
        <div className="card-value-container">
          <span className={`risk-badge ${getRiskBadgeClass(riskLevel)}`}>{riskLevel}</span>
        </div>
        <span className="card-subtext">Based on real-time soil data</span>
      </div>
    </div>
  );
};

export default HealthCards;
