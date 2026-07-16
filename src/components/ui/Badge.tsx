type Tone = 'emerald' | 'amber' | 'sky' | 'slate' | 'red';

const tones: Record<Tone, string> = {
  emerald: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  amber: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  sky: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  slate: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
  red: 'bg-red-500/15 text-red-400 border-red-500/30',
};

export function Badge({ tone = 'slate', children }: { tone?: Tone; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}
