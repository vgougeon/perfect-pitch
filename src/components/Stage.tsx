import { useEffect, useRef } from 'react'
import { HOUR, OCT, OCTAVES, TIERS, TIMBRES, tierIdx } from '../lib/constants'
import { fmtDur, fmtMult } from '../lib/format'
import type { Octave, Phase, Prefs, Result } from '../lib/types'
import { Scope } from './Scope'
import { Segmented } from './Segmented'

type Props = {
  phase: Phase
  prefs: Prefs
  gap: number | null
  result: Result | null
  playToken: number
  onReveal: () => void
  onAnswer: (ok: boolean) => void
  onAgain: () => void
  onUndo: () => void
  onPlay: (oct: Octave) => void
  onPrefs: (p: Partial<Prefs>) => void
}

const STEPS: [Phase, string][] = [
  ['imagine', 'Imagine'],
  ['judge', 'Compare'],
  ['done', 'Résultat'],
]

const PROMPTS: Record<Exclude<Phase, 'done'>, string> = {
  imagine: 'Avant d’écouter quoi que ce soit, chante ou imagine ton Do. Tiens-le quelques secondes, puis révèle.',
  judge: 'Voici le vrai Do. Était-il au même endroit que le tien ?',
}

export function Stage(p: Props) {
  const { phase, prefs, gap, result, playToken } = p
  const yesRef = useRef<HTMLButtonElement>(null)
  const againRef = useRef<HTMLButtonElement>(null)
  const revealRef = useRef<HTMLButtonElement>(null)
  const first = useRef(true)
  const ti = tierIdx(gap)

  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    const target = phase === 'judge' ? yesRef : phase === 'done' ? againRef : revealRef
    target.current?.focus({ preventScroll: true })
  }, [phase])

  return (
    <section
      data-phase={phase}
      aria-label="Essai"
      className="card relative flex min-w-0 flex-col items-center gap-4 overflow-hidden px-[clamp(16px,4vw,36px)] pt-5 pb-[18px]"
    >
      <div className="flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-2.5">
        <ol className="flex gap-1 text-[13px] font-semibold" aria-label="Étapes">
          {STEPS.map(([k, label], i) => {
            const cur = phase === k
            return (
              <li
                key={k}
                aria-current={cur ? 'step' : undefined}
                className={`flex items-center gap-1.5 rounded-full px-2.5 py-[5px] ${cur ? 'bg-accent-soft text-ink' : 'text-muted'}`}
              >
                <b className={`font-mono text-[11px] font-medium ${cur ? 'text-accent' : ''}`}>{i + 1}</b>
                {label}
              </li>
            )
          })}
        </ol>
        <FreshChip gap={gap} />
      </div>

      <div className="relative grid w-full place-items-center pt-[22px] pb-1.5">
        <div className="staff" aria-hidden="true" />
        <div className="orb" aria-hidden="true">
          <span
            key={phase === 'imagine' ? 'breathe' : `ping-${playToken}`}
            className={`rings ${phase === 'imagine' ? 'breathe' : 'ping'}`}
          >
            <i />
            <i />
            <i />
          </span>
          <span className="orb-do">Do</span>
        </div>
      </div>

      <div className="flex items-center gap-2 font-mono text-[13px] text-ink-2">
        <span>{OCT[prefs.oct].name}</span>
        <span className="size-1 rounded-full bg-line-2" />
        <span>{OCT[prefs.oct].hz}</span>
      </div>

      {phase !== 'done' && (
        <p className="max-w-[46ch] text-center text-[17px] text-balance text-ink-2" aria-live="polite">
          {PROMPTS[phase]}
        </p>
      )}

      {phase === 'imagine' && ti === 0 && (
        <p className="max-w-[46ch] rounded-xl bg-gold-soft px-3.5 py-2 text-center text-sm text-balance text-gold-ink">
          Tu as entendu le Do il y a peu, il est encore en mémoire. L’essai compte, mais rapporte moins d’XP.
        </p>
      )}

      {phase !== 'imagine' && <Scope playToken={playToken} />}

      {phase === 'imagine' && (
        <button ref={revealRef} type="button" className="btn btn-primary" onClick={p.onReveal}>
          J’ai mon Do, révéler <kbd>Espace</kbd>
        </button>
      )}

      {phase !== 'imagine' && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button type="button" className="btn" onClick={() => p.onPlay(prefs.oct)}>
            <SpeakerIcon />
            Rejouer <kbd>R</kbd>
          </button>
          <span className="ml-1.5 text-[13px] text-muted">Écouter aussi</span>
          {OCTAVES.filter((o) => o !== prefs.oct).map((o) => (
            <button key={o} type="button" className="chip" onClick={() => p.onPlay(o)}>
              {OCT[o].name}
            </button>
          ))}
        </div>
      )}

      {phase === 'judge' && (
        <div className="flex w-full flex-col items-center gap-3.5">
          <p className="text-center font-display text-[21px] font-semibold italic sm:text-2xl">Ton Do était juste ?</p>
          <div className="grid w-full max-w-[440px] grid-cols-2 gap-3">
            <button ref={yesRef} type="button" className="btn btn-good btn-lg" onClick={() => p.onAnswer(true)}>
              <CheckIcon />
              Juste <kbd>O</kbd>
            </button>
            <button type="button" className="btn btn-miss btn-lg" onClick={() => p.onAnswer(false)}>
              <CrossIcon />
              À côté <kbd>N</kbd>
            </button>
          </div>
          <p className="max-w-[52ch] text-center text-[13px] text-balance text-muted">
            Compte « juste » seulement si c’était la même note. Un demi-ton au-dessus ou en dessous, c’est à côté.
          </p>
        </div>
      )}

      {phase === 'done' && result && (
        <div className="grid justify-items-center gap-1.5 text-center" aria-live="polite">
          <p className={`font-display text-[34px] leading-tight font-bold italic ${result.ok ? 'text-good-text' : 'text-ink-2'}`}>
            {result.ok ? 'Juste !' : 'À côté'}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <span key={result.id} className="gain-pop text-xl font-bold text-gold-ink">
              +{result.gain} XP
            </span>
            <span className="rounded-full bg-bg px-2.5 py-[3px] text-sm font-semibold text-ink-2">{result.comboText}</span>
          </div>
          <p className="max-w-[48ch] text-sm text-balance text-ink-2">{nextHint(gap, result.ok)}</p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
            <button ref={againRef} type="button" className="btn btn-primary" onClick={p.onAgain}>
              Nouvel essai <kbd>Espace</kbd>
            </button>
            <button type="button" className="linkbtn" onClick={p.onUndo}>
              Annuler ma réponse
            </button>
          </div>
        </div>
      )}

      <div className="mt-1 flex w-full flex-wrap justify-center gap-x-6 gap-y-2.5 border-t border-line pt-3.5">
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          <span id="lbl-timbre" className="caps">
            Son
          </span>
          <Segmented labelledBy="lbl-timbre" options={TIMBRES} value={prefs.timbre} onChange={(timbre) => p.onPrefs({ timbre })} />
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          <span id="lbl-oct" className="caps">
            Hauteur
          </span>
          <Segmented
            labelledBy="lbl-oct"
            options={OCTAVES.map((o) => ({ value: o, label: OCT[o].short }))}
            value={prefs.oct}
            onChange={(oct) => p.onPrefs({ oct })}
          />
        </div>
      </div>
    </section>
  )
}

