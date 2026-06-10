import { useState, useEffect } from 'react';
import { X, Smartphone } from 'lucide-react';

export default function InstallPrompt() {
  const [prompt, setPrompt] = useState(null);
  const [visible, setVisible] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    const handler = (e) => {
      e.preventDefault();
      setPrompt(e);
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => { setInstalled(true); setVisible(false); });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') setInstalled(true);
    setVisible(false);
    setPrompt(null);
  };

  if (installed || !visible) return null;

  return (
    <>
      <style>{`
        @keyframes slideBannerDown {
          from { transform: translateY(-100%); opacity: 0; }
          to   { transform: translateY(0);     opacity: 1; }
        }
        .install-banner { animation: slideBannerDown 0.35s cubic-bezier(0.4,0,0.2,1) forwards; }
        .install-btn:hover { background: #059669 !important; transform: scale(1.03); }
        .install-btn { transition: background 0.2s, transform 0.15s; }
      `}</style>

      <div className="install-banner" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10000,
        background: 'linear-gradient(90deg, #1e362a 0%, #2d5240 100%)',
        borderBottom: '1px solid rgba(16,185,129,0.3)',
        padding: '0.65rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
      }}>
        {/* Icon */}
        <div style={{
          width: '32px', height: '32px', borderRadius: '8px',
          overflow: 'hidden', flexShrink: 0,
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        }}>
          <img src="/pwa-64x64.png" alt="Planto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>

        {/* Text */}
        <div style={{ color: 'white', lineHeight: 1.3 }}>
          <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>Install Planto</span>
          <span style={{ opacity: 0.65, fontSize: '0.78rem', marginLeft: '0.5rem', display: 'inline' }}>
            — Add to home screen for quick access
          </span>
        </div>

        {/* Install button */}
        <button
          className="install-btn"
          onClick={handleInstall}
          style={{
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '0.45rem 1.1rem',
            fontWeight: 700,
            fontSize: '0.82rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            flexShrink: 0,
            boxShadow: '0 2px 8px rgba(16,185,129,0.4)',
          }}
        >
          <Smartphone size={14} />
          Install
        </button>

        {/* Dismiss */}
        <button
          onClick={() => setVisible(false)}
          style={{
            position: 'absolute',
            right: '1rem',
            background: 'transparent',
            border: 'none',
            color: 'rgba(255,255,255,0.45)',
            cursor: 'pointer',
            padding: '0.25rem',
            lineHeight: 1,
            display: 'flex',
          }}
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
      </div>

      {/* Spacer so page content isn't hidden behind the banner */}
      <div style={{ height: '52px' }} />
    </>
  );
}
