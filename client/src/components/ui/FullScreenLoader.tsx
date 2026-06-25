import { Boxes } from 'lucide-react';

export function FullScreenLoader({ label = 'Loading workspace…' }: { label?: string }) {
  return (
    <div className="flex h-full min-h-[60vh] flex-col items-center justify-center gap-5">
      <div className="relative">
        <div className="absolute inset-0 animate-ping rounded-2xl bg-brand-500/30" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-brand shadow-glow">
          <Boxes className="h-8 w-8 text-white" />
        </div>
      </div>
      <div className="flex flex-col items-center gap-2">
        <div className="h-1 w-40 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-1/2 animate-[shimmer_1.2s_infinite] rounded-full bg-gradient-brand" />
        </div>
        <p className="text-sm text-slate-400">{label}</p>
      </div>
    </div>
  );
}
