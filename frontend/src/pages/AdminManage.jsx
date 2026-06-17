import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Users, Building2, Search, ShieldCheck, Tractor, Trash2,
  CheckCircle2, XCircle, ToggleLeft, ToggleRight, Clock, ChevronDown
} from 'lucide-react';
import { adminApi } from '../api/adminApi';

/* ── shared helpers ───────────────────────────────────────────── */
const ROLE_CFG = {
  admin:      { color: '#dc2626', bg: '#fef2f2', label: 'Admin' },
  agronomist: { color: '#7c3aed', bg: '#f5f3ff', label: 'Agronomist' },
  farmer:     { color: '#059669', bg: '#f0fdf4', label: 'Farmer' },
};

function Badge({ role }) {
  const s = ROLE_CFG[role] || ROLE_CFG.farmer;
  return (
    <span style={{
      fontSize: '.58rem', fontWeight: 800, textTransform: 'uppercase',
      letterSpacing: '.06em', padding: '.18rem .55rem',
      borderRadius: 999, background: s.bg, color: s.color, whiteSpace: 'nowrap',
    }}>{s.label}</span>
  );
}

function Avatar({ name = '?' }) {
  const parts = name.trim().split(' ');
  const initials = (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '');
  const palette = [
    ['#d1fae5','#065f46'], ['#dbeafe','#1e40af'], ['#ede9fe','#5b21b6'],
    ['#fef3c7','#92400e'], ['#fce7f3','#9d174d'],
  ];
  const [bg, fg] = palette[name.charCodeAt(0) % palette.length];
  return (
    <div style={{
      width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
      background: bg, display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontSize: '.6rem', fontWeight: 800, color: fg,
      border: `1.5px solid ${fg}30`,
    }}>{initials.toUpperCase()}</div>
  );
}

