import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, Sprout, AlertTriangle, CloudSun,
  ChevronRight, FlaskConical, ArrowUpRight, Heart, Droplets, Wind,
} from 'lucide-react';

const FILTERS = ['All', 'Active', 'Pending', 'Harvested'];

const CARD_GRADIENTS = [
  'linear-gradient(160deg,#1a3a28 0%,#2d6645 100%)',
  'linear-gradient(160deg,#1c3d2c 0%,#3a7a55 100%)',
  'linear-gradient(160deg,#173322 0%,#2a5e3f 100%)',
  'linear-gradient(160deg,#0f2e1c 0%,#255438 100%)',
];

const s = {
  root: {
    height: '100dvh', background: '#f0f2ef',
    fontFamily: "'Outfit', sans-serif", overflow: 'hidden',
    position: 'relative',
  },
  hero: {
    position: 'fixed', top: 0, left: 0, right: 0,
    height: '46vh', zIndex: 10,
    overflow: 'hidden', borderRadius: '0 0 36px 36px',
  },
  heroBg: {
    position: 'absolute', inset: 0, width: '100%', height: '100%',
    objectFit: 'cover', transform: 'scale(1.04)',
  },
  heroScrim: {
    position: 'absolute', inset: 0,
    background: 'linear-gradient(180deg,rgba(4,16,9,0.8) 0%,rgba(4,16,9,0.06) 42%,rgba(4,16,9,0.52) 74%,rgba(4,16,9,0.92) 100%)',
  },
  topbar: {
    position: 'absolute', top: 'calc(env(safe-area-inset-top,44px) + 10px)',
    left: 0, right: 0, padding: '0 1.4rem',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 2,
  },
  avatarWrap: { display: 'flex', alignItems: 'center', gap: '0.7rem' },
  avatar: {
    width: 46, height: 46, borderRadius: '50%', objectFit: 'cover',
    border: '2.5px solid rgba(255,255,255,0.45)',
    boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
  },
  hiText: { fontSize: '0.76rem', color: 'rgba(255,255,255,0.75)', fontWeight: 600 },
  nameText: { fontSize: '1.05rem', color: '#fff', fontWeight: 800, lineHeight: 1.1 },
  bellBtn: {
    position: 'relative', width: 44, height: 44, borderRadius: '50%',
    background: 'rgba(255,255,255,0.14)', backdropFilter: 'blur(14px)',
    border: '1px solid rgba(255,255,255,0.22)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', cursor: 'pointer',
  },
  bellDot: {
    position: 'absolute', top: 10, right: 10,
    width: 8, height: 8, borderRadius: '50%',
    background: '#ef4444', border: '1.5px solid rgba(255,255,255,0.9)',
  },
  headline: { position: 'absolute', left: '1.4rem', top: '36%', zIndex: 2 },
  eyebrow: { margin: '0 0 0.25rem', fontSize: '0.84rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.04em' },
  h1: {
    margin: 0, fontSize: '2.75rem', fontWeight: 900, color: '#fff',
    lineHeight: 0.95, letterSpacing: '-1.5px',
    textShadow: '0 4px 24px rgba(0,0,0,0.4)',
  },
  statRow: {
    position: 'absolute', bottom: '1.6rem', left: '1rem', right: '1rem',
    display: 'flex', gap: '0.55rem', zIndex: 2,
  },
  statPill: {
    flex: 1,
    background: 'rgba(255,255,255,0.11)',
    backdropFilter: 'blur(22px) saturate(200%)',
    border: '1px solid rgba(255,255,255,0.18)',
    borderRadius: '18px', padding: '0.9rem 0.75rem',
    display: 'flex', flexDirection: 'column', gap: '0.12rem',
  },
  statVal: { fontSize: '1.25rem', fontWeight: 900, color: '#fff' },
  statLbl: { fontSize: '0.63rem', color: 'rgba(255,255,255,0.8)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' },
  sheet: {
    position: 'fixed',
    top: 'calc(46vh - 20px)',
    left: 0, right: 0, bottom: 0,
    background: '#f0f2ef',
    borderRadius: '28px 28px 0 0',
    overflow: 'hidden',
    display: 'flex', flexDirection: 'column',
    paddingBottom: 'calc(80px + env(safe-area-inset-bottom))',
    zIndex: 9,
  },
  alertRow: {
    margin: '0.85rem 1.2rem 0', padding: '0.65rem 1rem',
    background: '#fef3c7', borderRadius: '14px',
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    fontSize: '0.76rem', fontWeight: 700, color: '#92400e',
    flexShrink: 0,
  },
  alertBadge: {
    flexShrink: 0, background: '#f59e0b', color: '#fff',
    borderRadius: '99px', padding: '0.1rem 0.45rem',
    fontSize: '0.62rem', fontWeight: 800,
  },
  weatherChip: {
    margin: '0.65rem 1.2rem 0', padding: '0.65rem 1rem',
    background: '#fff', borderRadius: '14px',
    display: 'flex', alignItems: 'center', gap: '0.55rem',
    boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
    flexShrink: 0,
  },
  sectionHdr: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '1rem 1.2rem 0.5rem',
    flexShrink: 0,
  },
  sectionTitle: { fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' },
  seeAll: {
    display: 'flex', alignItems: 'center', gap: '0.15rem',
    fontSize: '0.82rem', fontWeight: 700, color: '#94a3b8',
    background: 'none', border: 'none', cursor: 'pointer',
  },
  filtersRow: {
    display: 'flex', gap: '0.5rem', padding: '0 1.2rem 0.75rem',
    overflowX: 'auto', scrollbarWidth: 'none', flexShrink: 0,
  },
  cardsScroll: {
    display: 'flex', gap: '1rem', padding: '0 1.2rem 0.5rem',
    overflowX: 'auto', overflowY: 'hidden',
    scrollbarWidth: 'none',
    scrollSnapType: 'x mandatory',
    flex: '0 0 auto',
    height: '26vh',
    alignItems: 'stretch',
  },
};

