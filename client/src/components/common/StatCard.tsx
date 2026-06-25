import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  accent?: 'brand' | 'cyan' | 'emerald' | 'amber' | 'violet';
  trend?: { value: string; up?: boolean };
  index?: number;
}

const ACCENTS = {
  brand: 'from-brand-500/20 to-brand-500/5 text-brand-300',
  cyan: 'from-cyan-500/20 to-cyan-500/5 text-cyan-300',
  emerald: 'from-emerald-500/20 to-emerald-500/5 text-emerald-300',
  amber: 'from-amber-500/20 to-amber-500/5 text-amber-300',
  violet: 'from-violet-500/20 to-violet-500/5 text-violet-300',
};

export function StatCard({ label, value, icon, accent = 'brand', trend, index = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
      className="card card-hover group relative overflow-hidden p-5"
    >
      <div className={clsx('absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br opacity-60 blur-2xl transition-opacity group-hover:opacity-100', ACCENTS[accent])} />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-white">{value}</p>
          {trend && (
            <p className={clsx('mt-1.5 text-xs font-medium', trend.up ? 'text-emerald-400' : 'text-slate-400')}>
              {trend.up ? '▲' : '•'} {trend.value}
            </p>
          )}
        </div>
        <div className={clsx('flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ring-1 ring-white/10', ACCENTS[accent])}>
          {icon}
        </div>
      </div>
    </motion.div>
  );
}
