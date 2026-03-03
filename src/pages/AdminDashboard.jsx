import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import {
  collection, query, orderBy, limit, onSnapshot, where,
  doc, updateDoc, deleteDoc, serverTimestamp, setDoc, getDocs, addDoc
} from 'firebase/firestore';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import './AdminDashboard.css';

const AdminDashboard = ({ onNavigate }) => {
  const { user } = useAuth();
  const toast = useToast();
  const [metrics, setMetrics] = useState({ 
    totalRevenue: 0, 
    dailyRevenue: 0,
    weeklyRevenue: 0,
    totalUsers: 0, 
    activeRooms: 0, 
    masterUsers: 0, 
    totalTasks: 0, 
    totalSessions: 0,
    liveScholars: 0
  });
  const [payments, setPayments] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [users, setUsers] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [supportTickets, setSupportTickets] = useState([]);
  const [promoCodes, setPromoCodes] = useState([]);
  const [liveActivity, setLiveActivity] = useState([]);
  const [systemLogs, setSystemLogs] = useState([]);
  const [newPromo, setNewPromo] = useState({ code: '', discount: 10 });
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [broadcast, setBroadcast] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [userSearch, setUserSearch] = useState('');
  const [masterSearch, setMasterSearch] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState(false);

  useEffect(() => {
    // 1. Payments & Revenue breakdown
    const unsubPayments = onSnapshot(
      query(collection(db, 'payments'), orderBy('timestamp', 'desc')),
      (snap) => {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setPayments(list);
        
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const weekAgo = today - (7 * 24 * 60 * 60 * 1000);

        const total = list.reduce((a, c) => a + (c.amount || 0), 0);
        const day = list.filter(p => {
          const t = p.timestamp?.toDate?.()?.getTime() || 0;
          return t >= today;
        }).reduce((a, c) => a + (c.amount || 0), 0);
        
        const week = list.filter(p => {
          const t = p.timestamp?.toDate?.()?.getTime() || 0;
          return t >= weekAgo;
        }).reduce((a, c) => a + (c.amount || 0), 0);

        setMetrics(p => ({ ...p, totalRevenue: total, dailyRevenue: day, weeklyRevenue: week }));
      }, err => console.warn('payments:', err.message)
    );

    // 2. Profiles & Recent activity
    const unsubProfiles = onSnapshot(
      query(collection(db, 'profiles')),
      (snap) => {
        const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        const sorted = [...all]
          .filter(u => u.updated_at)
          .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
        
        setUsers(all);
        setRecentUsers(sorted.slice(0, 10));
        setMetrics(p => ({ ...p, totalUsers: snap.size, masterUsers: all.filter(u => u.is_pro).length }));
      }, err => console.warn('profiles:', err.message)
    );

    // 3. Live Activity Monitor
    const twentyMins = new Date(Date.now() - 20 * 60 * 1000);
    const unsubLive = onSnapshot(
      query(collection(db, 'room_members'), where('last_seen', '>=', twentyMins)),
      (snap) => {
        const live = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setLiveActivity(live);
        setMetrics(p => ({ ...p, liveScholars: new Set(live.map(l => l.user_id)).size }));
      }
    );

    // 4. Rooms
    const unsubRooms = onSnapshot(
      query(collection(db, 'study_rooms'), limit(50)),
      (snap) => {
        setRooms(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setMetrics(p => ({ ...p, activeRooms: snap.size }));
      }, err => console.warn('rooms:', err.message)
    );

    // 5. Support Tickets
    const unsubTickets = onSnapshot(
      query(collection(db, 'support_tickets'), orderBy('created_at', 'desc')),
      (snap) => {
        setSupportTickets(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }, err => console.warn('tickets:', err.message)
    );

    // 6. Global Settings
    const unsubSettings = onSnapshot(
      doc(db, 'settings', 'global'),
      (snap) => {
        if (snap.exists()) setIsMaintenance(snap.data().maintenance_active === true);
      }, err => console.warn('settings:', err.message)
    );

    // 7. Promo Codes
    const unsubPromos = onSnapshot(
      collection(db, 'promo_codes'),
      (snap) => {
        setPromoCodes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }, err => console.warn('promos:', err.message)
    );

    // Platform totals (Background)
    const fetchTotals = async () => {
      try {
        const [tasks, notes] = await Promise.all([
          getDocs(query(collection(db, 'tasks'), limit(500))),
          getDocs(query(collection(db, 'notes'), limit(500)))
        ]);
        setMetrics(p => ({ ...p, totalTasks: tasks.size, totalNotes: notes.size }));
      } catch (e) { /* ignore */ }
    };
    fetchTotals();

    return () => { 
      unsubPayments(); unsubProfiles(); unsubRooms(); unsubTickets(); 
      unsubSettings(); unsubPromos(); unsubLive();
    };
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
    if (!newPromo.code) return toast('Protocol Error: Code Name Required', 'error');
    const discountValue = Number(newPromo.discount);
    if (isNaN(discountValue) || discountValue < 0 || discountValue > 100) {
      return toast('Validation Error: Discount must be 0-100%', 'error');
    }

    try {
      await addDoc(collection(db, 'promo_codes'), {
        code: newPromo.code.toUpperCase().trim(),
        discount_pct: discountValue,
        active: true,
        created_at: serverTimestamp()
      });
      toast(`Deployment Successful: ${newPromo.code.toUpperCase()} active.`, 'success');
      setNewPromo({ code: '', discount: 10 });
    } catch (err) { 
      console.error('PROMO_CREATE_ERROR:', err);
      toast(`Deployment Failed: ${err.message}`, 'error'); 
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

  const globalSearchItems = [
    ...users.map(u => ({ type: 'User', name: u.full_name, id: u.id, sub: u.student_type, link: 'users' })),
    ...rooms.map(r => ({ type: 'Room', name: r.name, id: r.id, sub: r.code, link: 'rooms' })),
    ...payments.map(p => ({ type: 'Payment', name: `₹${p.amount} from ${p.userName}`, id: p.id, sub: p.razorpay_payment_id, link: 'payments' }))
  ].filter(item => 
    !masterSearch || 
    (item.name || '').toLowerCase().includes(masterSearch.toLowerCase()) || 
    (item.id || '').toLowerCase().includes(masterSearch.toLowerCase())
  );

  const convRate = metrics.totalUsers ? ((metrics.masterUsers / metrics.totalUsers) * 100).toFixed(1) : '0.0';

  if (!isUnlocked) {
    return (
      <div className="citadel-theme">
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
      </div>
    );
  }

  const earningsPerScholar = metrics.totalUsers ? (metrics.totalRevenue / metrics.totalUsers).toFixed(2) : '0.00';

  return (
    <div className="citadel-theme">
      <div className="citadel-layout">
        {/* ── Sidebar Navigation ── */}
        <aside className="citadel-sidebar">
          <div className="sidebar-brand">
            <h1 className="citadel-title">Command</h1>
            <span className="citadel-version">v2.5</span>
          </div>

          <nav className="sidebar-nav">
            <button
              className={`nav-item ${activeTab === 'overview' ? 'sidebar-active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <span className="icon">📊</span> Overview
            </button>
            <button
              className={`nav-item ${activeTab === 'scholars' ? 'sidebar-active' : ''}`}
              onClick={() => setActiveTab('scholars')}
            >
              <span className="icon">👥</span> Scholars
            </button>
            <button
              className={`nav-item ${activeTab === 'rooms' ? 'sidebar-active' : ''}`}
              onClick={() => setActiveTab('rooms')}
            >
              <span className="icon">🏠</span> Study Rooms
            </button>
            <button
              className={`nav-item ${activeTab === 'promos' ? 'sidebar-active' : ''}`}
              onClick={() => setActiveTab('promos')}
            >
              <span className="icon">🏷️</span> Promo Codes
            </button>
            <button
              className={`nav-item ${activeTab === 'support' ? 'sidebar-active' : ''}`}
              onClick={() => setActiveTab('support')}
            >
              <span className="icon">🎧</span> Support
            </button>
            <button
              className={`nav-item ${activeTab === 'system' ? 'sidebar-active' : ''}`}
              onClick={() => setActiveTab('system')}
            >
              <span className="icon">⚙️</span> System
            </button>
          </nav>

          <div className="sidebar-footer">
            <button className="citadel-btn-main secondary w-full" onClick={() => onNavigate('dashboard')}>
              ← Exit Command
            </button>
          </div>
        </aside>

        {/* ── Main Content Area ── */}
        <main className="citadel-main">
          <header className="citadel-top-bar">
            <div className="search-box">
              <span className="icon">🔍</span>
              <input
                type="text"
                placeholder={`Search in ${activeTab}...`}
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
              />
            </div>
            <div className="top-bar-stats">
              <div className="stat">
                <span className="dot green pulse"></span>
                {metrics.liveScholars} Scholars Live
              </div>
            </div>
          </header>

          <div className="citadel-viewport">
            {activeTab === 'overview' && (
              <div className="section-fade-in">
                <div className="citadel-metrics-summary">
                  <div className="citadel-metric-card">
                    <span className="label">Total Revenue</span>
                    <div className="value">₹{metrics.totalRevenue}</div>
                    <div className="card-bg-icon">💰</div>
                  </div>
                  <div className="citadel-metric-card">
                    <span className="label">Active Scholars</span>
                    <div className="value">{metrics.totalUsers}</div>
                    <div className="card-bg-icon">👥</div>
                  </div>
                  <div className="citadel-metric-card">
                    <span className="label">Pro Deployments</span>
                    <div className="value">{metrics.masterUsers}</div>
                    <div className="card-bg-icon">🛡️</div>
                  </div>
                  <div className="citadel-metric-card">
                    <span className="label">Daily Earnings</span>
                    <div className="value">₹{metrics.dailyRevenue}</div>
                    <div className="card-bg-icon">📈</div>
                  </div>
                </div>

                <div className="admin-panel">
                  <div className="admin-panel-header">
                    <h2 className="admin-panel-title">Platform Intelligence Overview</h2>
                  </div>
                  <div className="p-8 opacity-50 italic text-center">
                    Select a category from the sidebar to manage specific platform operations.
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'scholars' && (
              <div className="section-fade-in">
                <div className="admin-panel">
                  <div className="admin-panel-header">
                    <h2 className="admin-panel-title">Scholar Management</h2>
                  </div>
                  <div className="admin-table-container">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th align="left">SCHOLAR NAME</th>
                          <th align="left">STUDENT TYPE</th>
                          <th align="left">TIER</th>
                          <th align="right">OPERATIONS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map(u => (
                          <tr key={u.id}>
                            <td align="left" className="font-bold">{u.full_name || 'Anonymous'}</td>
                            <td align="left" className="opacity-50 text-xs uppercase">{u.student_type || 'General'}</td>
                            <td align="left">
                              <span className={`citadel-badge ${u.is_pro ? 'pro' : 'free'}`}>
                                {u.is_pro ? 'PRO' : 'FREE'}
                              </span>
                            </td>
                            <td align="right">
                              <div className="flex justify-end gap-2">
                                <button
                                  className={`citadel-action-btn ${u.is_pro ? 'revoke' : 'grant'}`}
                                  onClick={() => handleGrantPro(u.id, !u.is_pro)}
                                >
                                  {u.is_pro ? 'Revoke Pro' : 'Grant Pro'}
                                </button>
                                <button className="citadel-action-btn revoke" onClick={() => console.log('Terminate user', u.id)}>
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'rooms' && (
              <div className="section-fade-in">
                <div className="admin-panel">
                  <div className="admin-panel-header">
                    <h2 className="admin-panel-title">Live Occupancy (Study Rooms)</h2>
                  </div>
                  <div className="citadel-room-grid p-6">
                    {rooms.map(r => {
                      const occupants = liveActivity.filter(l => l.room_id === r.id).length;
                      return (
                        <div key={r.id} className={`citadel-room-status ${occupants > 0 ? 'active' : ''}`}>
                          <div className="room-name">{r.name}</div>
                          <div className="room-occupancy">
                            <span className="dot"></span>
                            {occupants} Active Scholars
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'promos' && (
              <div className="section-fade-in">
                <div className="citadel-promo-layout">
                  <div className="admin-panel">
                    <div className="admin-panel-header">
                      <h2 className="admin-panel-title">Deploy Promo</h2>
                    </div>
                    <div className="p-6">
                      <div className="flex flex-col gap-4">
                        <input
                          className="citadel-input-small w-full"
                          placeholder="PROMO_CODE"
                          value={newPromo.code}
                          onChange={e => setNewPromo({...newPromo, code: e.target.value.toUpperCase()})}
                        />
                        <input
                          type="number"
                          className="citadel-input-small w-full"
                          placeholder="DISCOUNT %"
                          value={newPromo.discount}
                          onChange={e => setNewPromo({...newPromo, discount: e.target.value})}
                        />
                        <button className="citadel-action-btn grant w-full mt-2" onClick={handleCreatePromo}>
                          GENERATE & DEPLOY
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="admin-panel">
                    <div className="admin-panel-header">
                      <h2 className="admin-panel-title">Active Deployments</h2>
                    </div>
                    <div className="admin-table-container">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th align="left">CODE</th>
                            <th align="left">DISCOUNT</th>
                            <th align="center">STATUS</th>
                          </tr>
                        </thead>
                        <tbody>
                          {promoCodes.map(p => (
                            <tr key={p.id}>
                              <td align="left" className="font-bold text-primary">{p.code}</td>
                              <td align="left" className="font-black">{p.discount_pct}% OFF</td>
                              <td align="center">
                                <span className={`citadel-badge ${p.active ? 'pro' : 'free'}`} onClick={() => handleTogglePromo(p.id, p.active)} style={{cursor: 'pointer'}}>
                                  {p.active ? 'ON' : 'OFF'}
                                </span>
                              </td>
                            </tr>
                          ))}
                          {promoCodes.length === 0 && (
                            <tr><td colSpan="3" className="text-center py-20 opacity-30 italic">No promo codes deployed.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'support' && (
              <div className="section-fade-in">
                <div className="admin-panel">
                  <div className="admin-panel-header">
                    <h2 className="admin-panel-title">Support Intelligence</h2>
                  </div>
                  <div className="admin-table-container">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th align="left">SCHOLAR</th>
                          <th align="left">ISSUE</th>
                          <th align="right">ACTION</th>
                        </tr>
                      </thead>
                      <tbody>
                        {supportTickets.map(t => (
                          <tr key={t.id}>
                            <td align="left" className="font-bold">{t.user_name || 'Anonymous'}</td>
                            <td align="left" className="text-sm opacity-50">{t.subject}</td>
                            <td align="right">
                              <button
                                className={`citadel-action-btn ${t.resolved ? 'revoke' : 'grant'}`}
                                onClick={() => handleResolveTicket(t.id, !t.resolved)}
                              >
                                {t.resolved ? 'Reopen' : 'Resolve'}
                              </button>
                            </td>
                          </tr>
                        ))}
                        {supportTickets.length === 0 && (
                          <tr><td colSpan="3" className="text-center py-20 opacity-30 italic">No tickets found.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'system' && (
              <div className="section-fade-in">
                <div className="admin-panel">
                  <div className="admin-panel-header">
                    <h2 className="admin-panel-title">Deployment Controls</h2>
                  </div>
                  <div className="p-6 flex flex-col gap-6">
                    <button
                      className={`citadel-btn-main w-full ${isMaintenance ? 'active' : ''}`}
                      onClick={handleToggleMaintenance}
                    >
                      {isMaintenance ? '🚫 DISENGAGE LOCKDOWN' : '🚨 ENGAGE PLATFORM LOCKDOWN'}
                    </button>
                    <textarea
                      className="citadel-textarea"
                      placeholder="Broadcast to all scholarship terminals..."
                      value={broadcast}
                      onChange={e => setBroadcast(e.target.value)}
                    />
                    <button className="citadel-btn-main secondary w-full" onClick={handleBroadcast}>
                      TRANSMIT BANNER
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
