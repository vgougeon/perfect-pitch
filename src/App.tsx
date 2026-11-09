import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Header } from './components/Header'
import { Medals } from './components/Medals'
import { ProgressChart } from './components/ProgressChart'
import { Rules } from './components/Rules'
import { SidePanel } from './components/SidePanel'
import { Stage, type ListenUi } from './components/Stage'
import { Toasts } from './components/Toasts'
import { playC } from './lib/audio'
import { burstFrom } from './lib/confetti'
import { TIERS, tierIdx } from './lib/constants'
import { dayKey } from './lib/dates'
import { fmtMult, pl } from './lib/format'
import { useNow } from './lib/hooks'
import { listen, micSupported, type ListenError } from './lib/pitch'
import { BADGES, computeStats, earnedSet, levelInfo } from './lib/stats'
import {
  K_DATA,
  K_HEARD,
  loadAttempts,
  loadHeard,
  loadPrefs,
  parseBackup,
  saveAttempts,
  saveHeard,
  savePrefs,
} from './lib/storage'
import type { Attempt, Octave, Phase, Prefs, Result, Toast } from './lib/types'

const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8)

const MIC_ERRORS: Record<ListenError, string> = {
  denied: 'Accès au micro refusé. Autorise-le dans les réglages du navigateur, ou révèle sans chanter.',
  unsupported: 'Ce navigateur ne donne pas accès au micro.',
  silence: 'Je n’ai pas entendu de note tenue. Rapproche-toi du micro et chante plus fort, sur une voyelle.',
  error: 'Le micro n’a pas pu démarrer. Vérifie qu’aucune autre application ne l’utilise.',
}

