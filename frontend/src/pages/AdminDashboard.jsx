import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { adminApi } from '../api/adminApi';
import { Users, Sprout, Map, Tractor } from 'lucide-react';

// Fix default Leaflet marker icons (broken with bundlers)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const STAT_CARDS = (stats) => [
  { label: 'Total Users', value: stats.total_users, icon: Users, color: '#10b981' },
  { label: 'Farmers', value: stats.farmers, icon: Tractor, color: '#3b82f6' },
  { label: 'Farms', value: stats.total_farms, icon: Map, color: '#f59e0b' },
  { label: 'Active Crops', value: stats.total_crops, icon: Sprout, color: '#8b5cf6' },
];

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    adminApi.getOverview()
      .then(setData)
      .catch(() => setError('Failed to load admin data'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>
      Loading…
    </div>
  );

  if (error) return (
    <div style={{ padding: '2rem', color: '#f87171', fontSize: '0.9rem' }}>{error}</div>
  );

  const center = data.farm_pins.length
    ? [data.farm_pins[0].lat, data.farm_pins[0].lng]
    : [-1.9403, 29.8739]; // Rwanda default

  return (
    <div style={{ padding: '1.5rem 2rem', display: 'flex', flexDirection: 'column', gap: '1.75rem', maxWidth: 1100, margin: '0 auto' }}>

      {/* Stat Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {STAT_CARDS(data.stats).map(({ label, value, icon: Icon, color }) => (
          <div key={label} style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 14, padding: '1.1rem 1.25rem',
            display: 'flex', alignItems: 'center', gap: '1rem',
          }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={18} style={{ color }} />
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.2rem', fontWeight: 500 }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Farm Map */}
      <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ padding: '0.85rem 1.25rem', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.88rem' }}>Farm Locations</span>
          <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)' }}>{data.stats.mapped_farms} farms mapped</span>
        </div>
        <MapContainer center={center} zoom={7} style={{ height: 420, width: '100%' }} scrollWheelZoom={false}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {data.farm_pins.map(pin => (
            <Marker key={pin.id} position={[pin.lat, pin.lng]}>
              <Popup>
                <div style={{ minWidth: 140 }}>
                  <strong>{pin.name}</strong><br />
                  <span style={{ fontSize: '0.8rem', color: '#555' }}>Owner: {pin.owner}</span><br />
                  <span style={{ fontSize: '0.8rem', color: '#555' }}>Crops: {pin.crop_count}</span>
                  {pin.size && <><br /><span style={{ fontSize: '0.8rem', color: '#555' }}>Size: {pin.size}</span></>}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Recent Users */}
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.88rem' }}>Recent Users</span>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
              {['Name', 'Email', 'Role', 'Joined'].map(h => (
                <th key={h} style={{ padding: '0.6rem 1.25rem', textAlign: 'left', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.35)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.recent_users.map((u) => (
              <tr key={u.id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '0.75rem 1.25rem', fontSize: '0.82rem', color: '#fff', fontWeight: 600 }}>{u.full_name}</td>
                <td style={{ padding: '0.75rem 1.25rem', fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)' }}>{u.email}</td>
                <td style={{ padding: '0.75rem 1.25rem' }}>
                  <span style={{
                    fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                    padding: '0.2rem 0.55rem', borderRadius: '999px',
                    background: u.role === 'admin' ? 'rgba(239,68,68,0.15)' : u.role === 'agronomist' ? 'rgba(59,130,246,0.15)' : 'rgba(16,185,129,0.15)',
                    color: u.role === 'admin' ? '#f87171' : u.role === 'agronomist' ? '#60a5fa' : '#10b981',
                  }}>{u.role}</span>
                </td>
                <td style={{ padding: '0.75rem 1.25rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)' }}>
                  {new Date(u.joined).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
