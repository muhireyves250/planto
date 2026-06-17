import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { adminApi } from '../api/adminApi';
import {
  Users, Sprout, MapPin, Tractor, ShieldCheck,
  Building2, Search, Globe
} from 'lucide-react';

/* ─── custom map marker (green pin) ─────────────────────────── */
function makePinIcon() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="38" viewBox="0 0 28 38">
      <circle cx="14" cy="14" r="13" fill="#10b981" opacity="0.15"/>
      <circle cx="14" cy="14" r="8"  fill="#10b981"/>
      <circle cx="14" cy="14" r="3.5" fill="#fff"/>
      <line x1="14" y1="22" x2="14" y2="37" stroke="#10b981" stroke-width="2.5" stroke-linecap="round"/>
    </svg>`;
  return L.divIcon({
    html: svg, className: '',
    iconSize: [28, 38], iconAnchor: [14, 37], popupAnchor: [0, -38],
  });
}

/* ─── map ────────────────────────────────────────────────────── */
function FarmMap({ pins }) {
  const ref = useRef(null);
  const map = useRef(null);

  useEffect(() => {
    if (!ref.current || map.current) return;

    const center = pins.length ? [pins[0].lat, pins[0].lng] : [-1.9403, 29.8739];
    const m = L.map(ref.current, { scrollWheelZoom: false, zoomControl: false }).setView(center, 7);

    /* clean light tiles — matches the cream UI perfectly */
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; CARTO', subdomains: 'abcd', maxZoom: 19,
    }).addTo(m);

    L.control.zoom({ position: 'bottomright' }).addTo(m);

    pins.forEach(pin => {
      L.marker([pin.lat, pin.lng], { icon: makePinIcon() })
        .bindPopup(L.popup({ className: 'adm-popup', maxWidth: 220, closeButton: false }).setContent(
          `<div style="font-family:'Plus Jakarta Sans',sans-serif;padding:2px 0">
            <div style="font-size:.82rem;font-weight:800;color:#1e362a;margin-bottom:4px">${pin.name}</div>
            <div style="font-size:.7rem;color:#64748b;line-height:1.8">
              <span>👤 ${pin.owner}</span><br>
              <span>🌱 ${pin.crop_count} crop${pin.crop_count !== 1 ? 's' : ''}</span>
              ${pin.size ? `<br><span>📐 ${pin.size}</span>` : ''}
            </div>
          </div>`
        )).addTo(m);
    });

    if (pins.length > 1) {
      m.fitBounds(L.latLngBounds(pins.map(p => [p.lat, p.lng])), { padding: [48, 48] });
    }

    map.current = m;
    return () => { m.remove(); map.current = null; };
  }, [pins]);

  return <div ref={ref} style={{ height: '100%', width: '100%' }} />;
}

/* ─── badge ──────────────────────────────────────────────────── */
const ROLE_CFG = {
  admin:      { color: '#dc2626', bg: '#fef2f2' },
  agronomist: { color: '#7c3aed', bg: '#f5f3ff' },
  farmer:     { color: '#059669', bg: '#f0fdf4' },
};

function RoleBadge({ role }) {
  const s = ROLE_CFG[role] || ROLE_CFG.farmer;
  return (
    <span style={{
      fontSize: '.6rem', fontWeight: 800, textTransform: 'uppercase',
      letterSpacing: '.06em', padding: '.2rem .55rem',
      borderRadius: 999, background: s.bg, color: s.color,
    }}>{role}</span>
  );
}

/* ─── avatar ─────────────────────────────────────────────────── */
function Avatar({ name = '?' }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const colors = ['#d1fae5', '#dbeafe', '#ede9fe', '#fef3c7', '#fce7f3'];
  const textColors = ['#065f46', '#1e40af', '#5b21b6', '#92400e', '#9d174d'];
  const i = name.charCodeAt(0) % colors.length;
  return (
    <div style={{
      width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
      background: colors[i], border: `1px solid ${textColors[i]}30`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '.58rem', fontWeight: 800, color: textColors[i],
    }}>{initials}</div>
  );
}

/* ─── search box ─────────────────────────────────────────────── */
function SearchBox({ value, onChange, placeholder }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '.35rem',
      background: '#f8fafc', border: '1px solid #e2e8f0',
      borderRadius: 8, padding: '.22rem .6rem',
    }}>
      <Search size={11} style={{ color: '#94a3b8', flexShrink: 0 }} />
      <input
        type="text" value={value} placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        style={{ background: 'none', border: 'none', outline: 'none', fontSize: '.68rem', color: '#1e362a', width: 110, fontFamily: 'inherit' }}
      />
      {value && (
        <button onClick={() => onChange('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0, lineHeight: 1, fontSize: '.68rem' }}>✕</button>
      )}
    </div>
  );
}

/* ─── table header cell ──────────────────────────────────────── */
const TH = ({ children }) => (
  <th style={{
    padding: '.6rem 1rem', textAlign: 'left',
    fontSize: '.6rem', fontWeight: 800, textTransform: 'uppercase',
    letterSpacing: '.08em', color: '#94a3b8',
    borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap',
  }}>{children}</th>
);

/* ─── main ───────────────────────────────────────────────────── */
const CACHE_KEY = 'planto_admin_overview';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function readCache() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { ts, payload } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) { sessionStorage.removeItem(CACHE_KEY); return null; }
    return payload;
  } catch { return null; }
}

function writeCache(payload) {
  try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), payload })); } catch {}
}

export default function AdminDashboard() {
  const [data, setData]   = useState(() => readCache());
  const [busy, setBusy]   = useState(() => !readCache());
  const [err, setErr]     = useState(null);
  const [uq, setUq]       = useState('');
  const [fq, setFq]       = useState('');
  const [dUq, setDUq]     = useState('');
  const [dFq, setDFq]     = useState('');
  const uTimer = useRef(null);
  const fTimer = useRef(null);

  const handleUq = useCallback(v => {
    setUq(v);
    clearTimeout(uTimer.current);
    uTimer.current = setTimeout(() => setDUq(v), 180);
  }, []);

  const handleFq = useCallback(v => {
    setFq(v);
    clearTimeout(fTimer.current);
    fTimer.current = setTimeout(() => setDFq(v), 180);
  }, []);

  useEffect(() => {
    if (data) return; // served from cache, skip fetch
    adminApi.getOverview()
      .then(d => { setData(d); writeCache(d); })
      .catch(() => setErr('Failed to load admin data'))
      .finally(() => setBusy(false));
  }, []);

  // All hooks must run before any early return — safe with null data fallbacks
  const all_users = data?.all_users ?? [];
  const all_farms = data?.all_farms ?? [];
  const stats     = data?.stats     ?? {};
  const farm_pins = data?.farm_pins ?? [];

  const users = useMemo(() => {
    if (!dUq) return all_users;
    const q = dUq.toLowerCase();
    return all_users.filter(u =>
      u.full_name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.includes(q)
    );
  }, [all_users, dUq]);

  const farms = useMemo(() => {
    if (!dFq) return all_farms;
    const q = dFq.toLowerCase();
    return all_farms.filter(f =>
      f.name.toLowerCase().includes(q) ||
      f.owner.toLowerCase().includes(q) ||
      f.location.toLowerCase().includes(q)
    );
  }, [all_farms, dFq]);

  const CARDS = useMemo(() => [
    { label: 'Total Users',  value: stats.total_users,  Icon: Users,       bg: '#f0fdf4', ic: '#10b981' },
    { label: 'Farmers',      value: stats.farmers,       Icon: Tractor,     bg: '#eff6ff', ic: '#3b82f6' },
    { label: 'Agronomists',  value: stats.agronomists,   Icon: ShieldCheck, bg: '#f5f3ff', ic: '#7c3aed' },
    { label: 'Total Farms',  value: stats.total_farms,   Icon: Building2,   bg: '#fff7ed', ic: '#f59e0b' },
    { label: 'Active Crops', value: stats.total_crops,   Icon: Sprout,      bg: '#fdf2f8', ic: '#ec4899' },
    { label: 'Mapped Farms', value: stats.mapped_farms,  Icon: Globe,       bg: '#ecfeff', ic: '#06b6d4' },
  ], [stats]);

  if (busy) return (
    <>
      <style>{`
        @keyframes adm-shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position:  400px 0; }
        }
        .adm-sk {
          background: linear-gradient(90deg,#f1f5f9 25%,#e9f0f7 50%,#f1f5f9 75%);
          background-size: 800px 100%;
          animation: adm-shimmer 1.4s ease-in-out infinite;
          border-radius: 8px;
        }
        .adm-sk-card {
          background: rgba(255,255,255,.95);
          border-radius: 18px;
          border: 1px solid #10b981;
          box-shadow: 0 2px 4px rgba(0,0,0,.04);
        }
      `}</style>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        {/* stat strip skeleton — 6 columns */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: '.65rem' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="adm-sk-card" style={{ padding: '.75rem .9rem', display: 'flex', alignItems: 'center', gap: '.65rem' }}>
              <div className="adm-sk" style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div className="adm-sk" style={{ height: 18, width: '55%', marginBottom: '.3rem' }} />
                <div className="adm-sk" style={{ height: 9, width: '80%' }} />
              </div>
            </div>
          ))}
        </div>

        {/* map skeleton */}
        <div className="adm-sk-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '.7rem 1rem', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
              <div className="adm-sk" style={{ width: 28, height: 28, borderRadius: 8 }} />
              <div>
                <div className="adm-sk" style={{ height: 12, width: 100, marginBottom: '.3rem' }} />
                <div className="adm-sk" style={{ height: 9, width: 140 }} />
              </div>
            </div>
            <div className="adm-sk" style={{ height: 20, width: 72, borderRadius: 6 }} />
          </div>
          <div className="adm-sk" style={{ height: 300, borderRadius: 0 }} />
        </div>

        {/* tables skeleton — 2 columns */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {Array.from({ length: 2 }).map((_, ti) => (
            <div key={ti} className="adm-sk-card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '.65rem 1rem', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                  <div className="adm-sk" style={{ width: 13, height: 13, borderRadius: 3 }} />
                  <div className="adm-sk" style={{ height: 12, width: 70 }} />
                  <div className="adm-sk" style={{ height: 12, width: 24, borderRadius: 4 }} />
                </div>
                <div className="adm-sk" style={{ height: 24, width: 130, borderRadius: 8 }} />
              </div>
              {/* exact match: real table has maxHeight:280 + sticky thead row (~33px) = same total */}
              <div style={{ height: 280, overflow: 'hidden' }}>
                {/* thead row */}
                <div style={{ padding: '.6rem 1rem', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '1rem' }}>
                  {[60, 44, 36, 36].map((w, i) => (
                    <div key={i} className="adm-sk" style={{ height: 8, width: w }} />
                  ))}
                </div>
                {Array.from({ length: 6 }).map((_, ri) => (
                  <div key={ri} style={{ padding: '.45rem .85rem', borderBottom: '1px solid #f8fafc', display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                    <div className="adm-sk" style={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div className="adm-sk" style={{ height: 10, width: `${45 + ri * 7}%`, marginBottom: '.25rem' }} />
                      <div className="adm-sk" style={{ height: 8, width: '60%' }} />
                    </div>
                    <div className="adm-sk" style={{ height: 16, width: 44, borderRadius: 999 }} />
                    <div className="adm-sk" style={{ height: 10, width: 32 }} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

      </div>
    </>
  );

  if (err) return <p style={{ padding: '2rem', color: '#ef4444', fontSize: '.88rem' }}>{err}</p>;

  return (
    <>
      <style>{`
        .adm-popup .leaflet-popup-content-wrapper {
          background: #fff !important;
          border: 1px solid #e2e8f0 !important;
          border-radius: 14px !important;
          box-shadow: 0 8px 30px rgba(0,0,0,.1) !important;
          padding: 10px 14px !important;
        }
        .adm-popup .leaflet-popup-tip { background: #fff !important; }
        .adm-popup .leaflet-popup-content { margin: 0 !important; }
        .leaflet-control-zoom a {
          background: #fff !important; color: #1e362a !important;
          border-color: #e2e8f0 !important;
        }
        .leaflet-control-zoom a:hover { background: #f0fdf4 !important; color: #10b981 !important; }
        .leaflet-control-attribution { display: none !important; }
        .adm-row { transition: background .12s; }
        .adm-row:hover { background: #f8fafc !important; }
        .adm-card {
          background: rgba(255,255,255,.95);
          border-radius: 18px;
          border: 1px solid #10b981;
          box-shadow: 0 2px 4px rgba(0,0,0,.04);
          transition: all .25s cubic-bezier(.16,1,.3,1);
        }
        .adm-card:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(16,185,129,.1); }
        @keyframes adm-up {
          from { opacity:0; transform:translateY(12px); }
          to   { opacity:1; transform:translateY(0); }
        }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        {/* ── stat strip ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: '.65rem' }}>
          {CARDS.map(({ label, value, Icon, bg, ic }, i) => (
            <div key={label} className="adm-card" style={{ padding: '.75rem .9rem', display: 'flex', alignItems: 'center', gap: '.65rem', animation: `adm-up .35s ease ${i * .05}s both` }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={15} style={{ color: ic }} />
              </div>
              <div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1e362a', lineHeight: 1, letterSpacing: '-.02em', fontFamily: 'var(--font-heading)' }}>{value}</div>
                <div style={{ fontSize: '.58rem', color: '#64748b', marginTop: '.15rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em' }}>{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── farm map ── */}
        <div className="adm-card" style={{ padding: 0, overflow: 'hidden', animation: 'adm-up .35s ease .15s both' }}>
          <div style={{ padding: '.7rem 1rem', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MapPin size={13} style={{ color: '#10b981' }} />
              </div>
              <div>
                <div style={{ fontSize: '.78rem', fontWeight: 800, color: '#1e362a', fontFamily: 'var(--font-heading)' }}>Farm Locations</div>
                <div style={{ fontSize: '.62rem', color: '#94a3b8' }}>
                  {farm_pins.length} farm{farm_pins.length !== 1 ? 's' : ''} with GPS coordinates
                </div>
              </div>
            </div>
            <span style={{ fontSize: '.62rem', fontWeight: 700, background: '#f0fdf4', color: '#10b981', border: '1px solid #bbf7d0', borderRadius: 6, padding: '.18rem .55rem' }}>
              {farm_pins.length} mapped
            </span>
          </div>
          <div style={{ height: 300 }}>
            <FarmMap pins={farm_pins} />
          </div>
        </div>

        {/* ── users + farms ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', animation: 'adm-up .35s ease .2s both' }}>

          {/* users */}
          <div className="adm-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '.65rem 1rem', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                <Users size={13} style={{ color: '#10b981' }} />
                <span style={{ fontSize: '.78rem', fontWeight: 800, color: '#1e362a', fontFamily: 'var(--font-heading)' }}>All Users</span>
                <span style={{ fontSize: '.58rem', fontWeight: 800, background: '#f0fdf4', color: '#10b981', borderRadius: 4, padding: '.08rem .4rem' }}>{users.length}</span>
              </div>
              <SearchBox value={uq} onChange={handleUq} placeholder="Search users…" />
            </div>
            <div style={{ maxHeight: 280, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
                  <tr><TH>User</TH><TH>Role</TH><TH>Status</TH><TH>Joined</TH></tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr><td colSpan={4} style={{ padding: '1.5rem', textAlign: 'center', color: '#94a3b8', fontSize: '.75rem' }}>No users found</td></tr>
                  ) : users.map(u => (
                    <tr key={u.id} className="adm-row">
                      <td style={{ padding: '.45rem .85rem', borderBottom: '1px solid #f8fafc' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                          <Avatar name={u.full_name} />
                          <div>
                            <div style={{ fontSize: '.72rem', fontWeight: 700, color: '#1e362a' }}>{u.full_name}</div>
                            <div style={{ fontSize: '.6rem', color: '#94a3b8', marginTop: '.08rem' }}>{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '.45rem .85rem', borderBottom: '1px solid #f8fafc' }}><RoleBadge role={u.role} /></td>
                      <td style={{ padding: '.45rem .85rem', borderBottom: '1px solid #f8fafc' }}>
                        <span style={{ fontSize: '.58rem', fontWeight: 700, padding: '.15rem .45rem', borderRadius: 999, background: u.is_active ? '#f0fdf4' : '#fef2f2', color: u.is_active ? '#059669' : '#dc2626' }}>
                          {u.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '.45rem .85rem', borderBottom: '1px solid #f8fafc', fontSize: '.65rem', color: '#94a3b8' }}>
                        {new Date(u.joined).toLocaleDateString('en', { month: 'short', day: 'numeric', year: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* farms */}
          <div className="adm-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '.65rem 1rem', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                <Building2 size={13} style={{ color: '#f59e0b' }} />
                <span style={{ fontSize: '.78rem', fontWeight: 800, color: '#1e362a', fontFamily: 'var(--font-heading)' }}>All Farms</span>
                <span style={{ fontSize: '.58rem', fontWeight: 800, background: '#fff7ed', color: '#f59e0b', borderRadius: 4, padding: '.08rem .4rem' }}>{farms.length}</span>
              </div>
              <SearchBox value={fq} onChange={handleFq} placeholder="Search farms…" />
            </div>
            <div style={{ maxHeight: 280, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
                  <tr><TH>Farm</TH><TH>Owner</TH><TH>Size</TH><TH>Crops</TH></tr>
                </thead>
                <tbody>
                  {farms.length === 0 ? (
                    <tr><td colSpan={4} style={{ padding: '1.5rem', textAlign: 'center', color: '#94a3b8', fontSize: '.75rem' }}>No farms found</td></tr>
                  ) : farms.map(f => (
                    <tr key={f.id} className="adm-row">
                      <td style={{ padding: '.45rem .85rem', borderBottom: '1px solid #f8fafc' }}>
                        <div style={{ fontSize: '.72rem', fontWeight: 700, color: '#1e362a' }}>{f.name}</div>
                        <div style={{ fontSize: '.6rem', color: '#94a3b8', marginTop: '.08rem' }}>{f.location}</div>
                      </td>
                      <td style={{ padding: '.45rem .85rem', borderBottom: '1px solid #f8fafc', fontSize: '.7rem', color: '#475569' }}>{f.owner}</td>
                      <td style={{ padding: '.45rem .85rem', borderBottom: '1px solid #f8fafc', fontSize: '.67rem', color: '#94a3b8' }}>{f.size}</td>
                      <td style={{ padding: '.45rem .85rem', borderBottom: '1px solid #f8fafc' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '.3rem', fontSize: '.7rem', fontWeight: 800, color: f.crop_count > 0 ? '#10b981' : '#cbd5e1' }}>
                          {f.crop_count > 0 && <Sprout size={11} style={{ color: '#10b981' }} />}
                          {f.crop_count}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
