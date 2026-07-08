import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { notificationAPI } from '../services/api';

function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return m + 'm ago';
  const h = Math.floor(m / 60);
  if (h < 48) return h + 'h ago';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef(null);
  const navigate = useNavigate();

  const refreshCount = useCallback(async () => {
    try {
      const { data } = await notificationAPI.unreadCount();
      setUnread(data.count ?? 0);
    } catch {
      /* ignore */
    }
  }, []);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await notificationAPI.list(40);
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCount();
    const t = setInterval(refreshCount, 60000);
    return () => clearInterval(t);
  }, [refreshCount]);

  useEffect(() => {
    if (!open) return;
    loadList();
    refreshCount();
  }, [open, loadList, refreshCount]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const onItemClick = async (n) => {
    if (!n.read) {
      try {
        await notificationAPI.markRead(n.id);
      } catch {
        /* ignore */
      }
      setUnread((c) => Math.max(0, c - 1));
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    }
    setOpen(false);
    if (n.linkUrl) navigate(n.linkUrl);
  };

  const markAll = async () => {
    try {
      await notificationAPI.markAllRead();
      setUnread(0);
      setItems((prev) => prev.map((x) => ({ ...x, read: true })));
    } catch {
      /* ignore */
    }
  };

  const badge = unread > 99 ? '99+' : String(unread);

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
        title="Notifications"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-amber-600 text-[10px] font-bold text-white">
            {badge}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-[min(100vw-2rem,22rem)] max-h-[min(70vh,24rem)] overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-xl z-[60] flex flex-col"
        >
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-700/80">
            <span className="text-sm font-semibold text-slate-200">Notifications</span>
            {unread > 0 && (
              <button
                type="button"
                onClick={markAll}
                className="text-xs text-amber-500 hover:text-amber-400"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="overflow-y-auto flex-1">
            {loading && items.length === 0 && (
              <p className="px-3 py-6 text-center text-sm text-slate-500">Loading…</p>
            )}
            {!loading && items.length === 0 && (
              <p className="px-3 py-6 text-center text-sm text-slate-500">No notifications yet</p>
            )}
            {items.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => onItemClick(n)}
                className={`w-full text-left px-3 py-2.5 border-b border-slate-800/80 hover:bg-slate-800/60 transition-colors ${
                  !n.read ? 'bg-slate-800/40' : ''
                }`}
              >
                <div className="flex items-start gap-2">
                  {!n.read && <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />}
                  <div className={`min-w-0 flex-1 ${n.read ? 'pl-3.5' : ''}`}>
                    <p className={`text-sm ${!n.read ? 'text-white font-medium' : 'text-slate-300'}`}>{n.title}</p>
                    {n.body && <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{n.body}</p>}
                    <p className="text-[10px] text-slate-500 mt-1">{formatTime(n.createdAt)}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
