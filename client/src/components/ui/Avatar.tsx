import { clsx } from 'clsx';
import { initials } from '../../utils/format';

const GRADIENTS = [
  'from-brand-500 to-violet-500', 'from-cyan-500 to-brand-500',
  'from-violet-500 to-rose-500', 'from-emerald-500 to-cyan-500', 'from-amber-500 to-rose-500',
];

export function Avatar({ name, size = 'md', className }: { name?: string; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizes = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-12 w-12 text-base' };
  const grad = GRADIENTS[(name?.charCodeAt(0) ?? 0) % GRADIENTS.length];
  return (
    <div
      className={clsx(
        'flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-semibold text-white shadow-inner ring-2 ring-white/10',
        grad, sizes[size], className,
      )}
    >
      {initials(name)}
    </div>
  );
}
