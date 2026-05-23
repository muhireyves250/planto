import React from 'react';
import { ArrowLeft, Activity } from 'lucide-react';

import SoilResultHero from '../components/results/SoilResultHero';
import CropHealthSummary from '../components/results/CropHealthSummary';
import FertilizerRecommendationCards from '../components/results/FertilizerRecommendationCards';
import NutrientStatusBars from '../components/results/NutrientStatusBars';
import NextActionPanel from '../components/results/NextActionPanel';

const SoilTestResult = ({ result, cropName, onBack }) => {
  
  if (!result) return null;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '3rem' }}>
      <button 
        onClick={onBack}
        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', background: 'transparent', border: 'none', cursor: 'pointer', marginBottom: '1.5rem', fontWeight: 700, fontSize: '0.9rem', padding: '0.5rem 1rem', borderRadius: '99px', transition: 'background 0.2s' }}
        onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'}
        onMouseOut={e => e.currentTarget.style.background = 'transparent'}
      >
        <ArrowLeft size={16} /> Return to Dashboard
      </button>

      <SoilResultHero cropName={cropName} />
      
      <CropHealthSummary 
        stage={result.stage} 
        healthScore={result.health_score} 
        status={result.status} 
      />

      <FertilizerRecommendationCards fertilizers={result.fertilizer_recommendations || result.fertilizer} />
      
      <NutrientStatusBars deficits={result.nutrient_deficits || result.deficit} />
      
      <NextActionPanel />

      <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
        <button 
          onClick={onBack}
          style={{ flex: 1, background: '#16a34a', color: 'white', padding: '1.25rem', borderRadius: '16px', fontWeight: 700, fontSize: '1.1rem', border: 'none', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(22, 163, 74, 0.2)' }}
        >
          <Activity size={20} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />
          Open Monitoring
        </button>
        <button 
          onClick={onBack}
          style={{ flex: 1, background: 'white', border: '2px solid #e2e8f0', color: '#475569', padding: '1.25rem', borderRadius: '16px', fontWeight: 700, fontSize: '1.1rem', cursor: 'pointer' }}
        >
          Test Again Later
        </button>
      </div>

    </div>
  );
};

export default SoilTestResult;
