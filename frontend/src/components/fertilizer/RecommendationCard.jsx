import React from 'react';
import { Beaker, Info, CheckCircle2 } from 'lucide-react';

const RecommendationCard = ({ recommendation }) => {
  return (
    <div className="dashboard-card matching-card animate-fade-in" style={{marginBottom: '1rem', borderLeft: '4px solid var(--accent-emerald)'}}>
      <div className="card-header-simple" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <h3 style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
          <Beaker size={18} color="var(--accent-emerald)" />
          {recommendation.fertilizer_type} Recommendation
        </h3>
        <span className="pro-badge" style={{background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-emerald)', padding: '0.2rem 0.6rem'}}>
          {recommendation.amount_kg} kg
        </span>
      </div>
      
      <div style={{padding: '1rem'}}>
        <p style={{fontSize: '0.9rem', color: 'var(--text-dark)', marginBottom: '1rem', lineHeight: '1.5'}}>
          {recommendation.advice}
        </p>
        
        <div style={{background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem'}}>
            <Info size={14} /> DEFICIT ADDRESSED
          </div>
          <div style={{display: 'flex', gap: '1rem'}}>
            {Object.entries(recommendation.nutrient_deficit).map(([nutrient, val]) => (
              <div key={nutrient} style={{display: 'flex', alignItems: 'center', gap: '0.3rem'}}>
                <div style={{width: '6px', height: '6px', background: 'var(--accent-emerald)', borderRadius: '50%'}}></div>
                <span style={{fontSize: '0.8rem', fontWeight: 700}}>{nutrient.toUpperCase()}: {val} units</span>
              </div>
            ))}
          </div>
        </div>
        
        <div style={{marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-emerald)', fontSize: '0.8rem', fontWeight: 600}}>
          <CheckCircle2 size={16} /> Optimized for current growth stage
        </div>
      </div>
    </div>
  );
};

export default RecommendationCard;
