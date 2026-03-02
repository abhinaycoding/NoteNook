import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import {
  collection, query, orderBy, limit, onSnapshot,
  doc, updateDoc, deleteDoc, serverTimestamp, setDoc, getDocs
} from 'firebase/firestore';
import { useToast } from '../contexts/ToastContext';
import './AdminDashboard.css';

const AdminDashboard = ({ onNavigate }) => {
  const toast = useToast();
  const [metrics, setMetrics] = useState({ totalRevenue: 0, totalUsers: 0, activeRooms: 0, masterUsers: 0, totalTasks: 0, totalSessions: 0 });
  const [payments, setPayments] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [users, setUsers] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [broadcast, setBroadcast] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [userSearch, setUserSearch] = useState('');

  useEffect(() => {
    const unsubPayments = onSnapshot(
      query(collection(db, 'payments'), orderBy('timestamp', 'desc'), limit(20)),
      (snap) => {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setPayments(list);
        setMetrics(p => ({ ...p, totalRevenue: list.reduce((a, c) => a + (c.amount || 0), 0) }));
      }, err => console.warn('payments:', err.message)
    );

    const unsubProfiles = onSnapshot(
      query(collection(db, 'profiles')),
      (snap) => {
        const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        const sorted = [...all].sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || ''));
        setUsers(all);
        setRecentUsers(sorted.slice(0, 8));
        setMetrics(p => ({ ...p, totalUsers: snap.size, masterUsers: all.filter(u => u.is_pro).length }));
      }, err => console.warn('profiles:', err.message)
    );

    const unsubRooms = onSnapshot(
      query(collection(db, 'study_rooms'), limit(20)),
      (snap) => {
        setRooms(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setMetrics(p => ({ ...p, activeRooms: snap.size }));
      }, err => console.warn('rooms:', err.message)
    );

    // Platform stats
    const fetchStats = async () => {
      try {
        const [tasks, sessions] = await Promise.all([
          getDocs(query(collection(db, 'tasks'), limit(1000))),
          getDocs(query(collection(db, 'sessions'), limit(1000)))
        ]);
        setMetrics(p => ({ ...p, totalTasks: tasks.size, totalSessions: sessions.size }));
      } catch (e) { /* silent */ }
    };
    fetchStats();

    return () => { unsubPayments(); unsubProfiles(); unsubRooms(); };
  }, []);

  const handleGrantPro = async (userId, grant) => {
    try {
      await updateDoc(doc(db, 'profiles', userId), { is_pro: grant });
      toast(grant ? '✅ Pro granted!' : '❌ Pro revoked.', grant ? 'success' : 'info');
    } catch { toast('Failed to update user.', 'error'); }
  };

  const handleDeleteRoom = async (roomId) => {
    if (!window.confirm('Delete this room permanently?')) return;
    try {
      await deleteDoc(doc(db, 'study_rooms', roomId));
      toast('Room deleted.', 'success');
    } catch { toast('Failed to delete room.', 'error'); }
  };

  const handleBroadcast = async () => {
    if (!broadcast.trim()) return;
    try {
      await setDoc(doc(db, 'settings', 'global'), {
        announcement: broadcast,
        announcement_at: serverTimestamp(),
        announcement_active: true
      }, { merge: true });
      toast('Broadcast sent!', 'success');
      setBroadcast('');
    } catch { toast('Failed. Create settings/global doc first.', 'error'); }
  };

  const filteredUsers = users.filter(u =>
    !userSearch || (u.full_name || '').toLowerCase().includes(userSearch.toLowerCase())
  );

  const convRate = metrics.totalUsers ? ((metrics.masterUsers / metrics.totalUsers) * 100).toFixed(1) : '0.0';

  return (
    <div className="admin-dashboard">
      {/* Hero */}
      <section className="admin-hero">
        <div className="container">
          <div className="admin-title-group">
            <div className="admin-status-blink" />
            <h1 className="text-4xl font-serif italic">Owner Command Center</h1>
            <span className="admin-mono text-xs opacity-40 ml-auto">SECURE SESSION ACTIVE</span>
          </div>
          <div className="admin-tabs">
            {['overview', 'users', 'rooms', 'broadcast'].map(t => (
              <button key={t} className={`admin-tab-btn ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="container">
        {/* ── Metric Cards (always visible) ── */}
        <div className="admin-metrics-grid">
          {[
            { label: 'Revenue', value: `₹${metrics.totalRevenue}`, trend: 'Launch Phase ↑' },
            { label: 'Scholars', value: metrics.totalUsers, trend: 'Total Enrolled' },
            { label: 'Master Users', value: metrics.masterUsers, trend: `${convRate}% Conversion` },
            { label: 'Active Rooms', value: metrics.activeRooms, trend: 'Live Sessions' },
            { label: 'Total Tasks', value: metrics.totalTasks, trend: 'Across Platform' },
            { label: 'Focus Sessions', value: metrics.totalSessions, trend: 'Logged' },
          ].map(m => (
            <div key={m.label} className="admin-metric-card">
              <span className="admin-metric-label">{m.label}</span>
              <div className="admin-metric-value">{m.value}</div>
              <div className="admin-metric-trend">{m.trend}</div>
            </div>
          ))}
        </div>

        {/* ── Overview Tab ── */}
        {activeTab === 'overview' && (
          <div className="admin-main-grid">
            {/* Recent Transactions */}
            <div className="admin-panel">
              <div className="admin-panel-header">
                <h2 className="admin-panel-title">Recent Transactions</h2>
                <span className="admin-mono text-[10px] opacity-50">AUDIT LOG</span>
              </div>
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead><tr><th>Scholar</th><th>Payment ID</th><th>Amount</th><th>Status</th></tr></thead>
                  <tbody>
                    {payments.map(pay => (
                      <tr key={pay.id}>
                        <td>
                          <div className="font-bold">{pay.userName || 'Anonymous'}</div>
                          <div className="text-[10px] opacity-50">{pay.userEmail}</div>
                        </td>
                        <td className="admin-mono text-xs">{pay.razorpay_payment_id}</td>
                        <td className="font-bold">₹{pay.amount}</td>
                        <td><span className="admin-badge-green">{pay.status}</span></td>
                      </tr>
                    ))}
                    {payments.length === 0 && (
                      <tr><td colSpan="4" className="text-center py-8 opacity-40 italic">Waiting for first transaction...</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Sign-ups */}
            <div className="admin-panel">
              <div className="admin-panel-header">
                <h2 className="admin-panel-title">Recent Sign-ups</h2>
                <span className="admin-mono text-[10px] opacity-50">NEW SCHOLARS</span>
              </div>
              <div className="admin-feed">
                {recentUsers.map(u => (
                  <div key={u.id} className="admin-feed-item">
                    <div className="admin-avatar">{(u.full_name || '?')[0]}</div>
                    <div className="flex-1">
                      <div className="font-bold text-sm">{u.full_name}</div>
                      <div className="text-[10px] opacity-50">{u.student_type}</div>
                    </div>
                    {u.is_pro && <span className="admin-badge-pro">PRO</span>}
                  </div>
                ))}
                {recentUsers.length === 0 && <div className="text-center py-8 opacity-40 italic text-sm">No scholars yet.</div>}
              </div>
            </div>
          </div>
        )}

        {/* ── Users Tab ── */}
        {activeTab === 'users' && (
          <div className="admin-panel">
            <div className="admin-panel-header">
              <h2 className="admin-panel-title">User Management</h2>
              <input
                className="admin-search"
                placeholder="Search by name..."
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
              />
            </div>
            <div className="admin-table-container">
              <table className="admin-table">
                <thead><tr><th>Name</th><th>Type</th><th>Plan</th><th>Action</th></tr></thead>
                <tbody>
                  {filteredUsers.map(u => (
                    <tr key={u.id}>
                      <td className="font-bold">{u.full_name || 'Unknown'}</td>
                      <td className="text-xs opacity-60">{u.student_type || '—'}</td>
                      <td>{u.is_pro ? <span className="admin-badge-pro">MASTER</span> : <span className="admin-badge-free">SCHOLAR</span>}</td>
                      <td>
                        <button
                          className={`admin-action-btn ${u.is_pro ? 'revoke' : 'grant'}`}
                          onClick={() => handleGrantPro(u.id, !u.is_pro)}
                        >
                          {u.is_pro ? 'Revoke Pro' : 'Grant Pro'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Rooms Tab ── */}
        {activeTab === 'rooms' && (
          <div className="admin-panel">
            <div className="admin-panel-header">
              <h2 className="admin-panel-title">Room Monitor</h2>
              <span className="admin-mono text-[10px] opacity-50">{rooms.length} ACTIVE</span>
            </div>
            <div className="admin-table-container">
              <table className="admin-table">
                <thead><tr><th>Room Name</th><th>Code</th><th>Type</th><th>Action</th></tr></thead>
                <tbody>
                  {rooms.map(r => (
                    <tr key={r.id}>
                      <td className="font-bold">{r.name}</td>
                      <td className="admin-mono text-xs">{r.code}</td>
                      <td className="text-xs opacity-60 capitalize">{r.type || 'standard'}</td>
                      <td>
                        <button className="admin-action-btn revoke" onClick={() => handleDeleteRoom(r.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                  {rooms.length === 0 && <tr><td colSpan="4" className="text-center py-8 opacity-40 italic">No active rooms.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Broadcast Tab ── */}
        {activeTab === 'broadcast' && (
          <div className="admin-panel" style={{ maxWidth: '600px' }}>
            <div className="admin-panel-header">
              <h2 className="admin-panel-title">Manifesto Broadcast</h2>
            </div>
            <div className="admin-broadcast-area">
              <div className="admin-input-group">
                <label>System-wide Announcement</label>
                <textarea
                  className="admin-textarea" rows="4"
                  placeholder="Type your message to all scholars..."
                  value={broadcast}
                  onChange={e => setBroadcast(e.target.value)}
                />
              </div>
              <button className="admin-btn" onClick={handleBroadcast}>⚡ Transmit to All Scholars</button>
              <p className="text-xs opacity-40 mt-3">Message will appear as a banner on all users' dashboards.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
