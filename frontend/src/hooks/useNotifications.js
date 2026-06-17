import { useState, useEffect, useCallback, useRef } from 'react';
import { notificationApi } from '../api/farmApi';

const BASE_URL = import.meta.env.VITE_API_URL || '';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function useNotifications(user) {
  const [alerts, setAlerts] = useState([]);
  const [unread, setUnread] = useState(0);
  const [panelOpen, setPanelOpen] = useState(false);
  const esRef = useRef(null);

  const loadAlerts = useCallback(async () => {
    if (!user?.access_token) return;
    try {
      const data = await notificationApi.getAlerts();
      setAlerts(data || []);
      setUnread((data || []).filter((a) => !a.is_read).length);
    } catch { /* non-critical */ }
  }, [user]);

  // Initial load
  useEffect(() => { loadAlerts(); }, [loadAlerts]);

  // SSE connection
  useEffect(() => {
    if (!user?.access_token) return;

    let retryTimer = null;

    const connect = () => {
      // Re-read token from localStorage on every connect so refreshed tokens are picked up
      const stored = JSON.parse(sessionStorage.getItem('planto_user') || '{}');
      const token = stored?.access_token;
      if (!token) return;

      const es = new EventSource(`${BASE_URL}/notifications/stream?token=${token}`);
      esRef.current = es;

      es.onmessage = (e) => {
        try {
          const payload = JSON.parse(e.data);
          if (payload.type === 'alert') {
            // Prepend new alert to state without a full reload
            setAlerts((prev) => [
              {
                id: Date.now().toString(),
                type: payload.alert_type,
                title: payload.title,
                message: payload.message,
                action_url: payload.action_url,
                is_read: false,
                created_at: new Date().toISOString(),
              },
              ...prev.slice(0, 49), // keep max 50
            ]);
            setUnread((n) => n + 1);
          }
        } catch { /* ignore malformed events */ }
      };

      es.onerror = () => {
        es.close();
        retryTimer = setTimeout(connect, 5000);
      };
    };

    connect();
    return () => {
      clearTimeout(retryTimer);
      esRef.current?.close();
    };
  }, [user]);

  // Subscribe to Web Push after login
  useEffect(() => {
    if (!user?.access_token || !('serviceWorker' in navigator) || !('PushManager' in window)) return;

    const registerPush = async () => {
      try {
        const { public_key } = await notificationApi.getVapidKey();
        const reg = await navigator.serviceWorker.ready;
        const existing = await reg.pushManager.getSubscription();
        if (existing) {
          await notificationApi.subscribe(existing).catch(() => {});
          return;
        }
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(public_key),
        });
        await notificationApi.subscribe(sub);
      } catch { /* push not supported or permission denied — silent */ }
    };

    registerPush();
  }, [user]);

  const markRead = useCallback(async (id) => {
    await notificationApi.markRead(id).catch(() => {});
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, is_read: true } : a)));
    setUnread((n) => Math.max(0, n - 1));
  }, []);

  const markAllRead = useCallback(async () => {
    await notificationApi.markAllRead().catch(() => {});
    setAlerts((prev) => prev.map((a) => ({ ...a, is_read: true })));
    setUnread(0);
  }, []);

  const deleteAlert = useCallback(async (id) => {
    await notificationApi.deleteAlert(id).catch(() => {});
    setAlerts((prev) => {
      const next = prev.filter((a) => a.id !== id);
      setUnread(next.filter((a) => !a.is_read).length);
      return next;
    });
  }, []);

  return {
    alerts,
    unread,
    panelOpen,
    setPanelOpen,
    markRead,
    markAllRead,
    deleteAlert,
    reload: loadAlerts,
  };
}
