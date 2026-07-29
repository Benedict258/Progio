"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Check, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  user_id: string;
  opportunity_id: string;
  title: string;
  message: string;
  match_score: number | null;
  is_read: boolean;
  created_at: string | null;
  opportunity_title: string | null;
  opportunity_provider: string | null;
}

const API_BASE = "http://localhost:8000";
const USER_ID = "user-001";

export function AlertBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function fetchUnreadCount() {
    try {
      const res = await fetch(`${API_BASE}/api/alerts/unread-count?user_id=${USER_ID}`);
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.count);
      }
    } catch {
      // silently fail — backend may be down
    }
  }

  async function toggleOpen() {
    const next = !open;
    setOpen(next);
    if (next) {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/alerts?user_id=${USER_ID}`);
        if (res.ok) {
          const data = await res.json();
          setNotifications(data);
        }
      } catch {
        // silent
      }
      setLoading(false);
    }
  }

  async function markRead(id: string) {
    try {
      await fetch(`${API_BASE}/api/alerts/notifications/${id}/read`, { method: "PATCH" });
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // silent
    }
  }

  async function markAllRead() {
    try {
      await fetch(`${API_BASE}/api/alerts/notifications/read-all?user_id=${USER_ID}`, { method: "POST" });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {
      // silent
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggleOpen}
        className="relative p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        title="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 text-[10px] font-bold text-white bg-red-500 rounded-full leading-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-96 max-h-[480px] overflow-y-auto bg-white rounded-xl shadow-xl border border-slate-200 z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Mark all read
              </button>
            )}
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm text-slate-500">Loading…</div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell size={24} className="text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {notifications.slice(0, 20).map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    "px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer",
                    !n.is_read && "bg-indigo-50/50"
                  )}
                  onClick={() => markRead(n.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {!n.is_read ? (
                        <div className="w-2 h-2 bg-indigo-500 rounded-full" />
                      ) : (
                        <Check size={12} className="text-slate-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{n.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        {n.match_score != null && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full">
                            {Math.round(n.match_score)}% match
                          </span>
                        )}
                        {n.created_at && (
                          <span className="text-[10px] text-slate-400">
                            {new Date(n.created_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="px-4 py-2.5 border-t border-slate-100 flex justify-center gap-4">
            <a
              href="/grants/alerts"
              onClick={() => setOpen(false)}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
            >
              Grant Alerts
            </a>
            <a
              href="/scholarships/alerts"
              onClick={() => setOpen(false)}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
            >
              Scholarship Alerts
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
