import React from 'react';
import { Sprout, ChevronRight, FlaskConical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function getDaysGrowing(plantingDate) {
  if (!plantingDate) return null;
  const diff = Date.now() - new Date(plantingDate).getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

function getLastTestDate(crop) {
  const entry = crop.monitoring_data?.[0];
  if (!entry?.recorded_at) return 'Not tested yet';
  return new Date(entry.recorded_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

function getHealthScore(crop) {
  if (!crop.health_history?.length) return null;
  return crop.health_history[crop.health_history.length - 1]?.health_score ?? null;
}

function HealthDot({ score }) {
  let bg = '#cbd5e1';
  let title = 'No data';
  if (score !== null) {
    if (score >= 80) { bg = '#10b981'; title = `${score}/100`; }
    else if (score >= 60) { bg = '#f59e0b'; title = `${score}/100`; }
    else { bg = '#ef4444'; title = `${score}/100`; }
  }
  return (
    <div
      title={title}
      style={{
        width: 10,
        height: 10,
        borderRadius: '50%',
        background: bg,
        flexShrink: 0,
        boxShadow: score !== null ? `0 0 6px ${bg}88` : 'none',
      }}
    />
  );
}

export default function ActiveCropsSummary({ crops }) {
  const navigate = useNavigate();
  const visible = crops.slice(0, 4);
  const hasMore = crops.length > 4;

  if (crops.length === 0) {
    return (
      <div className="dashboard-card matching-card" style={{ background: 'var(--bg-sidebar)', color: 'white' }}>
        <div className="card-header-simple">
          <h3 style={{ color: 'white' }}>
            <Sprout size={20} color="var(--accent-emerald)" /> Active Crops
          </h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem', gap: '1rem', textAlign: 'center' }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sprout size={24} color="var(--accent-emerald)" />
          </div>
          <div>
            <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'white', marginBottom: '0.25rem' }}>No crops planted yet</p>
            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.55)' }}>Run a soil test to get started.</p>
          </div>
          <button
            onClick={() => navigate('/soil-test')}
            style={{
              background: 'var(--accent-emerald)',
              color: 'var(--bg-sidebar)',
              border: 'none',
              borderRadius: 'var(--radius-lg)',
              padding: '0.65rem 1.25rem',
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <FlaskConical size={15} /> Run Your First Soil Test
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-card matching-card" style={{ background: 'var(--bg-sidebar)', color: 'white' }}>
      <div className="card-header-simple" style={{ marginBottom: '0.75rem' }}>
        <h3 style={{ color: 'white' }}>
          <Sprout size={20} color="var(--accent-emerald)" /> Active Crops
        </h3>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {visible.map((crop) => {
          const days = getDaysGrowing(crop.planting_date);
          const lastTest = getLastTestDate(crop);
          const score = getHealthScore(crop);
          const name = crop.crop_name
            ? crop.crop_name.charAt(0).toUpperCase() + crop.crop_name.slice(1).toLowerCase()
            : '—';

          return (
            <div
              key={crop.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 'var(--radius-md)',
                padding: '0.65rem 0.85rem',
              }}
            >
              <HealthDot score={score} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.85rem', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {name}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.1rem' }}>
                  {days !== null ? `${days}d growing` : 'Unknown start'} · {lastTest}
                </div>
              </div>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: score !== null ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.3)', flexShrink: 0 }}>
                {score !== null ? `${Math.round(score)}/100` : 'No data'}
              </div>
            </div>
          );
        })}
      </div>

      {hasMore && (
        <button
          onClick={() => navigate('/monitoring')}
          style={{
            marginTop: '0.75rem',
            background: 'none',
            border: 'none',
            color: 'var(--accent-emerald)',
            fontSize: '0.78rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            padding: '0.25rem 0',
          }}
        >
          View all in Monitoring <ChevronRight size={14} />
        </button>
      )}
    </div>
  );
}
