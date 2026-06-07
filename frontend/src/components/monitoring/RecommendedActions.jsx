import { CheckCircle2, Clock } from 'lucide-react';

const RecommendedActions = ({ latestPlan, latestSoil }) => {
  const actions = [];

  if (latestPlan && latestPlan.fertilizer_type && latestPlan.fertilizer_type !== 'None') {
    const nutrient = latestPlan.nutrient_target || 'nutrients';
    actions.push({
      text: `Apply ${latestPlan.fertilizer_type} (${latestPlan.quantity_kg ?? 0} kg)`,
      reason: `Your ${nutrient} is low. Apply this week, early morning before watering.`,
    });
  } else {
    actions.push({ text: 'No fertilizer needed right now', reason: 'Your soil nutrients are at good levels.' });
  }

  if (latestSoil?.moisture < 40) {
    actions.push({ text: 'Increase watering', reason: `Soil moisture is ${latestSoil.moisture}% — below the 40% minimum. Water more until it reaches 60%.` });
  } else if (latestSoil?.moisture > 80) {
    actions.push({ text: 'Reduce watering', reason: `Soil moisture is ${latestSoil.moisture}% — too wet. Skip the next watering and let soil dry out.` });
  } else {
    actions.push({ text: 'Keep watering schedule normal', reason: `Soil moisture is ${latestSoil?.moisture ?? '--'}% — within the healthy range.` });
  }

  const daysSinceTest = latestSoil?.recorded_at
    ? Math.floor((new Date() - new Date(latestSoil.recorded_at)) / (1000 * 60 * 60 * 24))
    : null;

  if (daysSinceTest === null) {
    actions.push({ text: 'Run a soil test', reason: 'No soil data recorded yet. Test your soil to get recommendations.' });
  } else if (daysSinceTest >= 14) {
    actions.push({ text: `Retest soil — ${daysSinceTest} days since last test`, reason: 'Soil conditions change over time. A fresh test will give you the latest recommendations.', overdue: true });
  } else {
    const daysLeft = 14 - daysSinceTest;
    actions.push({ text: `Retest soil in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`, reason: `Last tested ${daysSinceTest} day${daysSinceTest === 1 ? '' : 's'} ago. Regular testing keeps your recommendations accurate.` });
  }

  return (
    <div style={{ background: '#fdfaf0', border: '1px solid #fde68a', borderRadius: '16px', padding: '1.25rem', marginBottom: '1.5rem', boxShadow: '0 2px 10px rgba(245, 158, 11, 0.05)' }}>
      <h3 style={{ fontFamily: 'var(--font-heading)', color: '#92400e', fontSize: '1.1rem', fontWeight: 800, margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        <span style={{ fontSize: '1.2rem' }}>🌿</span> What To Do Today
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {actions.map((action, idx) => (
          <div key={idx} style={{ background: 'white', padding: '0.85rem 1rem', borderRadius: '10px', border: action.overdue ? '1px solid #fca5a5' : '1px solid rgba(0,0,0,0.04)', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
              {action.overdue
                ? <Clock size={15} color="#ef4444" />
                : <CheckCircle2 size={15} color="#10b981" />}
              <span style={{ color: action.overdue ? '#9f1239' : '#1e293b', fontSize: '0.9rem', fontWeight: 700 }}>{action.text}</span>
            </div>
            <p style={{ color: '#64748b', fontSize: '0.78rem', margin: '0 0 0 1.5rem', lineHeight: 1.4 }}>{action.reason}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecommendedActions;