export default function MobileDashboard({
  user, crops, farmsCount, cropsCount,
  alerts, latestHealthScore, weatherData,
}) {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('All');
  const [liked, setLiked] = useState({});

  const firstName = user?.full_name?.split(' ')[0] || 'Farmer';
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.full_name || 'F')}&background=2d5240&color=fff&size=96&bold=true`;

  const filtered = filter === 'All'
    ? crops
    : crops.filter(c => c.status?.toLowerCase() === filter.toLowerCase());

  return (
    <div style={s.root}>

      {/* ── HERO ── */}
      <div style={s.hero}>
        <img src="/farm_bg.png" alt="" style={s.heroBg} />
        <div style={s.heroScrim} />
        <div style={{ height: 'env(safe-area-inset-top,44px)' }} />

        {/* topbar */}
        <div style={s.topbar}>
          <div style={s.avatarWrap}>
            <img src={avatarUrl} alt="avatar" style={s.avatar} />
            <div>
              <div style={s.hiText}>Hi 🌿</div>
              <div style={s.nameText}>{firstName}</div>
            </div>
          </div>
          <button style={s.bellBtn}>
            <Bell size={18} strokeWidth={2} />
            {alerts.length > 0 && <span style={s.bellDot} />}
          </button>
        </div>

        {/* headline */}
        <div style={s.headline}>
          <p style={s.eyebrow}>Welcome to</p>
          <h1 style={s.h1}>Planto AI<br />Farm</h1>
        </div>

        {/* stat pills */}
        <div style={s.statRow}>
          {[
            { label: 'Farms',  val: farmsCount },
            { label: 'Crops',  val: cropsCount },
            { label: 'Health', val: latestHealthScore !== null ? `${Math.round(latestHealthScore)}` : '--' },
          ].map(({ label, val }) => (
            <div key={label} style={s.statPill}>
              <span style={s.statVal}>{val}</span>
              <span style={s.statLbl}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── SHEET ── */}
      <div style={s.sheet}>

        {/* alert */}
        {alerts.length > 0 && (
          <div style={s.alertRow}>
            <AlertTriangle size={13} />
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{alerts[0].message}</span>
            {alerts.length > 1 && <span style={s.alertBadge}>+{alerts.length - 1}</span>}
          </div>
        )}

        {/* weather */}
        {weatherData && (
          <div style={s.weatherChip}>
            <CloudSun size={20} color="#3b82f6" />
            <span style={{ fontSize: '1rem', fontWeight: 800, color: '#1e293b' }}>{weatherData.temp}°C</span>
            <span style={{ background: '#e0f2fe', color: '#0369a1', borderRadius: '99px', padding: '0.15rem 0.55rem', fontSize: '0.62rem', fontWeight: 800 }}>
              {(weatherData.condition || '').toUpperCase()}
            </span>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#64748b', fontSize: '0.75rem', fontWeight: 600 }}>
              <Droplets size={12} color="#3b82f6" />{weatherData.humidity}%
              <Wind size={12} color="#94a3b8" />{weatherData.windSpeed ?? '--'} km/h
            </div>
          </div>
        )}

        {/* section header */}
        <div style={s.sectionHdr}>
          <span style={s.sectionTitle}>My Fields</span>
          <button style={s.seeAll} onClick={() => navigate('/crop-status')}>
            See All <ChevronRight size={14} />
          </button>
        </div>

        {/* filters */}
        <div style={s.filtersRow}>
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '0.55rem 1.2rem', borderRadius: '99px',
              fontSize: '0.85rem', fontWeight: 700, border: 'none', flexShrink: 0,
              background: filter === f ? '#0f172a' : '#fff',
              color: filter === f ? '#fff' : '#64748b',
              cursor: 'pointer', whiteSpace: 'nowrap',
              boxShadow: filter === f ? '0 4px 14px rgba(15,23,42,0.22)' : '0 1px 4px rgba(0,0,0,0.07)',
              transition: 'all 0.2s ease',
            }}>
              {f}
            </button>
          ))}
        </div>

        {/* cards */}
        {filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '3rem 2rem', textAlign: 'center' }}>
            <Sprout size={44} color="#10b981" />
            <p style={{ fontWeight: 600, color: '#94a3b8', margin: 0, fontSize: '0.88rem' }}>No crops yet. Run a soil test to get started.</p>
            <button onClick={() => navigate('/soil-test')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#1e362a', color: '#fff', border: 'none', borderRadius: '99px', padding: '0.75rem 1.5rem', fontWeight: 700, cursor: 'pointer', fontSize: '0.84rem' }}>
              <FlaskConical size={15} /> Test Soil
            </button>
          </div>
        ) : (
          <div style={s.cardsScroll}>
            {filtered.map((crop, i) => {
              const score = crop.health_history?.at(-1)?.health_score;
              const days = crop.planting_date
                ? Math.floor((Date.now() - new Date(crop.planting_date)) / 86400000)
                : null;
              const isLiked = liked[crop.id];

              return (
                <div key={crop.id} onClick={() => navigate('/monitoring')} style={{
                  flexShrink: 0, width: '68vw', maxWidth: 240,
                  height: '100%',
                  borderRadius: '28px', overflow: 'hidden', background: '#fff',
                  boxShadow: '0 6px 24px rgba(0,0,0,0.08)',
                  scrollSnapAlign: 'start', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column',
                }}>
                  {/* image — 60% of card height */}
                  <div style={{ position: 'relative', width: '100%', flex: '0 0 60%', background: CARD_GRADIENTS[i % CARD_GRADIENTS.length], overflow: 'hidden' }}>
                    <img src="/wheat-stalk.png" alt={crop.crop_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,transparent 52%,rgba(0,0,0,0.45) 100%)' }} />
                    <button onClick={e => { e.stopPropagation(); setLiked(p => ({ ...p, [crop.id]: !p[crop.id] })); }} style={{ position: 'absolute', top: 12, right: 12, width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.22)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <Heart size={14} fill={isLiked ? '#ef4444' : 'none'} color={isLiked ? '#ef4444' : '#fff'} />
                    </button>
                    {score !== undefined && score !== null && (
                      <div style={{ position: 'absolute', bottom: 10, left: 10, background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)', borderRadius: '99px', padding: '0.18rem 0.55rem', fontSize: '0.68rem', fontWeight: 800, color: '#fff' }}>
                        {Math.round(score)}/100
                      </div>
                    )}
                  </div>

                  {/* body — fills remaining 40% */}
                  <div style={{ flex: 1, padding: '0.75rem 0.9rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.15rem', textTransform: 'capitalize' }}>{crop.crop_name}</div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>
                        {days !== null ? `${days} days growing` : 'Recently planted'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{
                        padding: '0.28rem 0.7rem', borderRadius: '99px',
                        fontSize: '0.66rem', fontWeight: 800, textTransform: 'capitalize',
                        background: crop.status === 'active' ? '#dcfce7' : crop.status === 'pending' ? '#fef9c3' : '#e0f2fe',
                        color: crop.status === 'active' ? '#16a34a' : crop.status === 'pending' ? '#ca8a04' : '#0284c7',
                      }}>
                        {crop.status || 'active'}
                      </span>
                      <button style={{ width: 34, height: 34, borderRadius: '50%', background: '#0f172a', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(15,23,42,0.3)' }}>
                        <ArrowUpRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* add card */}
            <div onClick={() => navigate('/soil-test')} style={{ flexShrink: 0, width: '68vw', maxWidth: 240, height: '100%', borderRadius: '28px', background: '#f0fdf4', border: '2px dashed #86efac', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '2rem 1rem', cursor: 'pointer', scrollSnapAlign: 'start' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FlaskConical size={24} color="#10b981" />
              </div>
              <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '1rem' }}>Test New Soil</div>
              <div style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 600, textAlign: 'center' }}>Get AI crop recommendation</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
