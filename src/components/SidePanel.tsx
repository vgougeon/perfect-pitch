import { useRef, type ChangeEvent } from 'react'
import { GOAL } from '../lib/constants'
import { addDays, dayKey, startOfDay } from '../lib/dates'
import { WD, cap, fDay, num, pct, pl } from '../lib/format'
import type { Stats } from '../lib/stats'

type Props = {
  stats: Stats
  now: number
  onExport: () => void
  onImport: (file: File) => void
}

const CIRC = 2 * Math.PI * 32

export function SidePanel({ stats, now, onExport, onImport }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const t = stats.today
  const p = Math.min(1, t.n / GOAL)
  const left = GOAL - t.n

  const week = Array.from({ length: 7 }, (_, k) => {
    const d = addDays(startOfDay(now), k - 6)
    return { d, on: stats.perDay.has(dayKey(d)), today: k === 6 }
  })

  const streakSub =
    (t.n > 0
      ? 'Série prolongée aujourd’hui.'
      : stats.streak
        ? 'Fais un essai aujourd’hui pour la prolonger.'
        : 'Fais un essai pour lancer ta série.') + (stats.bestStreak > 1 ? ` Record : ${stats.bestStreak} jours.` : '')

  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) onImport(f)
    e.target.value = ''
  }

  return (
    <aside className="card flex min-w-0 flex-col divide-y divide-line" aria-label="Ta progression du jour">
      <div className="grid gap-2.5 px-5 py-[18px]">
        <div className="caps">Objectif du jour</div>
        <div className="flex items-center gap-4">
          <div className="relative size-[76px] flex-none">
            <svg viewBox="0 0 80 80" className="block size-full" aria-hidden="true">
              <circle cx="40" cy="40" r="32" fill="none" stroke="var(--line)" strokeWidth="7" />
              <circle
                cx="40"
                cy="40"
                r="32"
                fill="none"
                stroke={p >= 1 ? 'var(--gold)' : 'var(--accent)'}
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={CIRC}
                strokeDashoffset={CIRC * (1 - p)}
                transform="rotate(-90 40 40)"
                visibility={p > 0 ? 'visible' : 'hidden'}
                className="transition-[stroke-dashoffset] duration-700 ease-[cubic-bezier(.2,.8,.2,1)]"
              />
            </svg>
            <span className="absolute inset-0 grid place-items-center text-lg font-bold">
              {t.n}/{GOAL}
            </span>
          </div>
          <div className="grid min-w-0 gap-1">
            <p className="text-[15px] leading-snug font-semibold">
              {left > 0 ? `Encore ${left} ${pl(left, 'essai', 'essais')} aujourd’hui` : 'Objectif atteint'}
            </p>
            <p className="text-[13px] leading-snug text-muted">
              {t.n
                ? `${t.ok} ${pl(t.ok, 'juste', 'justes')} sur ${t.n} aujourd’hui.${left <= 0 ? ' Chaque essai en plus compte.' : ''}`
                : 'Espace-les dans la journée pour qu’ils rapportent plus.'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-2.5 px-5 py-[18px]">
        <div className="caps">Série</div>
        <p className="flex items-baseline gap-1.5 leading-none">
          <b className="text-[40px] font-bold tracking-tight">{stats.streak}</b>
          <span className="text-[15px] font-medium text-ink-2">{pl(stats.streak, 'jour', 'jours')} d’affilée</span>
        </p>
        <ol className="grid grid-cols-7 gap-1 text-center" aria-label="Les 7 derniers jours">
          {week.map(({ d, on, today }) => (
            <li key={dayKey(d)} className={`grid justify-items-center gap-1 font-mono text-[11px] ${today ? 'font-medium text-ink' : 'text-muted'}`}>
              <i
                className={`size-4 rounded-full ${on ? 'bg-accent' : 'bg-line'} ${today ? 'shadow-[0_0_0_2px_var(--surface),0_0_0_3.5px_var(--ink-2)]' : ''}`}
              />
              {WD[d.getDay()]}
              <span className="sr-only">
                {cap(fDay.format(d))}, {on ? 'pratiqué' : 'pas d’essai'}
              </span>
            </li>
          ))}
        </ol>
        <p className="text-[13px] leading-snug text-muted">{streakSub}</p>
      </div>

      <div className="px-5 py-[18px]">
        <dl className="grid grid-cols-2 gap-x-3 gap-y-3.5">
          <Mini label="Combo en cours" value={`×${stats.combo}`} />
          <Mini label="Meilleur combo" value={`×${stats.bestCombo}`} />
          <Mini label="Essais" value={num.format(stats.total)} />
          <Mini label="Réussite globale" value={stats.total ? pct.format(stats.correct / stats.total) : '–'} />
        </dl>
      </div>

      <div className="grid gap-2 px-5 py-[18px] text-[12.5px] leading-snug text-muted">
        <p>Ton historique est gardé dans ce navigateur. Exporte-le de temps en temps pour ne rien perdre, ou pour le passer sur un autre appareil.</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="chip" onClick={onExport}>
            Exporter
          </button>
          <button type="button" className="chip" onClick={() => fileRef.current?.click()}>
            Importer
          </button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={onFile} />
        </div>
      </div>
    </aside>
  )
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-0.5">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="text-[22px] leading-tight font-bold">{value}</dd>
    </div>
  )
}
