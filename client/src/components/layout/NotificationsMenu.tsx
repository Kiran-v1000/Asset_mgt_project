import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, ShieldAlert, Clock, FileText, CheckCheck } from 'lucide-react';
import { dashboardApi } from '../../api/dashboardApi';
import { requestApi, assignmentApi } from '../../api/resourceApi';
import { relativeTime, date, daysUntil } from '../../utils/format';
import type { AppNotification } from '../../utils/types';

const ICONS = {
  ALERT: { icon: ShieldAlert, cls: 'bg-rose-500/15 text-rose-300' },
  WARNING: { icon: Clock, cls: 'bg-amber-500/15 text-amber-300' },
  INFO: { icon: FileText, cls: 'bg-brand-500/15 text-brand-300' },
  SUCCESS: { icon: CheckCheck, cls: 'bg-emerald-500/15 text-emerald-300' },
} as const;

export function NotificationsMenu() {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  // Close the dropdown whenever the route changes.
  useEffect(() => { setOpen(false); }, [location.pathname]);

  const { data: overview } = useQuery({ queryKey: ['dashboard', 'overview'], queryFn: dashboardApi.overview });
  const { data: requests } = useQuery({ queryKey: ['requests', 'pending-notif'], queryFn: () => requestApi.list({ status: 'PENDING', limit: 20 }) });
  const { data: assignments } = useQuery({ queryKey: ['assignments', 'active-notif'], queryFn: () => assignmentApi.list({ status: 'ACTIVE', limit: 50 }) });

  const notifications = useMemo<AppNotification[]>(() => {
    const list: AppNotification[] = [];
    for (const w of overview?.expiringWarranties ?? []) {
      const d = daysUntil(w.warrantyExpiry) ?? 0;
      list.push({ id: `warr-${w.id}`, type: d < 15 ? 'ALERT' : 'WARNING', title: 'Warranty expiring', message: `${w.name} — ${d} day(s) left`, link: '/assets', createdAt: w.warrantyExpiry });
    }
    for (const a of assignments?.data ?? []) {
      const d = daysUntil(a.expectedReturnDate);
      if (d !== null && d < 0) list.push({ id: `over-${a.id}`, type: 'ALERT', title: 'Overdue return', message: `${a.asset?.name} held by ${a.employee?.name}`, link: '/assignments', createdAt: a.expectedReturnDate! });
    }
    for (const r of (requests?.data ?? []).slice(0, 6)) {
      list.push({ id: `req-${r.id}`, type: 'INFO', title: 'Request pending approval', message: `${r.requestCode} — ${r.employee?.name ?? 'employee'}`, link: '/requests', createdAt: r.createdAt });
    }
    return list.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 12);
  }, [overview, requests, assignments]);

  const unread = notifications.filter((n) => !readIds.has(n.id)).length;

  const go = (n: AppNotification) => {
    setReadIds((s) => new Set(s).add(n.id));
    if (n.link) navigate(n.link);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} className="relative rounded-xl p-2.5 text-slate-400 hover:bg-white/10">
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-rose px-1 text-[10px] font-bold text-white ring-2 ring-ink-950">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6, scale: 0.97 }}
              className="absolute right-0 z-20 mt-2 w-80 overflow-hidden rounded-2xl border border-white/10 bg-ink-850/95 shadow-card backdrop-blur-xl"
            >
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                <p className="text-sm font-semibold text-white">Notifications</p>
                {unread > 0 && (
                  <button onClick={() => setReadIds(new Set(notifications.map((n) => n.id)))} className="text-xs text-brand-300 hover:text-brand-200">
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto p-1.5">
                {notifications.length ? notifications.map((n) => {
                  const meta = ICONS[n.type];
                  const isRead = readIds.has(n.id);
                  return (
                    <button key={n.id} onClick={() => go(n)} className={`flex w-full items-start gap-3 rounded-xl px-2.5 py-2.5 text-left transition hover:bg-white/5 ${isRead ? 'opacity-55' : ''}`}>
                      <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${meta.cls}`}>
                        <meta.icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-200">{n.title}</p>
                        <p className="truncate text-xs text-slate-400">{n.message}</p>
                        <p className="mt-0.5 text-[11px] text-slate-600">{relativeTime(n.createdAt) === '—' ? date(n.createdAt) : relativeTime(n.createdAt)}</p>
                      </div>
                      {!isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-400" />}
                    </button>
                  );
                }) : (
                  <p className="py-10 text-center text-sm text-slate-500">You're all caught up 🎉</p>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
