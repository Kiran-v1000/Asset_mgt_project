import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { Boxes, X } from 'lucide-react';
import { NAV } from './nav';
import { useAuthStore } from '../../store/authStore';

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const hasPermission = useAuthStore((s) => s.hasPermission);

  const content = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-6 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-brand shadow-glow">
          <Boxes className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold tracking-tight text-white">EAMS</p>
          <p className="text-[10px] uppercase tracking-widest text-slate-500">Asset Platform</p>
        </div>
        <button onClick={onClose} className="ml-auto rounded-lg p-1.5 text-slate-400 hover:bg-white/10 lg:hidden">
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-2">
        {NAV.map((group) => {
          const items = group.items.filter((i) => !i.permission || hasPermission(i.permission));
          if (!items.length) return null;
          return (
            <div key={group.title}>
              <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-600">{group.title}</p>
              <div className="space-y-1">
                {items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onClose}
                    className={({ isActive }) =>
                      clsx(
                        'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                        isActive ? 'text-white' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <motion.div
                            layoutId="nav-active"
                            className="absolute inset-0 rounded-xl bg-gradient-brand-soft ring-1 ring-brand-500/30"
                            transition={{ type: 'spring', damping: 24, stiffness: 320 }}
                          />
                        )}
                        <item.icon className={clsx('relative h-[18px] w-[18px] transition-colors', isActive && 'text-brand-300')} />
                        <span className="relative">{item.label}</span>
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="rounded-xl bg-gradient-brand-soft p-3 ring-1 ring-white/10">
          <p className="text-xs font-semibold text-white">Enterprise Edition</p>
          <p className="mt-0.5 text-[11px] text-slate-400">Full asset lifecycle · RBAC · Audit</p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden w-64 shrink-0 border-r border-white/10 bg-ink-900/50 backdrop-blur-xl lg:block">{content}</aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-ink-950/70 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={onClose}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 w-72 border-r border-white/10 bg-ink-900 lg:hidden"
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            >
              {content}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
