import { useState } from 'react';
import { FlaskConical, Sprout, Leaf, Sun, ChevronDown, ChevronUp } from 'lucide-react';

const PHASES = [
  { value: 'germination', label: 'Germination', desc: '0–14 days', icon: Sprout, color: '#10b981' },
  { value: 'vegetative', label: 'Vegetative', desc: '15–45 days', icon: Leaf, color: '#3b82f6' },
  { value: 'flowering', label: 'Flowering', desc: '46–90 days', icon: Sun, color: '#f59e0b' },
  { value: 'maturity', label: 'Maturity', desc: '90+ days', icon: FlaskConical, color: '#8b5cf6' },
];

const SoilRetestCTA = ({ onRetest, cropAge }) => {
  const defaultPhase = cropAge <= 14 ? 'germination'
    : cropAge <= 45 ? 'vegetative'
    : cropAge <= 90 ? 'flowering'
    : 'maturity';

  const [selected, setSelected] = useState(defaultPhase);
  const [showPhaseSelector, setShowPhaseSelector] = useState(false);

  const activePhase = PHASES.find(p => p.value === selected);
  const PhaseIcon = activePhase.icon;

  return (
    <div style={{
      background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
      borderRadius: '24px',
      padding: '1.75rem 2rem',
      border: '2px dashed #86efac',
      marginBottom: '2rem'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
        <div style={{ background: 'white', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 10px rgba(22, 163, 74, 0.1)' }}>
          <FlaskConical size={22} color="#16a34a" />
        </div>
        <div>
          <h3 style={{ fontFamily: 'var(--font-heading)', color: '#166534', fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>
            Ready to test your soil again?
          </h3>
          <p style={{ color: '#15803d', fontSize: '0.8rem', margin: '0.2rem 0 0' }}>
            Your crop has been growing for <strong>{cropAge} day{cropAge === 1 ? '' : 's'}</strong>. We've detected the right phase for you.
          </p>
        </div>
      </div>

      {/* Auto-detected phase pill */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', borderRadius: '12px', padding: '0.85rem 1rem', border: `2px solid ${activePhase.color}`, marginBottom: '1rem', boxShadow: `0 4px 12px ${activePhase.color}20` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <PhaseIcon size={18} color={activePhase.color} />
          <div>
            <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>{activePhase.label} phase</span>
            <span style={{ color: '#64748b', fontSize: '0.78rem', marginLeft: '0.5rem' }}>({activePhase.desc})</span>
          </div>
        </div>
        <button
          onClick={() => setShowPhaseSelector(s => !s)}
          style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.3rem 0.6rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#64748b', fontSize: '0.75rem', fontWeight: 600 }}
        >
          Change {showPhaseSelector ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>

      {/* Phase selector — hidden by default */}
      {showPhaseSelector && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
          {PHASES.map(({ value, label, desc, icon: Icon, color }) => {
            const active = selected === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => { setSelected(value); setShowPhaseSelector(false); }}
                style={{
                  background: active ? 'white' : 'rgba(255,255,255,0.5)',
                  border: active ? `2px solid ${color}` : '2px solid transparent',
                  borderRadius: '12px',
                  padding: '0.75rem 0.5rem',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.35rem',
                  transition: 'all 0.2s',
                  boxShadow: active ? `0 4px 12px ${color}30` : 'none',
                }}
              >
                <Icon size={18} color={active ? color : '#94a3b8'} />
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: active ? '#0f172a' : '#64748b', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{label}</span>
                <span style={{ fontSize: '0.65rem', color: active ? '#475569' : '#94a3b8', fontWeight: 600 }}>{desc}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* CTA button */}
      <button
        type="button"
        onClick={() => onRetest(selected)}
        style={{
          width: '100%',
          background: '#16a34a',
          color: 'white',
          border: 'none',
          padding: '0.85rem',
          borderRadius: '14px',
          fontSize: '0.95rem',
          fontWeight: 700,
          cursor: 'pointer',
          boxShadow: '0 4px 15px -3px rgba(22, 163, 74, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.6rem',
        }}
      >
        <FlaskConical size={18} /> Test Soil Now
      </button>
    </div>
  );
};

export default SoilRetestCTA;
