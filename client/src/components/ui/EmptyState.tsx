import { Inbox } from 'lucide-react';
import type { ReactNode } from 'react';

export function EmptyState({ title = 'Nothing here yet', message, action }: { title?: string; message?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 px-6 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-brand-soft text-brand-300">
        <Inbox className="h-7 w-7" />
      </div>
      <h3 className="text-base font-semibold text-slate-200">{title}</h3>
      {message && <p className="mt-1 max-w-sm text-sm text-slate-400">{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