function FreshChip({ gap }: { gap: number | null }) {
  const ti = tierIdx(gap)
  const T = TIERS[ti]
  return (
    <div
      className="inline-flex max-w-full items-center gap-2 rounded-full bg-bg py-[5px] pr-1.5 pl-3 text-[13px] text-ink-2"
      title="Plus le dernier Do entendu est loin, plus l’essai rapporte d’XP"
    >
      <span className="inline-flex h-3 flex-none items-end gap-0.5" aria-hidden="true">
        {[4, 7, 10, 12].map((h, i) => (
          <i key={h} className={`w-[3px] rounded-[1px] ${i <= ti ? 'bg-gold' : 'bg-line-2'}`} style={{ height: h }} />
        ))}
      </span>
      <span className="min-w-0">{gap == null ? 'Aucun Do entendu ici' : `Dernier Do entendu il y a ${fmtDur(gap)}`}</span>
      <span className="flex-none rounded-full bg-gold-soft px-[9px] py-0.5 font-mono text-xs font-medium text-gold-ink">
        {T.label} {fmtMult(T.mult)}
      </span>
    </div>
  )
}

function nextHint(gap: number | null, ok: boolean): string {
  const g = gap ?? 0
  const ti = tierIdx(g)
  const lead = ok ? '' : 'Réécoute-le deux ou trois fois et chante avec lui pour l’ancrer. '
  const parts: string[] = []
  if (ti < TIERS.length - 1) {
    const nx = TIERS[ti + 1]
    parts.push(`Prochain palier : ${nx.label} ${fmtMult(nx.mult)} dans ${fmtDur(TIERS[ti].max - g)}.`)
    if (ti + 1 < TIERS.length - 1) parts.push(`Vierge ×2 dans ${fmtDur(4 * HOUR - g)}.`)
  } else {
    parts.push('Ta mémoire est vierge, ton prochain essai vaut ×2.')
  }
  return `${lead}Laisse le Do s’effacer avant de revenir. ${parts.join(' ')}`
}

function SpeakerIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M4 7.5h3l4-3.5v12l-4-3.5H4z" fill="currentColor" />
      <path d="M13.5 7a4 4 0 0 1 0 6M15.5 5a7 7 0 0 1 0 10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M4 10.5l4 4 8-9" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CrossIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M5.5 5.5l9 9M14.5 5.5l-9 9" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  )
}
