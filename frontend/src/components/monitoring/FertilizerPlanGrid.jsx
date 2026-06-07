import { Leaf, Calendar } from 'lucide-react';

const FertilizerPlanGrid = ({ latestPlan }) => {
  if (!latestPlan || !latestPlan.fertilizer_type || latestPlan.fertilizer_type === 'None') return null;

  const nutrient = latestPlan.nutrient_target || 'nutrients';

  return (
    <div style={{ marginBottom: '2.5rem' }}>
      <h3 style={{ fontFamily: 'var(--font-heading)', color: '#0f172a', fontSize: '1.2rem', fontWeight: 800, margin: '0 0 1rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        Fertilizer to Apply
      </h3>

      <div style={{ background: 'white', borderRadius: '16px', padding: '1.25rem', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '32px', height: '32px', background: '#f1f5f9', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Leaf size={16} color="#16a34a" />
            </div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>{latestPlan.fertilizer_type}</h4>
          </div>
          <span style={{ background: '#dcfce7', color: '#15803d', fontSize: '0.65rem', fontWeight: 800, padding: '0.2rem 0.5rem', borderRadius: '6px', textTransform: 'uppercase' }}>
            {nutrient}
          </span>
        </div>

        {/* Why */}
        <p style={{ color: '#475569', fontSize: '0.85rem', lineHeight: 1.5, margin: '0 0 0.75rem', background: '#f8fafc', borderRadius: '8px', padding: '0.6rem 0.75rem' }}>
          <strong style={{ color: '#1e293b' }}>Why:</strong> Your {nutrient} is low.{' '}
          {latestPlan.explanation || 'Applying this fertilizer will restore the nutrient balance your crop needs to grow well.'}
        </p>

        {/* Amount + When */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'stretch' }}>
          <div style={{ flex: 1, background: '#f0fdf4', borderRadius: '10px', padding: '0.75rem', textAlign: 'center', border: '1px solid #dcfce7' }}>
            <div style={{ fontSize: '2rem', fontFamily: 'var(--font-heading)', fontWeight: 800, color: '#16a34a', lineHeight: 1 }}>{latestPlan.quantity_kg ?? 0}</div>
            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, marginTop: '0.2rem' }}>KG to apply</div>
          </div>
          <div style={{ flex: 2, background: '#fffbeb', borderRadius: '10px', padding: '0.75rem', border: '1px solid #fde68a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={16} color="#d97706" style={{ flexShrink: 0 }} />
            <p style={{ color: '#92400e', fontSize: '0.82rem', fontWeight: 600, margin: 0, lineHeight: 1.4 }}>
              Apply <strong>this week</strong>, early morning before watering. Spread evenly across the soil.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FertilizerPlanGrid;