export default function App() {
  const [attempts, setAttempts] = useState<Attempt[]>(loadAttempts)
  const [prefs, setPrefs] = useState<Prefs>(loadPrefs)
  const [lastHeard, setLastHeard] = useState<number>(loadHeard)
  const [phase, setPhase] = useState<Phase>('imagine')
  const [revealGap, setRevealGap] = useState<number | null>(null)
  const [lastId, setLastId] = useState<string | null>(null)
  const [result, setResult] = useState<Result | null>(null)
  const [freshBadges, setFreshBadges] = useState<Set<string>>(() => new Set())
  const [playToken, setPlayToken] = useState(0)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [listenUi, setListenUi] = useState<ListenUi | null>(null)
  const [micOk] = useState(micSupported)
  const stopListen = useRef<(() => void) | null>(null)
  const now = useNow(30_000)

  useEffect(() => saveAttempts(attempts), [attempts])
  useEffect(() => savePrefs(prefs), [prefs])
  useEffect(() => () => stopListen.current?.(), [])

  // Garde plusieurs onglets ouverts en accord
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === K_DATA) setAttempts(loadAttempts())
      if (e.key === K_HEARD) setLastHeard(loadHeard())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const stats = useMemo(() => computeStats(attempts, now), [attempts, now])
  const lastSeen = useMemo(() => attempts.reduce((m, a) => Math.max(m, a.t), lastHeard), [attempts, lastHeard])
  const gapAt = useCallback((t: number) => (lastSeen ? Math.max(0, t - lastSeen) : null), [lastSeen])
  // `now` force un rendu toutes les 30 s ; l'écart lui-même utilise l'heure exacte
  const gap = gapAt(Date.now())

  const toastId = useRef(0)
  const pushToast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = ++toastId.current
    setToasts((xs) => [...xs, { ...t, id }])
    window.setTimeout(() => setToasts((xs) => xs.filter((x) => x.id !== id)), 5200)
  }, [])

  const play = useCallback(
    (oct: Octave) => {
      if (!playC(oct, prefs.timbre)) {
        pushToast({ text: 'Ce navigateur ne peut pas jouer de son.' })
        return
      }
      setPlayToken((x) => x + 1)
    },
    [prefs.timbre, pushToast],
  )

  /** Marque le Do comme entendu et le joue. */
  const hearDo = () => {
    const t = Date.now()
    setLastHeard(t)
    saveHeard(t)
    play(prefs.oct)
  }

  /** Enregistre un essai et affiche le résultat. */
  const commit = (ok: boolean, g: number | null, cents: number | null) => {
    const before = computeStats(attempts)
    const beforeBadges = earnedSet(before)
    const beforeLevel = levelInfo(before.xp).n
    const a: Attempt = { id: newId(), t: Date.now(), ok, g }
    if (cents != null) a.c = Math.round(cents)
    const next = [...attempts, a]
    const after = computeStats(next)
    const newly = new Set([...earnedSet(after)].filter((id) => !beforeBadges.has(id)))
    const mult = TIERS[tierIdx(g)].mult
    const comboText = ok
      ? `Combo ×${after.combo}${mult !== 1 ? ` · fraîcheur ${fmtMult(mult)}` : ''}`
      : before.combo > 1
        ? `Combo ×${before.combo} terminé`
        : `Fraîcheur ${fmtMult(mult)}`

    setAttempts(next)
    setLastId(a.id)
    setResult({ id: a.id, ok, gain: after.xp - before.xp, comboText, cents: a.c ?? null })
    setFreshBadges(newly)
    setPhase('done')

    const orb = document.querySelector('.orb')
    if (ok) burstFrom(orb, after.combo >= 5 ? 70 : 36)
    const L = levelInfo(after.xp)
    if (L.n > beforeLevel) {
      pushToast({ text: `Niveau ${L.n} · `, strong: L.name, mark: String(L.n) })
      burstFrom(orb, 90)
    }
    newly.forEach((id) => {
      const b = BADGES.find((x) => x.id === id)!
      pushToast({ text: 'Médaille débloquée · ', strong: b.name, mark: b.mark + (b.sup ?? '') })
    })
  }

  const reveal = () => {
    if (phase !== 'imagine') return
    setRevealGap(gapAt(Date.now()))
    setPhase('judge')
    hearDo()
  }

  const answer = (ok: boolean) => {
    if (phase !== 'judge') return
    commit(ok, revealGap, null)
  }

  // Les callbacks du micro arrivent plus tard : ils passent par une ref pour lire l'état à jour
  const onSung = useRef<(cents: number, g: number | null) => void>(() => {})
  onSung.current = (cents, g) => {
    setRevealGap(g)
    hearDo()
    commit(Math.abs(cents) <= prefs.tol, g, cents)
  }

  const startListen = () => {
    if (phase !== 'imagine' || !micOk) return
    const g = gapAt(Date.now())
    setPhase('listen')
    setListenUi({ level: 0, progress: 0 })
    stopListen.current = listen({
      onLevel: (level) => setListenUi((u) => (u ? { ...u, level } : u)),
      onProgress: (progress) => setListenUi((u) => (u ? { ...u, progress: Math.min(1, progress) } : u)),
      onDone: (cents) => {
        stopListen.current = null
        setListenUi(null)
        onSung.current(cents, g)
      },
      onError: (code) => {
        stopListen.current = null
        setListenUi(null)
        setPhase('imagine')
        pushToast({ text: MIC_ERRORS[code] })
      },
    })
  }

  const cancelListen = () => {
    stopListen.current?.()
    stopListen.current = null
    setListenUi(null)
    setPhase('imagine')
  }

  const undo = () => {
    if (!lastId) return
    const wasMic = result?.cents != null
    setAttempts((xs) => xs.filter((x) => x.id !== lastId))
    setLastId(null)
    setResult(null)
    // Au micro, l'essai est simplement retiré ; en auto-évaluation, on peut répondre à nouveau
    setPhase(wasMic ? 'imagine' : 'judge')
    pushToast({ text: wasMic ? 'Essai retiré.' : 'Réponse annulée. Tu peux répondre à nouveau.' })
  }

  const again = () => {
    if (phase !== 'done') return
    setLastId(null)
    setPhase('imagine')
  }

  const exportData = () => {
    const blob = new Blob([JSON.stringify({ app: 'do-absolu', version: 1, exportedAt: new Date().toISOString(), a: attempts }, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `do-absolu-${dayKey(Date.now())}.json`
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const importData = async (file: File) => {
    const list = parseBackup(await file.text())
    if (!list) {
      pushToast({ text: 'Ce fichier n’est pas un export de Do absolu.' })
      return
    }
    const known = new Set(attempts.map((a) => a.id))
    const added = list.filter((a) => !known.has(a.id))
    setAttempts([...attempts, ...added])
    pushToast({ text: added.length ? `${added.length} ${pl(added.length, 'essai importé', 'essais importés')}.` : 'Tous ces essais sont déjà là.' })
  }

  // Raccourcis : Espace révèle ou relance, C chante, Échap annule l'écoute, O juste, N à côté, R rejouer
  const keys = useRef({ phase, reveal, answer, again, startListen, cancelListen, replay: () => play(prefs.oct) })
  keys.current = { phase, reveal, answer, again, startListen, cancelListen, replay: () => play(prefs.oct) }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const k = keys.current
      if (e.key === 'Escape' && k.phase === 'listen') {
        k.cancelListen()
        return
      }
      const el = e.target as HTMLElement | null
      const ctl = el?.closest?.('button,input,select,textarea,summary,a,[contenteditable],[role="radio"]')
      if (e.key === ' ' || e.key === 'Enter') {
        if (ctl) return
        if (k.phase === 'imagine') {
          e.preventDefault()
          k.reveal()
        } else if (k.phase === 'done') {
          e.preventDefault()
          k.again()
        }
        return
      }
      if (ctl && ctl.tagName !== 'BUTTON') return
      const key = e.key.toLowerCase()
      if (k.phase === 'imagine' && key === 'c') k.startListen()
      else if (k.phase === 'judge' && key === 'o') k.answer(true)
      else if (k.phase === 'judge' && key === 'n') k.answer(false)
      else if ((k.phase === 'judge' || k.phase === 'done') && key === 'r') k.replay()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="gutter">
      <div className="mx-auto flex max-w-270 flex-col gap-5 pt-5 pb-14">
        <Header stats={stats} />
        <main className="grid grid-cols-1 items-start gap-5 min-[841px]:grid-cols-[minmax(0,1fr)_300px]">
          <Stage
            phase={phase}
            prefs={prefs}
            gap={gap}
            result={result}
            playToken={playToken}
            micOk={micOk}
            listenUi={listenUi}
            onReveal={reveal}
            onListen={startListen}
            onCancelListen={cancelListen}
            onAnswer={answer}
            onAgain={again}
            onUndo={undo}
            onPlay={play}
            onPrefs={(p) => setPrefs((x) => ({ ...x, ...p }))}
          />
          <SidePanel stats={stats} now={now} onExport={exportData} onImport={importData} />
        </main>
        <ProgressChart
          attempts={attempts}
          range={prefs.range}
          metric={prefs.metric}
          now={now}
          onRange={(range) => setPrefs((x) => ({ ...x, range }))}
          onMetric={(metric) => setPrefs((x) => ({ ...x, metric }))}
        />
        <Medals stats={stats} fresh={freshBadges} />
        <Rules />
      </div>
      <Toasts items={toasts} />
    </div>
  )
}
