import React from 'react';
import { CheckCircle2 } from 'lucide-react';

const NextActionPanel = () => {
  const steps = [
    "Apply recommended fertilizers this week",
    "Water crops consistently",
    "Retest soil after 7–14 days to check progress"
  ];

  return (
    <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '24px', padding: '2rem', marginBottom: '2rem', boxShadow: '0 4px 20px -2px rgba(245, 158, 11, 0.05)' }}>
      <h3 style={{ fontFamily: 'var(--font-heading)', color: '#92400e', fontSize: '1.4rem', fontWeight: 800, margin: '0 0 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ fontSize: '1.5rem' }}>🌱</span> Recommended Next Steps
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {steps.map((step, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', background: 'white', padding: '1.25rem 1.5rem', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.03)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <div style={{ flexShrink: 0, marginTop: '0.1rem' }}>
              <CheckCircle2 size={24} color="#f59e0b" />
            </div>
            <span style={{ color: '#0f172a', fontSize: '1.1rem', fontWeight: 600 }}>{step}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NextActionPanel;
