import { NOTES } from '../lib/pitch'

const R = 300 // cents visibles de chaque côté du Do
const W = 420
const H = 72
const PAD = 22

/** Accordeur : position du Do chanté par rapport au vrai Do. */
export function Gauge({ cents, tol }: { cents: number; tol: number }) {
  const iw = W - 2 * PAD
  const x = (c: number) => PAD + ((Math.max(-R, Math.min(R, c)) + R) / (2 * R)) * iw
  const out = Math.abs(cents) > R
  const mx = x(cents)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full max-w-[420px]" role="img" aria-label={`Écart au Do : ${Math.round(cents)} cents`}>
      <rect x={x(-tol)} y={16} width={x(tol) - x(-tol)} height={24} rx={4} fill="var(--good)" opacity={0.18} />
      <line x1={PAD} x2={W - PAD} y1={40.5} y2={40.5} stroke="var(--axis)" strokeWidth={1} />
      {Array.from({ length: 25 }, (_, i) => -R + i * 25).map((c) => (
        <line key={c} x1={x(c)} x2={x(c)} y1={c % 100 === 0 ? 30 : 35} y2={40} stroke={c === 0 ? 'var(--ink)' : 'var(--axis)'} strokeWidth={c === 0 ? 2 : 1} />
      ))}
      {[-3, -2, -1, 0, 1, 2, 3].map((s) => (
        <text
          key={s}
          x={x(s * 100)}
          y={60}
          textAnchor="middle"
          className={`font-mono text-[11px] ${s === 0 ? 'fill-ink font-medium' : 'fill-muted'}`}
        >
          {NOTES[(s + 12) % 12]}
        </text>
      ))}
      <line x1={mx} x2={mx} y1={12} y2={44} stroke="var(--accent)" strokeWidth={3} strokeLinecap="round" />
      {out ? (
        <path
          d={cents > 0 ? `M${mx + 2},4 l10,6 l-10,6z` : `M${mx - 2},4 l-10,6 l10,6z`}
          fill="var(--accent)"
        />
      ) : (
        <circle cx={mx} cy={10} r={6} fill="var(--accent)" stroke="var(--surface)" strokeWidth={2} />
      )}
    </svg>
  )
}