function SearchBox({ value, onChange, placeholder }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '.35rem',
      background: '#f8fafc', border: '1px solid #e2e8f0',
      borderRadius: 8, padding: '.25rem .65rem',
    }}>
      <Search size={11} color="#94a3b8" style={{ flexShrink: 0 }} />
      <input
        value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ background: 'none', border: 'none', outline: 'none', fontSize: '.68rem', color: '#1e362a', width: 130, fontFamily: 'inherit' }}
      />
      {value && <button onClick={() => onChange('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0, lineHeight: 1 }}>✕</button>}
    </div>
  );
}

const TH = ({ children, style = {} }) => (
  <th style={{
    padding: '.55rem .85rem', textAlign: 'left',
    fontSize: '.58rem', fontWeight: 800, textTransform: 'uppercase',
    letterSpacing: '.08em', color: '#94a3b8',
    borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap', ...style,
  }}>{children}</th>
);

function ConfirmModal({ message, onConfirm, onCancel }) {
  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}
    onClick={e => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div style={{
        background: '#fff', borderRadius: 18, padding: '1.6rem 2rem', maxWidth: 380, width: '90%',
        boxShadow: '0 20px 60px rgba(0,0,0,.22)', border: '1px solid #e2e8f0',
        animation: 'mng-up .2s ease',
      }}>
        <div style={{ fontSize: '.88rem', fontWeight: 700, color: '#1e362a', marginBottom: '1.2rem', lineHeight: 1.5 }}>{message}</div>
        <div style={{ display: 'flex', gap: '.65rem', justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{ padding: '.45rem 1.1rem', borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#64748b', fontSize: '.75rem', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          <button onClick={onConfirm} style={{ padding: '.45rem 1.1rem', borderRadius: 8, border: 'none', background: '#ef4444', color: '#fff', fontSize: '.75rem', fontWeight: 700, cursor: 'pointer' }}>Confirm</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function Toast({ msg, type }) {
  if (!msg) return null;
  const bg = type === 'error' ? '#fef2f2' : '#f0fdf4';
  const color = type === 'error' ? '#dc2626' : '#059669';
  const border = type === 'error' ? '#fecaca' : '#bbf7d0';
  return createPortal(
    <div style={{
      position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 100000,
      background: bg, color, border: `1px solid ${border}`,
      borderRadius: 12, padding: '.65rem 1.1rem', fontSize: '.75rem', fontWeight: 700,
      boxShadow: '0 8px 24px rgba(0,0,0,.1)', animation: 'fadeUp .25s ease',
    }}>{msg}</div>,
    document.body
  );
}

/* ── main page ────────────────────────────────────────────────── */
export default function AdminManage() {
  const [pending, setPending]   = useState([]);
  const [users, setUsers]       = useState([]);
  const [farms, setFarms]       = useState([]);
  const [loadingP, setLoadingP] = useState(true);
  const [loadingU, setLoadingU] = useState(true);
  const [loadingF, setLoadingF] = useState(true);
  const [uq, setUq]             = useState('');
  const [fq, setFq]             = useState('');
  const [dUq, setDUq]           = useState('');
  const [dFq, setDFq]           = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [confirm, setConfirm]   = useState(null); // { msg, action }
  const [toast, setToast]       = useState(null);
  const [busy, setBusy]         = useState({});
  const uTimer = useRef(null);
  const fTimer = useRef(null);

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const loadAll = useCallback(async () => {
    setLoadingP(true); setLoadingU(true); setLoadingF(true);
    const [pRes, oRes] = await Promise.allSettled([
      adminApi.getPending(),
      adminApi.getOverview(),
    ]);
    if (pRes.status === 'fulfilled') setPending(pRes.value);
    if (oRes.status === 'fulfilled') {
      setUsers(oRes.value.all_users);
      setFarms(oRes.value.all_farms);
    }
    setLoadingP(false); setLoadingU(false); setLoadingF(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleUq = useCallback(v => { setUq(v); clearTimeout(uTimer.current); uTimer.current = setTimeout(() => setDUq(v), 180); }, []);
  const handleFq = useCallback(v => { setFq(v); clearTimeout(fTimer.current); fTimer.current = setTimeout(() => setDFq(v), 180); }, []);

  const filteredUsers = useMemo(() => {
    let list = users;
    if (roleFilter !== 'all') list = list.filter(u => u.role === roleFilter);
    if (dUq) {
      const q = dUq.toLowerCase();
      list = list.filter(u => u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }
    return list;
  }, [users, dUq, roleFilter]);

  const filteredFarms = useMemo(() => {
    if (!dFq) return farms;
    const q = dFq.toLowerCase();
    return farms.filter(f => f.name.toLowerCase().includes(q) || f.owner.toLowerCase().includes(q) || f.location.toLowerCase().includes(q));
  }, [farms, dFq]);

  /* ── actions ── */
  const act = useCallback(async (key, fn, successMsg) => {
    setBusy(b => ({ ...b, [key]: true }));
    try {
      await fn();
      showToast(successMsg);
      await loadAll();
    } catch (e) {
      showToast(e.message || 'Action failed', 'error');
    } finally {
      setBusy(b => ({ ...b, [key]: false }));
    }
  }, [loadAll, showToast]);

  const approve = id => act(`approve_${id}`, () => adminApi.approveUser(id), 'Agronomist approved');
  const reject  = id => setConfirm({ msg: 'Reject and permanently delete this applicant?', action: () => act(`reject_${id}`, () => adminApi.rejectUser(id), 'Applicant rejected') });
  const toggleActive = (u) => setConfirm({
    msg: `${u.is_active ? 'Deactivate' : 'Activate'} ${u.full_name}?`,
    action: () => act(`toggle_${u.id}`, () => adminApi.updateUser(u.id, { is_active: !u.is_active }), u.is_active ? 'User deactivated' : 'User activated'),
  });
  const changeRole = (u, role) => setConfirm({
    msg: `Change ${u.full_name}'s role to ${role}?`,
    action: () => act(`role_${u.id}`, () => adminApi.updateUser(u.id, { role }), 'Role updated'),
  });
  const deleteUser = u => setConfirm({ msg: `Permanently delete ${u.full_name}? This cannot be undone.`, action: () => act(`del_${u.id}`, () => adminApi.deleteUser(u.id), 'User deleted') });
  const deleteFarm = f => setConfirm({ msg: `Permanently delete farm "${f.name}"?`, action: () => act(`farm_${f.id}`, () => adminApi.deleteFarm(f.id), 'Farm deleted') });

  const card = (style = {}) => ({
    background: 'rgba(255,255,255,.95)',
    borderRadius: 18,
    border: '1px solid #10b981',
    boxShadow: '0 2px 4px rgba(0,0,0,.04)',
    overflow: 'hidden',
    ...style,
  });

  return (
    <>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
        @keyframes mng-up { from { opacity:0; transform:translateY(14px) } to { opacity:1; transform:translateY(0) } }
        .mng-row { transition: background .12s; }
        .mng-row:hover { background: #f8fafc !important; }
        .mng-btn { transition: all .15s; cursor: pointer; }
        .mng-btn:hover { filter: brightness(.92); }
        .mng-role-btn { transition: all .15s; }
        .mng-role-btn:hover { background: #f1f5f9 !important; }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        {/* ── Pending Approvals ── */}
        <div style={{ ...card(), animation: 'mng-up .3s ease both' }}>
          <div style={{ padding: '.7rem 1.1rem', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '.55rem' }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Clock size={13} color="#f59e0b" />
            </div>
            <div>
              <div style={{ fontSize: '.78rem', fontWeight: 800, color: '#1e362a', fontFamily: 'var(--font-heading)' }}>Pending Approvals</div>
              <div style={{ fontSize: '.6rem', color: '#94a3b8' }}>Agronomists awaiting account activation</div>
            </div>
            {pending.length > 0 && (
              <span style={{ marginLeft: 'auto', fontSize: '.62rem', fontWeight: 800, background: '#fef3c7', color: '#d97706', border: '1px solid #fde68a', borderRadius: 6, padding: '.18rem .6rem' }}>
                {pending.length} waiting
              </span>
            )}
          </div>

          {loadingP ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: '#94a3b8', fontSize: '.75rem' }}>Loading…</div>
          ) : pending.length === 0 ? (
            <div style={{ padding: '1.4rem 1.1rem', display: 'flex', alignItems: 'center', gap: '.5rem', color: '#10b981' }}>
              <CheckCircle2 size={14} />
              <span style={{ fontSize: '.75rem', fontWeight: 600 }}>No pending approvals — all caught up!</span>
            </div>
          ) : (
            <div>
              {pending.map((u, i) => (
                <div key={u.id} className="mng-row" style={{ padding: '.7rem 1.1rem', borderBottom: i < pending.length - 1 ? '1px solid #f8fafc' : 'none', display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                  <Avatar name={u.full_name} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '.74rem', fontWeight: 700, color: '#1e362a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.full_name}</div>
                    <div style={{ fontSize: '.62rem', color: '#94a3b8', marginTop: '.1rem' }}>{u.email}</div>
                  </div>
                  <div style={{ fontSize: '.62rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                    {new Date(u.joined).toLocaleDateString('en', { month: 'short', day: 'numeric', year: '2-digit' })}
                  </div>
                  <div style={{ display: 'flex', gap: '.4rem' }}>
                    <button
                      className="mng-btn"
                      disabled={busy[`approve_${u.id}`]}
                      onClick={() => approve(u.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: '.3rem', padding: '.35rem .85rem', borderRadius: 8, border: 'none', background: '#10b981', color: '#fff', fontSize: '.68rem', fontWeight: 700 }}
                    >
                      <CheckCircle2 size={11} /> Approve
                    </button>
                    <button
                      className="mng-btn"
                      disabled={busy[`reject_${u.id}`]}
                      onClick={() => reject(u.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: '.3rem', padding: '.35rem .85rem', borderRadius: 8, border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', fontSize: '.68rem', fontWeight: 700 }}
                    >
                      <XCircle size={11} /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── User Management ── */}
        <div style={{ ...card(), animation: 'mng-up .3s ease .06s both' }}>
          <div style={{ padding: '.7rem 1.1rem', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '.55rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.45rem', flex: 1 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={13} color="#10b981" />
              </div>
              <span style={{ fontSize: '.78rem', fontWeight: 800, color: '#1e362a', fontFamily: 'var(--font-heading)' }}>User Management</span>
              <span style={{ fontSize: '.58rem', fontWeight: 800, background: '#f0fdf4', color: '#10b981', borderRadius: 4, padding: '.08rem .4rem' }}>{filteredUsers.length}</span>
            </div>
            {/* role filter */}
            <div style={{ display: 'flex', gap: '.3rem' }}>
              {['all','farmer','agronomist','admin'].map(r => (
                <button key={r} onClick={() => setRoleFilter(r)} className="mng-role-btn" style={{
                  padding: '.2rem .55rem', borderRadius: 6, border: '1px solid #e2e8f0',
                  background: roleFilter === r ? '#1e362a' : '#f8fafc',
                  color: roleFilter === r ? '#fff' : '#64748b',
                  fontSize: '.6rem', fontWeight: 700, cursor: 'pointer', textTransform: 'capitalize',
                }}>{r}</button>
              ))}
            </div>
            <SearchBox value={uq} onChange={handleUq} placeholder="Search users…" />
          </div>

          <div style={{ maxHeight: 340, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
                <tr><TH>User</TH><TH>Role</TH><TH>Status</TH><TH>Joined</TH><TH style={{ textAlign: 'right' }}>Actions</TH></tr>
              </thead>
              <tbody>
                {loadingU ? (
                  <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '.75rem' }}>Loading…</td></tr>
                ) : filteredUsers.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '.75rem' }}>No users found</td></tr>
                ) : filteredUsers.map(u => (
                  <tr key={u.id} className="mng-row">
                    <td style={{ padding: '.5rem .85rem', borderBottom: '1px solid #f8fafc' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                        <Avatar name={u.full_name} />
                        <div>
                          <div style={{ fontSize: '.72rem', fontWeight: 700, color: '#1e362a' }}>{u.full_name}</div>
                          <div style={{ fontSize: '.6rem', color: '#94a3b8' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '.5rem .85rem', borderBottom: '1px solid #f8fafc' }}>
                      <RoleDropdown user={u} onSelect={r => changeRole(u, r)} />
                    </td>
                    <td style={{ padding: '.5rem .85rem', borderBottom: '1px solid #f8fafc' }}>
                      <span style={{ fontSize: '.6rem', fontWeight: 700, padding: '.15rem .45rem', borderRadius: 999, background: u.is_active ? '#f0fdf4' : '#fef2f2', color: u.is_active ? '#059669' : '#dc2626' }}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '.5rem .85rem', borderBottom: '1px solid #f8fafc', fontSize: '.65rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                      {new Date(u.joined).toLocaleDateString('en', { month: 'short', day: 'numeric', year: '2-digit' })}
                    </td>
                    <td style={{ padding: '.5rem .85rem', borderBottom: '1px solid #f8fafc' }}>
                      <div style={{ display: 'flex', gap: '.35rem', justifyContent: 'flex-end' }}>
                        <button
                          className="mng-btn"
                          title={u.is_active ? 'Deactivate' : 'Activate'}
                          disabled={busy[`toggle_${u.id}`]}
                          onClick={() => toggleActive(u)}
                          style={{ padding: '.28rem .6rem', borderRadius: 7, border: '1px solid #e2e8f0', background: '#f8fafc', color: u.is_active ? '#f59e0b' : '#10b981', display: 'flex', alignItems: 'center' }}
                        >
                          {u.is_active ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                        </button>
                        <button
                          className="mng-btn"
                          title="Delete user"
                          disabled={busy[`del_${u.id}`]}
                          onClick={() => deleteUser(u)}
                          style={{ padding: '.28rem .6rem', borderRadius: 7, border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center' }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Farm Management ── */}
        <div style={{ ...card(), animation: 'mng-up .3s ease .12s both' }}>
          <div style={{ padding: '.7rem 1.1rem', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '.55rem' }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 size={13} color="#f59e0b" />
            </div>
            <span style={{ fontSize: '.78rem', fontWeight: 800, color: '#1e362a', fontFamily: 'var(--font-heading)' }}>Farm Management</span>
            <span style={{ fontSize: '.58rem', fontWeight: 800, background: '#fff7ed', color: '#f59e0b', borderRadius: 4, padding: '.08rem .4rem' }}>{filteredFarms.length}</span>
            <div style={{ marginLeft: 'auto' }}>
              <SearchBox value={fq} onChange={handleFq} placeholder="Search farms…" />
            </div>
          </div>

          <div style={{ maxHeight: 300, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
                <tr><TH>Farm</TH><TH>Owner</TH><TH>Location</TH><TH>Size</TH><TH>Crops</TH><TH style={{ textAlign: 'right' }}>Action</TH></tr>
              </thead>
              <tbody>
                {loadingF ? (
                  <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '.75rem' }}>Loading…</td></tr>
                ) : filteredFarms.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '.75rem' }}>No farms found</td></tr>
                ) : filteredFarms.map(f => (
                  <tr key={f.id} className="mng-row">
                    <td style={{ padding: '.5rem .85rem', borderBottom: '1px solid #f8fafc' }}>
                      <div style={{ fontSize: '.72rem', fontWeight: 700, color: '#1e362a' }}>{f.name}</div>
                    </td>
                    <td style={{ padding: '.5rem .85rem', borderBottom: '1px solid #f8fafc', fontSize: '.7rem', color: '#475569' }}>{f.owner}</td>
                    <td style={{ padding: '.5rem .85rem', borderBottom: '1px solid #f8fafc', fontSize: '.67rem', color: '#94a3b8', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.location}</td>
                    <td style={{ padding: '.5rem .85rem', borderBottom: '1px solid #f8fafc', fontSize: '.67rem', color: '#94a3b8' }}>{f.size}</td>
                    <td style={{ padding: '.5rem .85rem', borderBottom: '1px solid #f8fafc', fontSize: '.7rem', fontWeight: 700, color: f.crop_count > 0 ? '#10b981' : '#cbd5e1' }}>{f.crop_count}</td>
                    <td style={{ padding: '.5rem .85rem', borderBottom: '1px solid #f8fafc', textAlign: 'right' }}>
                      <button
                        className="mng-btn"
                        disabled={busy[`farm_${f.id}`]}
                        onClick={() => deleteFarm(f)}
                        style={{ padding: '.28rem .6rem', borderRadius: 7, border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', display: 'inline-flex', alignItems: 'center', gap: '.25rem', fontSize: '.62rem', fontWeight: 700 }}
                      >
                        <Trash2 size={11} /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {confirm && (
        <ConfirmModal
          message={confirm.msg}
          onConfirm={() => { confirm.action(); setConfirm(null); }}
          onCancel={() => setConfirm(null)}
        />
      )}
      <Toast msg={toast?.msg} type={toast?.type} />
    </>
  );
}

/* ── role dropdown ────────────────────────────────────────────── */
function RoleDropdown({ user, onSelect }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const roles = ['farmer', 'agronomist', 'admin'];
  const s = ROLE_CFG[user.role] || ROLE_CFG.farmer;

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: '.3rem',
          fontSize: '.58rem', fontWeight: 800, textTransform: 'uppercase',
          letterSpacing: '.06em', padding: '.18rem .5rem .18rem .55rem',
          borderRadius: 999, background: s.bg, color: s.color,
          border: 'none', cursor: 'pointer',
        }}
      >
        {ROLE_CFG[user.role]?.label ?? user.role}
        <ChevronDown size={9} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 50,
          background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10,
          boxShadow: '0 8px 24px rgba(0,0,0,.1)', minWidth: 120, overflow: 'hidden',
        }}>
          {roles.filter(r => r !== user.role).map(r => {
            const rs = ROLE_CFG[r];
            return (
              <button
                key={r}
                onClick={() => { setOpen(false); onSelect(r); }}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '.5rem .85rem', background: 'none', border: 'none',
                  fontSize: '.68rem', fontWeight: 700, color: rs.color,
                  cursor: 'pointer', transition: 'background .1s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = rs.bg}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                {rs.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
