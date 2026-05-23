import React from 'react';

const QuantityDisplay = ({ amount, unit = 'kg' }) => {
  return (
    <div className="quantity-display" style={{
      textAlign: 'center',
      padding: '1.5rem',
      background: 'linear-gradient(135deg, var(--bg-sidebar) 0%, #2d4a3b 100%)',
      borderRadius: '16px',
      color: 'white',
      boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
    }}>
      <div style={{fontSize: '0.8rem', fontWeight: 700, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem'}}>
        Recommended Quantity
      </div>
      <div style={{display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '0.25rem'}}>
        <span style={{fontSize: '3rem', fontWeight: 800}}>{amount}</span>
        <span style={{fontSize: '1.2rem', fontWeight: 600}}>{unit}</span>
      </div>
    </div>
  );
};

export default QuantityDisplay;
