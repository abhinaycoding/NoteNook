/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { user, session } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Derive unread count whenever notifications change
  useEffect(() => {
    setUnreadCount(notifications.filter(n => !n.read).length);
  }, [notifications]);

  const getHeaders = useCallback(() => {
    if (!session) return null;
    return {
      'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };
  }, [session]);

  const fetchNotifications = useCallback(async () => {
    if (!user || !session) return;
    
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/notifications?user_id=eq.${user.id}&select=*&order=created_at.desc`;
      const res = await fetch(url, { headers: getHeaders() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      const data = await res.json();
      setNotifications(data || []);
    } catch (err) {
      console.error('Fetch notifications error:', err);
    }
  }, [user, session, getHeaders]);

  useEffect(() => {
    fetchNotifications();
    
    // Simple polling since Supabase Channels cause deadlocks in StrictMode
    const interval = setInterval(fetchNotifications, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const addNotification = async (title, message, type = 'info') => {
    if (!user || !session) return;
    
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/notifications`;
      const payload = {
        user_id: user.id,
        title,
        message,
        type,
        read: false
      };
      
      const res = await fetch(url, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const inserted = await res.json();
      
      if (inserted && inserted.length > 0) {
        setNotifications(prev => [inserted[0], ...prev]);
      }
    } catch (err) {
      console.error('Failed to add notification:', err);
    }
  };

  const markAsRead = async (id) => {
    if (!session) return;
    
    // Optimistic UI update
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/notifications?id=eq.${id}`;
      const headers = getHeaders();
      headers['Prefer'] = 'return=minimal'; // PATCH shouldn't return full row usually
      
      await fetch(url, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ read: true })
      });
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
      // Revert optimistic update on failure
      fetchNotifications();
    }
  };

  const markAllAsRead = async () => {
    if (!session || unreadCount === 0) return;
    
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length === 0) return;
    
    // Optimistic update
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/notifications?user_id=eq.${user.id}&read=eq.false`;
      const headers = getHeaders();
      headers['Prefer'] = 'return=minimal';
      
      await fetch(url, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ read: true })
      });
    } catch (err) {
      console.error('Failed to mark all as read:', err);
      fetchNotifications(); // Revert
    }
  };

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      unreadCount, 
      addNotification, 
      markAsRead, 
      markAllAsRead,
      refreshNotifications: fetchNotifications
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within a NotificationProvider');
  return ctx;
};
