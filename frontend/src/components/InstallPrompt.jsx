import { useState, useEffect } from 'react';
import { X, Smartphone } from 'lucide-react';

export default function InstallPrompt() {
  const [prompt, setPrompt] = useState(null);
  const [visible, setVisible] = useState(() => {
    // Compute initial visibility synchronously — no flicker
    if (typeof window === 'undefined') return false;
    if (window.matchMedia('(display-mode: standalone)').matches) return false;
    if (sessionStorage.getItem('install_dismissed')) return false;
    return true;
  });

  useEffect(() => {
    if (!visible) return;

    const handler = (e) => {
      e.preventDefault();
      setPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => setVisible(false));

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') setVisible(false);
    setPrompt(null);
  };

  const handleDismiss = () => {
    sessionStorage.setItem('install_dismissed', '1');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <>
      <style>{`
        @keyframes slideUpCard {
          from { transform: translateY(20px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        .install-card { animation: slideUpCard 0.3s cubic-bezier(0.4,0,0.2,1) forwards; }
        .install-card-btn:hover { background: #059669 !important; }
        .install-card-btn { transition: background 0.18s; }
      `}</style>

      <div className="install-card" style={{
        position: 'fixed',
        bottom: '88px',
        right: '24px',
        zIndex: 10000,
        background: 'linear-gradient(135deg, #1e362a 0%, #2d5240 100%)',
        border: '1px solid rgba(16,185,129,0.28)',
        borderRadius: '18px',
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        boxShadow: '0 10px 32px rgba(0,0,0,0.35)',
        width: '280px',
      }}>
        {/* App icon */}
        <div style={{
          width: '44px', height: '44px', borderRadius: '11px',
          overflow: 'hidden', flexShrink: 0,
          boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
        }}>
          <img src="/pwa-64x64.png" alt="Planto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>

        {/* Text + button */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: 'white', fontWeight: 700, fontSize: '0.88rem', lineHeight: 1.2 }}>
            Install Planto
          </div>
          <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.75rem', lineHeight: 1.4, marginBottom: '9px' }}>
            Add to home screen for quick access
          </div>
          <button
            className="install-card-btn"
            onClick={handleInstall}
            disabled={!prompt}
            style={{
              background: prompt ? '#10b981' : 'rgba(16,185,129,0.45)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 14px',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: prompt ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <Smartphone size={13} />
            Install
          </button>
        </div>

        {/* Dismiss */}
        <button
          onClick={handleDismiss}
          style={{
            alignSelf: 'flex-start',
            background: 'transparent',
            border: 'none',
            color: 'rgba(255,255,255,0.4)',
            cursor: 'pointer',
            padding: '0',
            lineHeight: 1,
            display: 'flex',
            flexShrink: 0,
          }}
          aria-label="Dismiss"
        >
          <X size={15} />
        </button>
      </div>
    </>
  );
}
