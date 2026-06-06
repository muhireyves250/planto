import { Activity, ArrowLeft, FlaskConical } from 'lucide-react';

import SoilResultHero from '../components/results/SoilResultHero';
import CropHealthSummary from '../components/results/CropHealthSummary';
import FertilizerRecommendationCards from '../components/results/FertilizerRecommendationCards';
import NutrientStatusBars from '../components/results/NutrientStatusBars';
import NextActionPanel from '../components/results/NextActionPanel';

const SoilTestResult = ({ result, cropName, onBack }) => {
  if (!result) return null;

  return (
    <div className="dashboard-view animate-2" style={{ paddingTop: 0 }}>

      {/* Banner */}
      <div className="pro-welcome-banner farmer-banner animate-1">
        <div className="banner-content">
          <button
            onClick={onBack}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'rgba(255,255,255,0.75)', background: 'transparent', border: 'none', cursor: 'pointer', marginBottom: '0.6rem', fontWeight: 700, fontSize: '0.78rem', padding: 0 }}
          >
            <ArrowLeft size={13} /> Return to Dashboard
          </button>
          <h2 style={{ textTransform: 'capitalize' }}>{cropName} Soil Check Complete</h2>
          <p>Your soil test has been analysed. Planto has prepared recommendations to help your crop grow healthy and strong.</p>
        </div>
        <div className="banner-icon">
          <FlaskConical size={120} color="rgba(255,255,255,0.1)" />
        </div>
      </div>

      {/* Stats strip */}
      <CropHealthSummary
        stage={result.stage}
        healthScore={result.health_score}
        status={result.status}
      />

      {/* Two-column grid */}
      <div className="dashboard-grid-matching animate-3">
        <div className="dashboard-col">
          <FertilizerRecommendationCards fertilizers={result.fertilizer_recommendations || result.fertilizer} />
          <NutrientStatusBars deficits={result.nutrient_deficits || result.deficit} />
        </div>
        <div className="dashboard-col">
          <NextActionPanel />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button onClick={onBack} className="action-btn-pro" style={{ width: '100%', justifyContent: 'center', background: 'var(--bg-sidebar)', color: 'white', border: 'none' }}>
              <Activity size={18} /> Open Monitoring
            </button>
            <button onClick={onBack} className="action-btn-pro" style={{ width: '100%', justifyContent: 'center', background: 'var(--bg-main)', color: 'var(--text-dark)', border: '2px solid var(--accent-emerald)' }}>
              Test Again Later
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};

export default SoilTestResult;
