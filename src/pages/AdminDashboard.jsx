import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import {
  collection, query, orderBy, limit, onSnapshot,
  doc, updateDoc, deleteDoc, serverTimestamp, setDoc, getDocs, addDoc
} from 'firebase/firestore';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import './AdminDashboard.css';

const AdminDashboard = ({ onNavigate }) => {
  const { user } = useAuth();
  const toast = useToast();
  const [metrics, setMetrics] = useState({ totalRevenue: 0, totalUsers: 0, activeRooms: 0, masterUsers: 0, totalTasks: 0, totalSessions: 0 });
  const [payments, setPayments] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [users, setUsers] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [supportTickets, setSupportTickets] = useState([]);
  const [promoCodes, setPromoCodes] = useState([]);
  const [newPromo, setNewPromo] = useState({ code: '', discount: 10 });
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [broadcast, setBroadcast] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [userSearch, setUserSearch] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState(false);

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

    const unsubTickets = onSnapshot(
      query(collection(db, 'support_tickets'), orderBy('created_at', 'desc')),
      (snap) => {
        setSupportTickets(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }, err => console.warn('tickets:', err.message)
    );

    const unsubSettings = onSnapshot(
      doc(db, 'settings', 'global'),
      (snap) => {
        if (snap.exists()) setIsMaintenance(snap.data().maintenance_active === true);
      }, err => console.warn('settings:', err.message)
    );

    const unsubPromos = onSnapshot(
      collection(db, 'promo_codes'),
      (snap) => {
        setPromoCodes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }, err => console.warn('promos:', err.message)
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

    return () => { unsubPayments(); unsubProfiles(); unsubRooms(); unsubTickets(); unsubSettings(); unsubPromos(); };
  }, []);

  const handleUnlock = async (e) => {
    e.preventDefault();
    if (passcode === '2004') {
      try {
        if (user && user.uid) { 
          // Use setDoc with merge: true to ensure the document is created if it doesn't exist
          await setDoc(doc(db, 'profiles', user.uid), { isAdmin: true }, { merge: true });
        }
        setIsUnlocked(true);
        setPasscodeError(false);
      } catch (err) {
        console.error('Unlock error:', err);
        // Even if profiling fails, unlock the UI
        setIsUnlocked(true);
        toast('Admin status update failed, but access granted.', 'warning');
      }
    } else {
      setPasscodeError(true);
      setPasscode('');
      setTimeout(() => setPasscodeError(false), 2000);
    }
  };

  const handleCreatePromo = async () => {
    if (!newPromo.code || !newPromo.discount) return;
    try {
      console.log('Attempting to create promo with user:', user?.uid);
      await addDoc(collection(db, 'promo_codes'), {
        code: newPromo.code.toUpperCase(),
        discount_pct: Number(newPromo.discount),
        active: true,
        created_at: serverTimestamp()
      });
      toast('Promo code created!', 'success');
      setNewPromo({ code: '', discount: 10 });
    } catch (err) { 
      console.error('PROMO_CREATE_ERROR:', err);
      toast(`Failed: ${err.message || 'Permission denied'}`, 'error'); 
    }
  };

  const handleTogglePromo = async (id, currentStatus) => {
    try {
      await updateDoc(doc(db, 'promo_codes', id), { active: !currentStatus });
      toast('Code status updated.', 'success');
    } catch { toast('Failed to update code.', 'error'); }
  };

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

  const handleToggleMaintenance = async () => {
    try {
      await setDoc(doc(db, 'settings', 'global'), {
        maintenance_active: !isMaintenance
      }, { merge: true });
      toast(isMaintenance ? 'Platform online.' : '🚨 MAINTENANCE MODE ENGAGED.', isMaintenance ? 'success' : 'error');
    } catch { toast('Failed to toggle maintenance mode.', 'error'); }
  };

  const handleResolveTicket = async (id, isResolved) => {
    try {
      await updateDoc(doc(db, 'support_tickets', id), { resolved: isResolved });
      toast('Ticket status updated.', 'success');
    } catch { toast('Failed to update ticket.', 'error'); }
  };

  const filteredUsers = users.filter(u =>
    !userSearch || (u.full_name || '').toLowerCase().includes(userSearch.toLowerCase())
  );

  const convRate = metrics.totalUsers ? ((metrics.masterUsers / metrics.totalUsers) * 100).toFixed(1) : '0.0';



  if (!isUnlocked) {
    return (
      <div className="admin-lock-screen">
        <div className="admin-lock-box">
          <div className="admin-lock-icon">🔒</div>
          <h1 className="admin-lock-title">RESTRICTED ACCESS</h1>
          <p className="admin-lock-subtitle">Enter Owner Authorization Code</p>
          
          <form onSubmit={handleUnlock} className="admin-lock-form">
            <input 
              type="password" 
              className={`admin-passcode-input ${passcodeError ? 'error' : ''}`}
              placeholder="••••"
              maxLength={4}
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              autoFocus
            />
            <button type="submit" className="admin-btn">AUTHORIZE</button>
          </form>

          {passcodeError && <div className="admin-lock-error">ACCESS DENIED</div>}

          <button className="admin-abort-btn" onClick={() => onNavigate('dashboard')}>
            ← Abort & Return
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Hero */}
      <section className="admin-hero">
        <div className="container">
          <div className="admin-title-group" style={{ display: 'flex', alignItems: 'center' }}>
            <div className="admin-status-blink" />
            <h1 className="text-4xl font-serif italic m-0">Owner Command Center</h1>
            <span className="admin-mono text-xs opacity-40 ml-4">SECURE SESSION ACTIVE</span>
            <button 
              className="admin-action-btn ml-auto flex items-center gap-2" 
              style={{ padding: '0.6rem 1.2rem', background: 'rgba(239, 68, 68, 0.1)', borderColor: '#ef4444', color: '#ef4444' }}
              onClick={() => onNavigate('dashboard')}
            >
              <span>← DISCONNECT & RETURN</span>
            </button>
          </div>
          <div className="admin-tabs">
            {['overview', 'users', 'payments', 'rooms', 'promos', 'inbox', 'broadcast'].map(t => (
              <button key={t} className={`admin-tab-btn ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>
                {t === 'inbox' && supportTickets.filter(tkt => !tkt.resolved).length > 0 && <span className="admin-badge-red mr-2">{supportTickets.filter(tkt => !tkt.resolved).length}</span>}
                {t === 'promos' ? 'Promo Codes' : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="container">
        {/* ── Metric Cards (always visible) ── */}
        <div className="admin-metrics-grid">
          {[
            { label: 'Revenue', value: `₹${metrics.totalRevenue}`, trend: 'Platform Total' },
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
                <button className="text-[10px] uppercase font-bold text-primary hover:underline" onClick={() => setActiveTab('payments')}>View All →</button>
              </div>
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead><tr><th>Scholar</th><th>Amount</th><th>Status</th></tr></thead>
                  <tbody>
                    {payments.slice(0, 5).map(pay => (
                      <tr key={pay.id}>
                        <td>
                          <div className="font-bold">{pay.userName || 'Anonymous'}</div>
                          <div className="text-[10px] opacity-50">{pay.userEmail}</div>
                        </td>
                        <td className="font-bold">₹{pay.amount}</td>
                        <td><span className="admin-badge-green">{pay.status}</span></td>
                      </tr>
                    ))}
                    {payments.length === 0 && (
                      <tr><td colSpan="3" className="text-center py-8 opacity-40 italic">Waiting for first transaction...</td></tr>
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

        {/* ── Payments Tab (Detailed View) ── */}
        {activeTab === 'payments' && (
          <div className="admin-panel">
            <div className="admin-panel-header">
              <h2 className="admin-panel-title">Full Payment History</h2>
              <div className="admin-mono text-[10px] opacity-50">{payments.length} TRANSACTIONS</div>
            </div>
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Scholar</th>
                    <th>Email</th>
                    <th>Razorpay ID</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map(pay => (
                    <tr key={pay.id}>
                      <td className="text-xs opacity-60">
                        {pay.timestamp?.seconds 
                          ? new Date(pay.timestamp.seconds * 1000).toLocaleDateString() 
                          : 'Pending'}
                      </td>
                      <td className="font-bold">{pay.userName || 'Scholar'}</td>
                      <td className="text-xs">{pay.userEmail}</td>
                      <td className="admin-mono text-xs opacity-50">{pay.razorpay_payment_id}</td>
                      <td className="font-bold text-primary">₹{pay.amount}</td>
                      <td><span className="admin-badge-green">CAPTURED</span></td>
                    </tr>
                  ))}
                  {payments.length === 0 && (
                    <tr><td colSpan="6" className="text-center py-12 opacity-40 italic">No payments logged yet.</td></tr>
                  )}
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

        {/* ── Promos Tab ── */}
        {activeTab === 'promos' && (
          <div className="admin-panel">
            <div className="admin-panel-header">
              <h2 className="admin-panel-title">Promo Code Manager</h2>
              <span className="admin-mono text-[10px] opacity-50">{promoCodes.length} CODES</span>
            </div>
            
            <div className="mb-8 p-6 bg-[#00000020] border-2 border-black">
              <h3 className="text-xs font-black uppercase mb-4 tracking-tighter">Create New Code</h3>
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="text-[10px] font-bold opacity-60 uppercase block mb-1">Code Name</label>
                  <input 
                    type="text" 
                    className="admin-input uppercase" 
                    placeholder="E.G. SAVE50"
                    value={newPromo.code}
                    onChange={e => setNewPromo(p => ({ ...p, code: e.target.value }))}
                  />
                </div>
                <div className="w-32">
                  <label className="text-[10px] font-bold opacity-60 uppercase block mb-1">Discount %</label>
                  <input 
                    type="number" 
                    className="admin-input" 
                    placeholder="50"
                    value={newPromo.discount}
                    onChange={e => setNewPromo(p => ({ ...p, discount: e.target.value }))}
                  />
                </div>
                <button className="admin-action-btn grant h-[42px]" onClick={handleCreatePromo}>Deploy Code</button>
              </div>
            </div>

            <div className="admin-table-container">
              <table className="admin-table">
                <thead><tr><th>Code</th><th>Discount</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>
                  {promoCodes.map(c => (
                    <tr key={c.id}>
                      <td className="font-bold admin-mono">{c.code}</td>
                      <td className="font-black text-primary">{c.discount_pct}% OFF</td>
                      <td>
                        {c.active ? <span className="admin-badge-green">ACTIVE</span> : <span className="admin-badge-red text-[8px]">INACTIVE</span>}
                      </td>
                      <td>
                        <button 
                          className={`admin-action-btn ${c.active ? 'revoke' : 'grant'}`} 
                          onClick={() => handleTogglePromo(c.id, c.active)}
                        >
                          {c.active ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {promoCodes.length === 0 && <tr><td colSpan="4" className="text-center py-8 opacity-40 italic">No promo codes created yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Inbox Tab ── */}
        {activeTab === 'inbox' && (
          <div className="admin-panel">
            <div className="admin-panel-header">
              <h2 className="admin-panel-title">Support Inbox</h2>
              <span className="admin-mono text-[10px] opacity-50">{supportTickets.filter(t => !t.resolved).length} UNREAD</span>
            </div>
            <div className="admin-feed">
              {supportTickets.map(tkt => (
                <div key={tkt.id} className="admin-feed-item flex-col items-start gap-4">
                  <div className="flex w-full justify-between items-center">
                    <div className="flex items-center gap-2">
                       <span className="font-bold">{tkt.user_name || 'Anonymous'}</span>
                       <span className="admin-mono text-[10px] opacity-50">{tkt.user_email || 'No email'}</span>
                       {tkt.resolved && <span className="admin-badge-green">RESOLVED</span>}
                       {!tkt.resolved && <span className="admin-badge-pro" style={{ background: '#ef444420', color: '#ef4444' }}>ACTION REQUIRED</span>}
                    </div>
                    <span className="feed-time">
                      {tkt.created_at?.seconds ? new Date(tkt.created_at.seconds * 1000).toLocaleString() : 'Just now'}
                    </span>
                  </div>
                  <div className="text-sm opacity-80 pl-2 border-l-2 border-primary">
                    {tkt.message}
                  </div>
                  <button 
                    className={`admin-action-btn ${tkt.resolved ? 'revoke' : 'grant'} mt-2`}
                    onClick={() => handleResolveTicket(tkt.id, !tkt.resolved)}
                  >
                    {tkt.resolved ? 'Mark Unresolved' : 'Mark Resolved'}
                  </button>
                </div>
              ))}
              {supportTickets.length === 0 && <div className="text-center py-8 opacity-40 italic text-sm">Inbox zero. You have no messages.</div>}
            </div>
          </div>
        )}

        {/* ── Broadcast Tab ── */}
        {activeTab === 'broadcast' && (
          <div className="admin-main-grid">
            <div className="admin-panel">
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

            <div className="admin-panel">
               <div className="admin-panel-header">
                  <h2 className="admin-panel-title" style={{ color: '#ef4444' }}>God Mode Controls</h2>
               </div>
               <div className="p-8">
                  <h3 className="font-bold text-lg mb-2">Maintenance Mode</h3>
                  <p className="text-sm opacity-60 mb-6">
                    Activating Maintenance Mode will forcefully disconnect all current users (except Admins) and present them with a cinematic lockdown screen. The platform will be unusable by scholars until disengaged.
                  </p>
                  <button 
                    className={`admin-btn w-full font-bold ${isMaintenance ? 'bg-green-600' : 'bg-red-600'}`} 
                    onClick={handleToggleMaintenance}
                    style={{ background: isMaintenance ? '#10b981' : '#ef4444', color: '#ffffff' }}
                  >
                    {isMaintenance ? '🔓 DISENGAGE MAINTENANCE' : '🚨 ENGAGE MAINTENANCE MODE'}
                  </button>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
