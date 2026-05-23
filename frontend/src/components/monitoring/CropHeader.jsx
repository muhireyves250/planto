import React from 'react';
import { Calendar, Sprout, Shield, Clock } from 'lucide-react';

const CropHeader = ({ crop }) => {
  if (!crop) return null;

  const plantingDate = new Date(crop.planting_date);
  const daysAfterPlanting = Math.max(0, Math.floor((new Date() - plantingDate) / (1000 * 60 * 60 * 24)));

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'badge-active';
      case 'harvested':
        return 'badge-harvested';
      default:
        return 'badge-failed';
    }
  };

  const getStageDisplay = (days) => {
    if (days <= 14) return 'Germination';
    if (days <= 45) return 'Vegetative';
    return 'Flowering / Fruiting';
  };

  return (
    <div className="crop-header-card glass-morph animate-1">
      <div className="crop-header-main">
        <div className="crop-header-title">
          <div className="crop-icon-circle green-soft">
            <Sprout size={24} color="var(--accent-emerald)" />
          </div>
          <div>
            <h2 className="crop-name-title">{crop.crop_name.toUpperCase()}</h2>
            <p className="farm-subtext">{crop.farm?.name || 'Main Farm Field'}</p>
          </div>
        </div>
        <div className="crop-badges-group">
          <span className={`crop-status-badge ${getStatusBadgeClass(crop.status)}`}>
            {crop.status?.toUpperCase() || 'ACTIVE'}
          </span>
        </div>
      </div>

      <div className="crop-meta-grid">
        <div className="meta-item">
          <Calendar size={16} />
          <div>
            <span className="meta-label">Planting Date</span>
            <span className="meta-value">{plantingDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>

        <div className="meta-item">
          <Clock size={16} />
          <div>
            <span className="meta-label">Age</span>
            <span className="meta-value">{daysAfterPlanting} Days DAP</span>
          </div>
        </div>

        <div className="meta-item">
          <Shield size={16} />
          <div>
            <span className="meta-label">Growth Stage</span>
            <span className="meta-value">{getStageDisplay(daysAfterPlanting)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CropHeader;
