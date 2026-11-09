import { num } from '../lib/format'
import { levelInfo, type Stats } from '../lib/stats'

export function Header({ stats }: { stats: Stats }) {
  const L = levelInfo(stats.xp)
  const progress = Math.min(100, ((stats.xp - L.from) / (L.to - L.from)) * 100)

  return (
    <header className="flex flex-wrap items-center justify-between gap-x-5 gap-y-3">
      <div className="flex flex-wrap items-baseline gap-2.5">
        <span className="font-display text-[32px] leading-none font-bold text-accent italic sm:text-[38px]">Do</span>
        <span className="font-display text-2xl leading-none font-medium sm:text-[28px]">absolu</span>
        <span className="font-mono text-xs tracking-wide text-muted">La 440 Hz</span>
      </div>

      <div className="flex min-w-0 items-center gap-3">
        <div className="grid size-[46px] flex-none place-items-center rounded-full bg-gold-soft font-display text-[21px] font-bold text-gold-ink shadow-[inset_0_0_0_2px_var(--gold)]">
          {L.n}
        </div>
        <div className="grid w-[220px] max-w-[60vw] gap-[5px]">
          <div className="truncate text-sm leading-tight font-semibold">
            Niveau {L.n} · {L.name}
          </div>
          <div
            className="h-2 overflow-hidden rounded-full bg-line"
            role="progressbar"
            aria-label="Expérience vers le niveau suivant"
            aria-valuemin={L.from}
            aria-valuemax={L.to}
            aria-valuenow={stats.xp}
          >
            <span
              className="block h-full rounded-full bg-gold transition-[width] duration-[900ms] ease-[cubic-bezier(.2,.8,.2,1)]"
              style={{ width: `${progress.toFixed(1)}%` }}
            />
          </div>
          <div className="font-mono text-[11.5px] text-muted tabular-nums">
            {num.format(stats.xp)} / {num.format(L.to)} XP
          </div>
        </div>
      </div>
    </header>
  )
}
