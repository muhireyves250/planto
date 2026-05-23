import React from 'react';
import { FlaskConical } from 'lucide-react';

const SoilRetestCTA = ({ onRetest }) => {
  return (
    <div style={{ 
      background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', 
      borderRadius: '24px', 
      padding: '2.5rem 2rem', 
      textAlign: 'center',
      border: '2px dashed #86efac',
      marginBottom: '2rem'
    }}>
      <div style={{ background: 'white', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', boxShadow: '0 4px 10px rgba(22, 163, 74, 0.1)' }}>
        <FlaskConical size={32} color="#16a34a" />
      </div>
      <h3 style={{ fontFamily: 'var(--font-heading)', color: '#166534', fontSize: '1.5rem', fontWeight: 800, margin: '0 0 0.75rem' }}>
        Time for another soil check?
      </h3>
      <p style={{ color: '#15803d', fontSize: '1rem', lineHeight: 1.6, maxWidth: '400px', margin: '0 auto 2rem' }}>
        Regular soil testing helps Planto give you better fertilizer and watering advice for your crops.
      </p>
      <button 
        onClick={onRetest}
        style={{ 
          background: '#16a34a', 
          color: 'white', 
          border: 'none', 
          padding: '1rem 2rem', 
          borderRadius: '16px', 
          fontSize: '1.1rem', 
          fontWeight: 700, 
          cursor: 'pointer', 
          boxShadow: '0 4px 15px -3px rgba(22, 163, 74, 0.3)',
          transition: 'transform 0.2s',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}
      >
        <FlaskConical size={20} /> Test Soil Again
      </button>
    </div>
  );
};

export default SoilRetestCTA;
