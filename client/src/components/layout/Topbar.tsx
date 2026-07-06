import { useState } from 'react';
import { Menu, Search, LogOut, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { Avatar } from '../ui/Avatar';
import { NotificationsMenu } from './NotificationsMenu';

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const openCommand = useUIStore((s) => s.setCommandOpen);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-white/10 bg-ink-950/70 px-4 backdrop-blur-xl sm:px-6">
      <button onClick={onMenu} className="rounded-lg p-2 text-slate-400 hover:bg-white/10 lg:hidden">
        <Menu className="h-5 w-5" />
      </button>

      <button
        onClick={() => openCommand(true)}
        className="group relative hidden max-w-md flex-1 items-center gap-2 rounded-xl border border-white/10 bg-ink-900/60 py-2 pl-10 pr-3 text-left text-sm text-slate-500 transition hover:border-brand-500/40 sm:flex"
      >
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <span className="flex-1">Search assets, people, vendors…</span>
        <kbd className="rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-400 ring-1 ring-white/10">⌘K</kbd>
      </button>

      <div className="ml-auto flex items-center gap-2">
        <button onClick={() => openCommand(true)} className="rounded-xl p-2.5 text-slate-400 hover:bg-white/10 sm:hidden">
          <Search className="h-5 w-5" />
        </button>
        <NotificationsMenu />

        <div className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2 rounded-xl p-1.5 pr-2 hover:bg-white/10"
          >
            <Avatar name={user?.name} size="sm" />
            <div className="hidden text-left sm:block">
              <p className="text-sm font-medium leading-tight text-white">{user?.name}</p>
              <p className="text-[11px] leading-tight text-slate-400">{user?.role?.name}</p>
            </div>
            <ChevronDown className="hidden h-4 w-4 text-slate-400 sm:block" />
          </button>

          <AnimatePresence>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.97 }}
                  className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-2xl border border-white/10 bg-ink-850/95 p-1.5 shadow-card backdrop-blur-xl"
                >
                  <div className="border-b border-white/10 px-3 py-2.5">
                    <p className="text-sm font-medium text-white">{user?.name}</p>
                    <p className="truncate text-xs text-slate-400">{user?.email}</p>
                  </div>
                  <button
                    onClick={() => logout()}
                    className="mt-1 flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-rose-300 hover:bg-rose-500/10"
                  >
                    <LogOut className="h-4 w-4" /> Sign out
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
