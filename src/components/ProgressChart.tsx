import { useEffect, useMemo, useRef, useState } from 'react'
import { addDays, dayKey, startOfDay, startOfWeek } from '../lib/dates'
import { WD, cap, fDM, fDay, fMonth, pct, pl } from '../lib/format'
import type { Attempt, Range } from '../lib/types'
import { useWidth } from '../lib/hooks'
import { Segmented } from './Segmented'

type Row = { key: string; start: Date; n: number; ok: number; v: number | null }

const H = 240
const M = { l: 46, r: 8, t: 26, b: 46 }
// Données d'exemple affichées tant qu'il n'y a aucun essai
const EX_DAY = [null, 0.2, 0.4, null, 0.4, 0.6, 0.4, 0.6, null, 0.6, 0.8, 0.6, 0.8, 0.8]
const EX_WEEK = [0.2, 0.28, 0.35, 0.33, 0.42, 0.5, 0.48, 0.55, 0.6, 0.58, 0.66, 0.72]

function buildRows(attempts: Attempt[], range: Range, now: number, example: boolean): Row[] {
  const rows: Row[] = []
  if (range === 'week') {
    const w0 = startOfWeek(now)
    for (let i = 11; i >= 0; i--) {
      const s = addDays(w0, -7 * i)
      rows.push({ key: dayKey(s), start: s, n: 0, ok: 0, v: null })
    }
  } else {
    const d0 = startOfDay(now)
    for (let i = 13; i >= 0; i--) {
      const s = addDays(d0, -i)
      rows.push({ key: dayKey(s), start: s, n: 0, ok: 0, v: null })
    }
  }
  if (example) {
    const ex = range === 'week' ? EX_WEEK : EX_DAY
    rows.forEach((r, i) => {
      r.v = ex[i]
      r.n = ex[i] == null ? 0 : 5
    })
    return rows
  }
  const idx = new Map(rows.map((r) => [r.key, r]))
  for (const a of attempts) {
    const r = idx.get(range === 'week' ? dayKey(startOfWeek(a.t)) : dayKey(a.t))
    if (r) {
      r.n++
      if (a.ok) r.ok++
    }
  }
  rows.forEach((r) => (r.v = r.n ? r.ok / r.n : null))
  return rows
}

