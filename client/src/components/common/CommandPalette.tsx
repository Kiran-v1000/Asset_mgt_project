import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Search, CornerDownLeft, Boxes, Users, Store, ArrowRight, type LucideIcon } from 'lucide-react';
import { assetApi, employeeApi, vendorApi } from '../../api/resourceApi';
import { NAV } from '../layout/nav';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';

interface Item {
  id: string;
  label: string;
  sub?: string;
  to: string;
  group: string;
  icon: LucideIcon;
}

export function CommandPalette() {
  const navigate = useNavigate();
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const open = useUIStore((s) => s.commandOpen);
  const setOpen = useUIStore((s) => s.setCommandOpen);
  const toggle = useUIStore((s) => s.toggleCommand);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);

  // Global ⌘K / Ctrl+K
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        toggle();
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggle, setOpen]);

  useEffect(() => { if (open) { setQuery(''); setActive(0); } }, [open]);

  const enabled = open && query.trim().length > 0;
  const { data: assets } = useQuery({ queryKey: ['cmd', 'assets', query], queryFn: () => assetApi.list({ search: query, limit: 5 }), enabled });
  const { data: employees } = useQuery({ queryKey: ['cmd', 'employees', query], queryFn: () => employeeApi.list({ search: query, limit: 4 }), enabled });
  const { data: vendors } = useQuery({ queryKey: ['cmd', 'vendors', query], queryFn: () => vendorApi.list({ search: query, limit: 3 }), enabled });

  const navItems: Item[] = useMemo(
    () =>
      NAV.flatMap((g) => g.items)
        .filter((i) => !i.permission || hasPermission(i.permission))
        .filter((i) => i.label.toLowerCase().includes(query.toLowerCase()))
        .map((i) => ({ id: `nav-${i.to}`, label: i.label, to: i.to, group: 'Navigate', icon: i.icon })),
    [query, hasPermission],
  );

  const items: Item[] = useMemo(() => {
    const a: Item[] = (assets?.data ?? []).map((x) => ({ id: x.id, label: x.name, sub: x.assetCode, to: '/assets', group: 'Assets', icon: Boxes }));
    const e: Item[] = (employees?.data ?? []).map((x) => ({ id: x.id, label: x.name, sub: x.employeeCode, to: '/employees', group: 'Employees', icon: Users }));
    const v: Item[] = (vendors?.data ?? []).map((x) => ({ id: x.id, label: x.vendorName, sub: x.code, to: '/vendors', group: 'Vendors', icon: Store }));
    return [...navItems.slice(0, 6), ...a, ...e, ...v];
  }, [navItems, assets, employees, vendors]);

  useEffect(() => { setActive(0); }, [items.length]);

  const select = (item?: Item) => {
    const target = item ?? items[active];
    if (!target) return;
    navigate(target.to);
    setOpen(false);
  };

  const onListKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(i + 1, items.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
    if (e.key === 'Enter') { e.preventDefault(); select(); }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[12vh]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-ink-850/95 shadow-card backdrop-blur-xl gradient-border"
            onKeyDown={onListKey}
          >
            <div className="flex items-center gap-3 border-b border-white/10 px-4">
              <Search className="h-4 w-4 text-slate-500" />
              <input
                autoFocus value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder="Search assets, people, vendors or jump to a page…"
                className="w-full bg-transparent py-4 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
              />
              <kbd className="hidden rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-400 ring-1 ring-white/10 sm:block">ESC</kbd>
            </div>

            <div className="max-h-80 overflow-y-auto p-2">
              {items.length === 0 ? (
                <p className="py-10 text-center text-sm text-slate-500">
                  {query ? 'No matches found.' : 'Start typing to search across the platform.'}
                </p>
              ) : (
                items.map((item, i) => (
                  <button
                    key={`${item.group}-${item.id}`}
                    onClick={() => select(item)}
                    onMouseEnter={() => setActive(i)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${i === active ? 'bg-gradient-brand-soft ring-1 ring-brand-500/30' : 'hover:bg-white/5'}`}
                  >
                    <item.icon className={`h-4 w-4 shrink-0 ${i === active ? 'text-brand-300' : 'text-slate-400'}`} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-slate-100">{item.label}</p>
                      {item.sub && <p className="truncate font-mono text-xs text-slate-500">{item.sub}</p>}
                    </div>
                    <span className="text-[10px] uppercase tracking-wide text-slate-600">{item.group}</span>
                    {i === active && <CornerDownLeft className="h-3.5 w-3.5 text-brand-300" />}
                  </button>
                ))
              )}
            </div>

            <div className="flex items-center justify-between border-t border-white/10 px-4 py-2 text-[11px] text-slate-500">
              <span className="flex items-center gap-1"><ArrowRight className="h-3 w-3" /> Enter to open</span>
              <span>↑↓ to navigate</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
