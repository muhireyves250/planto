import { CheckCircle2 } from 'lucide-react';

const STEPS = [
  'Apply recommended fertilizers this week',
  'Water crops consistently',
  'Retest soil after 7–14 days to check progress',
];

const NextActionPanel = () => (
  <div className="dashboard-card matching-card" style={{ marginBottom: '1rem' }}>
    <div className="card-header-simple">
      <h3>🌱 Recommended Next Steps</h3>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
      {STEPS.map((step, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--bg-main)', padding: '0.75rem 1rem', borderRadius: '10px' }}>
          <CheckCircle2 size={16} color="var(--accent-emerald)" flexShrink={0} />
          <span style={{ color: 'var(--text-dark)', fontSize: '0.88rem', fontWeight: 600 }}>{step}</span>
        </div>
      ))}
    </div>
  </div>
);

export default NextActionPanel;