function barPath(x: number, y: number, w: number, h: number, r: number) {
  r = Math.min(r, w / 2, h)
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`
}

type Props = {
  attempts: Attempt[]
  range: Range
  now: number
  onRange: (r: Range) => void
}

export function ProgressChart({ attempts, range, now, onRange }: Props) {
  const boxRef = useRef<HTMLDivElement>(null)
  const W = Math.max(260, useWidth(boxRef, 600))
  const [hover, setHover] = useState<number | null>(null)
  const example = attempts.length === 0
  const rows = useMemo(() => buildRows(attempts, range, now, example), [attempts, range, now, example])

  useEffect(() => setHover(null), [range, W])
  useEffect(() => {
    const off = (e: PointerEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setHover(null)
    }
    document.addEventListener('pointerdown', off)
    return () => document.removeEventListener('pointerdown', off)
  }, [])

  const iw = W - M.l - M.r
  const ih = H - M.t - M.b
  const slot = iw / rows.length
  const bw = Math.min(24, Math.max(6, slot * 0.58))
  const y = (v: number) => M.t + ih * (1 - v)
  let lastIdx = -1
  rows.forEach((r, i) => {
    if (r.v != null) lastIdx = i
  })

  const label = (r: Row) => (range === 'week' ? `Semaine du ${fDM.format(r.start)}` : cap(fDay.format(r.start)))
  const hv = hover != null ? rows[hover] : null

  return (
    <section className="card grid min-w-0 gap-4 px-[clamp(16px,3vw,28px)] py-[22px]" aria-labelledby="h-prog">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2.5">
        <h2 id="h-prog">Taux de réussite</h2>
        <Segmented
          label="Regrouper par"
          options={[
            { value: 'day' as Range, label: 'Jours' },
            { value: 'week' as Range, label: 'Semaines' },
          ]}
          value={range}
          onChange={onRange}
        />
      </div>

      <Summary attempts={attempts} range={range} now={now} />

      <div ref={boxRef} className="relative w-full min-w-0">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width={W}
          height={H}
          role="img"
          aria-label={
            example
              ? 'Exemple de graphique, aucun essai pour l’instant'
              : `Taux de réussite par ${range === 'week' ? 'semaine, 12 dernières semaines' : 'jour, 14 derniers jours'}`
          }
          className="block h-auto w-full touch-pan-y overflow-visible"
          onPointerLeave={(e) => {
            if (e.pointerType === 'mouse') setHover(null)
          }}
        >
          {[0, 0.25, 0.5, 0.75, 1].map((v) => {
            const yy = Math.round(y(v)) + 0.5
            return <line key={v} x1={M.l} x2={W - M.r} y1={yy} y2={yy} stroke={v === 0 ? 'var(--axis)' : 'var(--grid)'} strokeWidth={1} />
          })}
          {[0, 0.5, 1].map((v) => (
            <text key={v} x={M.l - 8} y={y(v) + 4} textAnchor="end" className="fill-muted font-mono text-[11px] tabular-nums">
              {Math.round(v * 100)} %
            </text>
          ))}

          {hover != null && <rect x={M.l + slot * hover} y={M.t} width={slot} height={ih} fill="var(--line)" opacity={0.55} />}

          {rows.map((r, i) => {
            if (r.v == null) return null
            const x = M.l + slot * (i + 0.5) - bw / 2
            const h = ih * r.v
            const fill = example ? 'var(--muted)' : 'var(--accent)'
            const op = example ? 0.28 : 1
            return h < 3 ? (
              <rect key={r.key} x={x} y={y(0) - 3} width={bw} height={3} rx={1} fill={fill} opacity={example ? op : 0.6} />
            ) : (
              <path key={r.key} d={barPath(x, y(r.v), bw, h, 4)} fill={fill} opacity={op} />
            )
          })}

          {rows.map((r, i) => {
            const cx = M.l + slot * (i + 0.5)
            const cur = i === rows.length - 1
            const d = r.start
            let l1: string | number
            let l2: string | number = ''
            if (range === 'week') {
              l1 = d.getDate()
              const prevMonth = i > 0 ? rows[i - 1].start.getMonth() : -1
              if (i === 0 || d.getMonth() !== prevMonth) l2 = fMonth.format(d).replace('.', '')
            } else {
              l1 = WD[d.getDay()]
              l2 = d.getDate()
            }
            const cls = `font-mono text-[11px] tabular-nums ${cur ? 'fill-ink font-medium' : 'fill-muted'}`
            return (
              <g key={`l-${r.key}`}>
                <text x={cx} y={H - M.b + 18} textAnchor="middle" className={cls}>
                  {l1}
                </text>
                {l2 !== '' && (
                  <text x={cx} y={H - M.b + 34} textAnchor="middle" className={cls}>
                    {l2}
                  </text>
                )}
              </g>
            )
          })}

          {!example && lastIdx >= 0 && (
            <text
              x={M.l + slot * (lastIdx + 0.5)}
              y={y(rows[lastIdx].v!) - 8}
              textAnchor="middle"
              className="fill-ink text-[12.5px] font-bold"
            >
              {pct.format(rows[lastIdx].v!)}
            </text>
          )}

          {!example &&
            rows.map((r, i) => (
              <rect
                key={`h-${r.key}`}
                x={M.l + slot * i}
                y={M.t}
                width={slot}
                height={ih + M.b}
                fill="transparent"
                className="cursor-pointer"
                onPointerEnter={() => setHover(i)}
                onPointerDown={() => setHover(i)}
              />
            ))}
        </svg>

        {example && (
          <div className="pointer-events-none absolute top-[26px] right-2 left-[46px] grid h-[150px] place-items-center px-2">
            <span className="max-w-[34ch] rounded-xl bg-surface px-3.5 py-2.5 text-center text-sm text-ink-2 shadow-[inset_0_0_0_1px_var(--line-2)]">
              Exemple. Ta courbe s’affichera ici après ton premier essai.
            </span>
          </div>
        )}

        {hv && hover != null && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[calc(100%+12px)] rounded-[10px] bg-ink px-[11px] py-2 text-[13px] leading-snug whitespace-nowrap text-surface shadow-[var(--shadow)]"
            style={{
              left: Math.max(84, Math.min(W - 84, M.l + slot * (hover + 0.5))),
              top: hv.v != null ? y(hv.v) - (hover === lastIdx ? 18 : 0) : y(0),
            }}
          >
            <span className="block text-xs opacity-75">{label(hv)}</span>
            {hv.n ? (
              <>
                {hv.ok} {pl(hv.ok, 'juste', 'justes')} sur {hv.n} · <b>{pct.format(hv.v!)}</b>
              </>
            ) : (
              'Pas d’essai'
            )}
          </div>
        )}
      </div>

      <details className="group">
        <summary className="w-max max-w-full cursor-pointer text-sm font-medium text-ink-2">Voir les données</summary>
        <div className="mt-2.5 overflow-x-auto">
          <table className="w-full border-collapse text-sm tabular-nums">
            <thead>
              <tr className="caps">
                <th className="border-b border-line px-2.5 py-2 text-left">{range === 'week' ? 'Semaine' : 'Jour'}</th>
                <th className="border-b border-line px-2.5 py-2 text-right">Essais</th>
                <th className="border-b border-line px-2.5 py-2 text-right">Justes</th>
                <th className="border-b border-line px-2.5 py-2 text-right">Taux</th>
              </tr>
            </thead>
            <tbody>
              {example || !rows.some((r) => r.n) ? (
                <tr>
                  <td colSpan={4} className="px-2.5 py-2 text-muted">
                    Aucun essai sur cette période.
                  </td>
                </tr>
              ) : (
                rows
                  .filter((r) => r.n > 0)
                  .reverse()
                  .map((r) => (
                    <tr key={r.key}>
                      <td className="border-b border-line px-2.5 py-2 whitespace-nowrap">{label(r)}</td>
                      <td className="border-b border-line px-2.5 py-2 text-right">{r.n}</td>
                      <td className="border-b border-line px-2.5 py-2 text-right">{r.ok}</td>
                      <td className="border-b border-line px-2.5 py-2 text-right">{pct.format(r.ok / r.n)}</td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  )
}

function Summary({ attempts, range, now }: { attempts: Attempt[]; range: Range; now: number }) {
  const span = range === 'week' ? 28 : 7
  const c0 = addDays(startOfDay(now), -(span - 1)).getTime()
  const p0 = addDays(startOfDay(now), -(2 * span - 1)).getTime()
  const c = { n: 0, ok: 0 }
  const p = { n: 0, ok: 0 }
  for (const a of attempts) {
    if (a.t >= c0) {
      c.n++
      if (a.ok) c.ok++
    } else if (a.t >= p0) {
      p.n++
      if (a.ok) p.ok++
    }
  }
  const rate = c.n ? c.ok / c.n : null
  const delta = rate != null && p.n ? Math.round((rate - p.ok / p.n) * 100) : null

  return (
    <div className="flex flex-wrap items-end gap-x-7 gap-y-2">
      <div className="grid gap-1">
        <span className="text-[13px] text-muted">{span} derniers jours</span>
        <span className="text-[40px] leading-none font-bold tracking-tight sm:text-5xl">{rate != null ? pct.format(rate) : '–'}</span>
      </div>
      <div className="grid gap-1 pb-1 text-sm text-ink-2">
        {!attempts.length ? (
          <span>Fais ton premier essai pour lancer les statistiques.</span>
        ) : !c.n ? (
          <span>Aucun essai sur cette période.</span>
        ) : (
          <>
            <span>
              {c.ok} {pl(c.ok, 'juste', 'justes')} sur {c.n} {pl(c.n, 'essai', 'essais')}
            </span>
            {delta != null &&
              (delta === 0 ? (
                <span>Stable par rapport aux {span} jours d’avant</span>
              ) : (
                <span className={`inline-flex items-center gap-1.5 font-semibold ${delta > 0 ? 'text-good-text' : 'text-accent'}`}>
                  <svg viewBox="0 0 10 10" className="size-2.5" aria-hidden="true">
                    <path d={delta > 0 ? 'M5 1l4 7H1z' : 'M5 9L1 2h8z'} fill="currentColor" />
                  </svg>
                  {delta > 0 ? '+' : '−'}
                  {Math.abs(delta)} pts par rapport aux {span} jours d’avant
                </span>
              ))}
          </>
        )}
      </div>
    </div>
  )
}
