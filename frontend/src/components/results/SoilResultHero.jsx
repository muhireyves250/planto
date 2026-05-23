import React from 'react';
import { Sprout } from 'lucide-react';

const SoilResultHero = ({ cropName }) => {
  const dateStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div style={{
      background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
      borderRadius: '24px',
      padding: '2.5rem 2rem',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '1.5rem',
      boxShadow: '0 4px 20px -2px rgba(22, 163, 74, 0.1)',
      border: '1px solid #bbf7d0',
      marginBottom: '2rem'
    }}>
      <div style={{
        width: '64px',
        height: '64px',
        background: 'white',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        boxShadow: '0 4px 10px rgba(22, 163, 74, 0.1)'
      }}>
        <Sprout size={32} color="#16a34a" />
      </div>
      <div>
        <p style={{ color: '#15803d', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>
          {dateStr}
        </p>
        <h2 style={{ fontFamily: 'var(--font-heading)', color: '#14532d', fontSize: '2rem', fontWeight: 800, margin: '0 0 0.5rem', textTransform: 'capitalize' }}>
          {cropName} Soil Check Complete
        </h2>
        <p style={{ color: '#166534', fontSize: '1.05rem', lineHeight: 1.5, margin: 0, maxWidth: '600px' }}>
          Your soil test has been analyzed successfully. Planto has prepared recommendations to help your crop grow healthy and strong.
        </p>
      </div>
    </div>
  );
};

export default SoilResultHero;
