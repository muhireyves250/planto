import React from 'react';
import { Beaker, ShieldCheck, HelpCircle } from 'lucide-react';

const FertilizerPanel = ({ latestPlan, fertilizerPlans = [], stage }) => {
  const recList = [];
  
  if (latestPlan) {
    if (latestPlan.urea_kg > 0) {
      recList.push({
        type: 'Urea',
        quantity_kg: latestPlan.urea_kg,
        nutrient_target: 'Nitrogen (N)',
        explanation: `Apply urea to boost Nitrogen levels during the active vegetative stage.`,
        urgency: latestPlan.urea_kg > 40 ? 'High' : 'Medium'
      });
    }
    if (latestPlan.dap_kg > 0) {
      recList.push({
        type: 'DAP (Diammonium Phosphate)',
        quantity_kg: latestPlan.dap_kg,
        nutrient_target: 'Phosphorus (P)',
        explanation: 'Apply DAP to provide Phosphorus to build root structure and energy stability.',
        urgency: latestPlan.dap_kg > 30 ? 'High' : 'Medium'
      });
    }
    if (latestPlan.npk_kg > 0) {
      recList.push({
        type: 'NPK Complex',
        quantity_kg: latestPlan.npk_kg,
        nutrient_target: 'Potassium (K)',
        explanation: 'Apply NPK complex to enhance Potassium levels for water regulation and disease resistance.',
        urgency: latestPlan.npk_kg > 50 ? 'High' : 'Medium'
      });
    }
  }

  if (fertilizerPlans && fertilizerPlans.length > 0) {
    const sortedPlans = [...fertilizerPlans].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const latestTimestamp = sortedPlans[0]?.created_at;
    
    if (latestTimestamp) {
      const latestTime = new Date(latestTimestamp).getTime();
      const latestItems = sortedPlans.filter(p => {
        const pTime = new Date(p.created_at).getTime();
        return Math.abs(latestTime - pTime) < 5000 && p.fertilizer_type && p.fertilizer_type !== 'None';
      });

      latestItems.forEach(item => {
        if (!recList.some(r => r.type.toLowerCase() === item.fertilizer_type.toLowerCase())) {
          recList.push({
            type: item.fertilizer_type,
            quantity_kg: item.quantity_kg,
            nutrient_target: item.nutrient_target || 'Target Nutrient',
            explanation: item.explanation || 'Nutrient replenishment plan.',
            urgency: item.urgency || (item.quantity_kg > 30 ? 'High' : 'Medium')
          });
        }
      });
    }
  }

  const hasPlan = recList.length > 0;

  return (
    <div className="dashboard-card matching-card glass-morph animate-3">
      <div className="card-header-simple">
        <div className="header-flex-compact">
          <h3>🌿 Recommended Fertilizer Plan</h3>
          <Beaker size={16} color="var(--accent-emerald)" />
        </div>
      </div>
      <div style={{ padding: '1.25rem' }}>
        {!hasPlan ? (
          <div style={{ padding: '2rem', background: 'rgba(16,185,129,0.04)', borderRadius: '16px', border: '1px dashed rgba(16,185,129,0.2)', textAlign: 'center' }}>
            <ShieldCheck color="var(--accent-emerald)" size={40} style={{ margin: '0 auto 0.75rem', filter: 'drop-shadow(0 2px 8px rgba(16,185,129,0.2))' }} />
            <h4 style={{ fontWeight: 800, color: 'var(--bg-sidebar)', marginBottom: '0.2rem' }}>Optimal Soil Balance</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No supplemental fertilization required. All nutrients are within safe limits.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {recList.map((rec, idx) => (
              <div key={idx} className="fertilizer-recommendation-item" style={{ padding: '1.25rem', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <h4 style={{ fontWeight: 800, color: 'var(--bg-sidebar)', fontSize: '0.95rem', textTransform: 'capitalize' }}>{rec.type}</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      color: rec.urgency?.toLowerCase() === 'high' ? '#dc2626' : '#d97706',
                      background: rec.urgency?.toLowerCase() === 'high' ? '#fee2e2' : '#fef3c7',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '9999px',
                      textTransform: 'uppercase'
                    }}>
                      {rec.urgency || 'Medium'} Urgency
                    </span>
                    <span style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--accent-emerald)' }}>{rec.quantity_kg.toFixed(1)} KG</span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <p><strong>Purpose:</strong> Improve {rec.nutrient_target} levels</p>
                  <p><strong>Directions:</strong> {rec.explanation}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FertilizerPanel;
