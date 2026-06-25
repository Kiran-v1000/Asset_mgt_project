import { clsx } from 'clsx';
import { STATUS_STYLES } from '../../utils/constants';
import { titleCase } from '../../utils/format';

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span className={clsx('chip', STATUS_STYLES[status] ?? 'bg-white/10 text-slate-300 ring-1 ring-white/10', className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {titleCase(status)}
    </span>
  );
}

export function Tag({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={clsx('chip bg-white/5 text-slate-300 ring-1 ring-white/10', className)}>{children}</span>;
}
