import { BADGES, type Stats } from '../lib/stats'

export function Medals({ stats, fresh }: { stats: Stats; fresh: Set<string> }) {
  const earned = BADGES.filter((b) => b.test(stats)).length
  return (
    <section className="card grid min-w-0 gap-4 px-[clamp(16px,3vw,28px)] py-[22px]" aria-labelledby="h-medals">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2.5">
        <h2 id="h-medals">Médailles</h2>
        <span className="text-sm font-medium text-muted">
          {earned} sur {BADGES.length}
        </span>
      </div>
      <ul className="grid grid-cols-2 gap-x-3 gap-y-[18px] min-[360px]:grid-cols-3 min-[621px]:grid-cols-4 min-[901px]:grid-cols-6">
        {BADGES.map((b) => {
          const on = b.test(stats)
          return (
            <li key={b.id} className="grid content-start justify-items-center gap-1 text-center">
              <span
                aria-hidden="true"
                className={`mb-1 grid size-[58px] place-items-center rounded-full font-display text-lg leading-none font-bold italic ${
                  on
                    ? 'bg-gold-soft text-gold-ink shadow-[inset_0_0_0_2px_var(--gold)]'
                    : 'bg-bg text-muted shadow-[inset_0_0_0_1.5px_var(--line-2)]'
                } ${on && fresh.has(b.id) ? 'medal-new' : ''}`}
              >
                <span>
                  {b.mark}
                  {b.sup && <sup className="text-[.55em]">{b.sup}</sup>}
                </span>
              </span>
              <span className={`text-sm leading-tight font-semibold ${on ? 'text-ink' : 'text-muted'}`}>{b.name}</span>
              <span className={`text-[12.5px] leading-snug text-balance ${on ? 'text-ink-2' : 'text-muted'}`}>{b.desc}</span>
              <span className="sr-only">{on ? 'Obtenue' : 'Pas encore obtenue'}</span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
