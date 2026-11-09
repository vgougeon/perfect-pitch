import { GOAL, HOUR, LEVELS, TIERS, tierIdx } from './constants'
import { addDays, dayKey, parseKey, startOfDay, startOfWeek } from './dates'
import type { Attempt } from './types'

export type Count = { n: number; ok: number }

export type Stats = {
  xp: number
  combo: number
  bestCombo: number
  correct: number
  total: number
  freshHit: boolean
  earlyHit: boolean
  perDay: Map<string, Count>
  streak: number
  bestStreak: number
  maxPerDay: number
  bestWeekRate: number
  today: Count
}

/** XP d'un essai : juste = 10 (+2 par Do juste d'affilée, max +10), à côté = 2, le tout × fraîcheur. */
export function computeStats(list: Attempt[], now = Date.now()): Stats {
  const sorted = [...list].sort((a, b) => a.t - b.t)
  let xp = 0
  let combo = 0
  let bestCombo = 0
  let correct = 0
  let freshHit = false
  let earlyHit = false
  const perDay = new Map<string, Count>()
  const perWeek = new Map<string, Count>()

  for (const a of sorted) {
    const mult = TIERS[tierIdx(a.g)].mult
    if (a.ok) {
      combo++
      bestCombo = Math.max(bestCombo, combo)
      correct++
      xp += Math.round((10 + Math.min(combo - 1, 5) * 2) * mult)
      if (a.g != null && a.g >= 4 * HOUR) freshHit = true
      if (new Date(a.t).getHours() < 8) earlyHit = true
    } else {
      combo = 0
      xp += Math.round(2 * mult)
    }
    bump(perDay, dayKey(a.t), a.ok)
    bump(perWeek, dayKey(startOfWeek(a.t)), a.ok)
  }

  // Série en cours : jours consécutifs jusqu'à aujourd'hui (ou hier si rien aujourd'hui)
  let streak = 0
  let d = startOfDay(now)
  if (!perDay.has(dayKey(d))) d = addDays(d, -1)
  while (perDay.has(dayKey(d))) {
    streak++
    d = addDays(d, -1)
  }

  let bestStreak = 0
  let run = 0
  let prev: Date | null = null
  let maxPerDay = 0
  for (const k of [...perDay.keys()].sort()) {
    run = prev && dayKey(addDays(prev, 1)) === k ? run + 1 : 1
    bestStreak = Math.max(bestStreak, run)
    prev = parseKey(k)
    maxPerDay = Math.max(maxPerDay, perDay.get(k)!.n)
  }

  let bestWeekRate = 0
  perWeek.forEach((w) => {
    if (w.n >= 15) bestWeekRate = Math.max(bestWeekRate, w.ok / w.n)
  })

  return {
    xp,
    combo,
    bestCombo,
    correct,
    total: sorted.length,
    freshHit,
    earlyHit,
    perDay,
    streak,
    bestStreak,
    maxPerDay,
    bestWeekRate,
    today: perDay.get(dayKey(now)) ?? { n: 0, ok: 0 },
  }
}

function bump(map: Map<string, Count>, key: string, ok: boolean) {
  const c = map.get(key) ?? { n: 0, ok: 0 }
  c.n++
  if (ok) c.ok++
  map.set(key, c)
}

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']

export function levelInfo(xp: number) {
  let i = 0
  while (i + 1 < LEVELS.length && xp >= LEVELS[i + 1][0]) i++
  if (i === LEVELS.length - 1) {
    // Au-delà du dernier palier : un niveau tous les 900 XP
    const base = LEVELS[i][0]
    const extra = Math.floor((xp - base) / 900)
    const from = base + extra * 900
    const suffix = extra ? ' ' + (ROMAN[extra + 1] ?? String(extra + 1)) : ''
    return { n: i + 1 + extra, name: LEVELS[i][1] + suffix, from, to: from + 900 }
  }
  return { n: i + 1, name: LEVELS[i][1], from: LEVELS[i][0], to: LEVELS[i + 1][0] }
}

export type Badge = {
  id: string
  mark: string
  sup?: string
  name: string
  desc: string
  test: (s: Stats) => boolean
}

export const BADGES: Badge[] = [
  { id: 'first', mark: '1', sup: 'er', name: 'Premier Do', desc: 'Faire un premier essai', test: (s) => s.total >= 1 },
  { id: 'hit', mark: 'Do', name: 'Dans le mille', desc: 'Trouver le Do une première fois', test: (s) => s.correct >= 1 },
  { id: 'goal', mark: '5/5', name: 'Objectif tenu', desc: '5 essais dans la même journée', test: (s) => s.maxPerDay >= GOAL },
  { id: 'c5', mark: '×5', name: 'Combo ×5', desc: '5 Do justes d’affilée', test: (s) => s.bestCombo >= 5 },
  { id: 'c10', mark: '×10', name: 'Combo ×10', desc: '10 Do justes d’affilée', test: (s) => s.bestCombo >= 10 },
  { id: 's3', mark: '3 j', name: 'Trois jours', desc: '3 jours de pratique d’affilée', test: (s) => s.bestStreak >= 3 },
  { id: 's7', mark: '7 j', name: 'Une semaine', desc: '7 jours de pratique d’affilée', test: (s) => s.bestStreak >= 7 },
  { id: 's30', mark: '30 j', name: 'Un mois', desc: '30 jours de pratique d’affilée', test: (s) => s.bestStreak >= 30 },
  { id: 'fresh', mark: '4 h', name: 'Mémoire longue', desc: 'Juste après 4 h sans entendre de Do', test: (s) => s.freshHit },
  { id: 'early', mark: '8 h', name: 'Voix du matin', desc: 'Juste avant 8 h du matin', test: (s) => s.earlyHit },
  { id: 'cent', mark: '100', name: 'Centurion', desc: '100 essais au total', test: (s) => s.total >= 100 },
  { id: 'w80', mark: '80 %', name: 'Oreille sûre', desc: '80 % sur une semaine, 15 essais minimum', test: (s) => s.bestWeekRate >= 0.8 },
]

export function earnedSet(s: Stats): Set<string> {
  return new Set(BADGES.filter((b) => b.test(s)).map((b) => b.id))
}
