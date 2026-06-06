const NutrientStatusBars = ({ deficits }) => {
  if (!deficits) return null;

  const metrics = [
    { label: 'Nitrogen (N)', deficit: deficits.N, color: '#3b82f6' },
    { label: 'Phosphorus (P)', deficit: deficits.P, color: '#8b5cf6' },
    { label: 'Potassium (K)', deficit: deficits.K, color: '#f59e0b' },
  ];

  return (
    <div className="dashboard-card matching-card">
      <div className="card-header-simple">
        <h3>Soil Nutrient Status</h3>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {metrics.map((m, i) => {
          const isLow = m.deficit > 0;
          const fill = Math.max(10, 100 - (m.deficit > 100 ? 90 : m.deficit));
          return (
            <div key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-dark)' }}>{m.label}</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: isLow ? '#ef4444' : '#10b981', background: isLow ? '#fee2e2' : '#dcfce7', padding: '0.15rem 0.5rem', borderRadius: '6px' }}>
                  {isLow ? 'Low' : 'Good'}
                </span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'var(--bg-main)', borderRadius: '99px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${fill}%`, background: isLow ? '#f87171' : m.color, borderRadius: '99px', transition: 'width 1s ease-out' }} />
              </div>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                {isLow ? 'Needs improvement' : 'Optimal range achieved'}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default NutrientStatusBars;
