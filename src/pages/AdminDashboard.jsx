import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
  where
} from 'firebase/firestore';
import { useToast } from '../contexts/ToastContext';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const toast = useToast();
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    totalUsers: 0,
    activeRooms: 0,
    masterUsers: 0
  });
  const [payments, setPayments] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [broadcast, setBroadcast] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Fetch Real-time Payments & Revenue
    const qPayments = query(collection(db, 'payments'), orderBy('timestamp', 'desc'), limit(10));
    const unsubPayments = onSnapshot(qPayments, (snapshot) => {
      const payList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPayments(payList);
      const total = payList.reduce((acc, curr) => acc + (curr.amount || 0), 0);
      setMetrics(prev => ({ ...prev, totalRevenue: total }));
    }, (err) => { console.warn('Payments read error:', err.message); });

    // 2. Fetch User Stats
    const qProfiles = query(collection(db, 'profiles'));
    const unsubProfiles = onSnapshot(qProfiles, (snapshot) => {
      const masterCount = snapshot.docs.filter(doc => doc.data().is_pro).length;
      setMetrics(prev => ({ ...prev, totalUsers: snapshot.size, masterUsers: masterCount }));
    }, (err) => { console.warn('Profiles read error:', err.message); });

    // 3. Fetch Active Rooms (no orderBy to avoid index requirement)
    const qRooms = query(collection(db, 'study_rooms'), limit(10));
    const unsubRooms = onSnapshot(qRooms, (snapshot) => {
      const roomList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRooms(roomList);
      setMetrics(prev => ({ ...prev, activeRooms: snapshot.size }));
      setLoading(false);
    }, (err) => { console.warn('Rooms read error:', err.message); setLoading(false); });

    return () => { unsubPayments(); unsubProfiles(); unsubRooms(); };
  }, []);

  const handleSendBroadcast = async () => {
    if (!broadcast.trim()) return;
    try {
      // In a real app, this would update a 'globals' collection that triggers a banner in Layout.jsx
      await updateDoc(doc(db, 'settings', 'global'), {
        announcement: broadcast,
        announcement_at: serverTimestamp(),
        announcement_active: true
      });
      toast('Broadcast sent to all users!', 'success');
      setBroadcast('');
    } catch (err) {
      toast('Failed to send broadcast. Ensure "settings/global" exists.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="admin-dashboard flex items-center justify-center">
        <div className="admin-status-blink" />
        <span className="ml-4 admin-mono">INITIALIZING COMMAND CENTER...</span>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <section className="admin-hero">
        <div className="container">
          <div className="admin-title-group">
            <div className="admin-status-blink" />
            <h1 className="text-4xl font-serif italic">Owner Command Center</h1>
            <span className="admin-mono text-xs opacity-40 ml-auto">v1.0.4 - SECURE ENCRYPTED SESSION</span>
          </div>
        </div>
      </section>

      <div className="container">
        {/* ── Metric Cards ── */}
        <div className="admin-metrics-grid">
          <div className="admin-metric-card">
            <span className="admin-metric-label">Processed Revenue</span>
            <div className="admin-metric-value text-primary">₹{metrics.totalRevenue}</div>
            <div className="admin-metric-trend trend-up">↑ 100% (Launch Phase)</div>
          </div>
          <div className="admin-metric-card">
            <span className="admin-metric-label">Scholars Enrolled</span>
            <div className="admin-metric-value">{metrics.totalUsers}</div>
            <div className="admin-metric-trend">Total Profiles in Ledger</div>
          </div>
          <div className="admin-metric-card">
            <span className="admin-metric-label">Master Conversions</span>
            <div className="admin-metric-value">{metrics.masterUsers}</div>
            <div className="admin-metric-trend trend-up">
              {((metrics.masterUsers / metrics.totalUsers) * 100 || 0).toFixed(1)}% Conversion rate
            </div>
          </div>
          <div className="admin-metric-card">
            <span className="admin-metric-label">Active Rooms</span>
            <div className="admin-metric-value">{metrics.activeRooms}</div>
            <div className="admin-metric-trend">Live Sync Sessions</div>
          </div>
        </div>

        <div className="admin-main-grid">
          {/* ── Payments Feed ── */}
          <div className="admin-panel">
            <div className="admin-panel-header">
              <h2 className="admin-panel-title">Recent Transactions</h2>
              <span className="admin-mono text-[10px] opacity-50">AUDIT LOG</span>
            </div>
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Scholar</th>
                    <th>Payment ID</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map(pay => (
                    <tr key={pay.id}>
                      <td>
                        <div className="font-bold">{pay.userName || 'Anonymous'}</div>
                        <div className="text-[10px] opacity-50">{pay.userEmail}</div>
                      </td>
                      <td className="admin-mono text-xs">{pay.razorpay_payment_id}</td>
                      <td className="font-bold">₹{pay.amount}</td>
                      <td>
                        <span className="px-2 py-0.5 bg-green-500/10 text-green-500 text-[10px] font-bold uppercase rounded">
                          {pay.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {payments.length === 0 && (
                    <tr>
                      <td colSpan="4" className="text-center py-8 opacity-40 italic">Waiting for first transaction...</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-col gap-8">
            {/* ── Global Broadcast ── */}
            <div className="admin-panel">
              <div className="admin-panel-header">
                <h2 className="admin-panel-title">Manifesto Broadcast</h2>
              </div>
              <div className="admin-broadcast-area">
                <div className="admin-input-group">
                  <label>System-wide Announcement</label>
                  <textarea 
                    className="admin-textarea"
                    placeholder="Enter message for all scholars..."
                    rows="3"
                    value={broadcast}
                    onChange={(e) => setBroadcast(e.target.value)}
                  />
                </div>
                <button className="admin-btn" onClick={handleSendBroadcast}>
                  Transmit Signal
                </button>
              </div>
            </div>

            {/* ── Active Rooms ── */}
            <div className="admin-panel flex-1">
              <div className="admin-panel-header">
                <h2 className="admin-panel-title">Room Monitor</h2>
              </div>
              <div className="admin-feed">
                {rooms.map(room => (
                  <div key={room.id} className="admin-feed-item">
                    <span className="feed-time">[{new Date(room.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}]</span>
                    <div>
                      <span className="font-bold">{room.name}</span>
                      <span className="mx-2 opacity-30">/</span>
                      <span className="admin-mono text-[10px] opacity-60">CODE: {room.code}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
