import { OCT } from './constants'
import type { Attempt, Prefs } from './types'

export const K_DATA = 'doabsolu:v1'
export const K_PREFS = 'doabsolu:prefs'
export const K_HEARD = 'doabsolu:heard'

function read<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key)
    return v ? (JSON.parse(v) as T) : fallback
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* stockage plein ou bloqué : on continue sans sauvegarder */
  }
}

export function isAttempt(a: unknown): a is Attempt {
  if (!a || typeof a !== 'object') return false
  const x = a as Record<string, unknown>
  return (
    typeof x.id === 'string' &&
    typeof x.t === 'number' &&
    Number.isFinite(x.t) &&
    typeof x.ok === 'boolean' &&
    (x.g == null || (typeof x.g === 'number' && Number.isFinite(x.g))) &&
    (x.c == null || (typeof x.c === 'number' && Number.isFinite(x.c)))
  )
}

const clean = (a: Attempt): Attempt => {
  const out: Attempt = { id: a.id, t: a.t, ok: a.ok, g: a.g ?? null }
  if (typeof a.c === 'number') out.c = a.c
  return out
}

export function loadAttempts(): Attempt[] {
  const s = read<{ a?: unknown }>(K_DATA, {})
  return Array.isArray(s?.a) ? s.a.filter(isAttempt).map(clean) : []
}

export const saveAttempts = (a: Attempt[]) => write(K_DATA, { a })

export function loadPrefs(): Prefs {
  const p = { timbre: 'piano', oct: 4, range: 'day', metric: 'rate', tol: 50, ...read<Partial<Prefs>>(K_PREFS, {}) } as Prefs
  if (!OCT[p.oct]) p.oct = 4
  if (!['piano', 'fork', 'organ'].includes(p.timbre)) p.timbre = 'piano'
  if (p.range !== 'day' && p.range !== 'week') p.range = 'day'
  if (p.metric !== 'rate' && p.metric !== 'cents') p.metric = 'rate'
  if (p.tol !== 25 && p.tol !== 50) p.tol = 50
  return p
}

export const savePrefs = (p: Prefs) => write(K_PREFS, p)

export const loadHeard = () => Number(read<number>(K_HEARD, 0)) || 0
export const saveHeard = (t: number) => write(K_HEARD, t)

/** Lit un fichier exporté (ou un tableau brut d'essais). */
export function parseBackup(text: string): Attempt[] | null {
  try {
    const data = JSON.parse(text) as unknown
    const list = Array.isArray(data) ? data : (data as { a?: unknown })?.a
    if (!Array.isArray(list)) return null
    return list.filter(isAttempt).map(clean)
  } catch {
    return null
  }
}
