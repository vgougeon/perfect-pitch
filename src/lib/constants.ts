import type { Octave, Timbre } from './types'

export const MIN = 60_000
export const HOUR = 60 * MIN
export const GOAL = 5

// Accordage La 440 Hz. Do central = C4 (notation internationale) = do3 (notation française).
export const OCT: Record<Octave, { f: number; name: string; short: string; hz: string }> = {
  3: { f: 130.8128, name: 'Do grave', short: 'Grave', hz: '130,81 Hz' },
  4: { f: 261.6256, name: 'Do central', short: 'Central', hz: '261,63 Hz' },
  5: { f: 523.2511, name: 'Do aigu', short: 'Aigu', hz: '523,25 Hz' },
}
export const OCTAVES: Octave[] = [3, 4, 5]

export const TIMBRES: { value: Timbre; label: string }[] = [
  { value: 'piano', label: 'Piano' },
  { value: 'fork', label: 'Diapason' },
  { value: 'organ', label: 'Orgue' },
]

export type Tier = { label: string; mult: number; max: number; cond: string }

/** Fraîcheur : plus le dernier Do entendu est loin, plus l'essai vaut d'XP. */
export const TIERS: Tier[] = [
  { label: 'Chaud', mult: 0.5, max: 15 * MIN, cond: 'Do entendu il y a moins de 15 min' },
  { label: 'Tiède', mult: 1, max: HOUR, cond: 'Entre 15 min et 1 h' },
  { label: 'Frais', mult: 1.5, max: 4 * HOUR, cond: 'Entre 1 h et 4 h' },
  { label: 'Vierge', mult: 2, max: Infinity, cond: 'Plus de 4 h, ou premier essai' },
]

export function tierIdx(gap: number | null): number {
  if (gap == null) return TIERS.length - 1
  const i = TIERS.findIndex((t) => gap < t.max)
  return i < 0 ? TIERS.length - 1 : i
}

export const LEVELS: [number, string][] = [
  [0, 'Oreille curieuse'],
  [60, 'Fredonneur'],
  [160, 'Choriste'],
  [320, 'Solfégiste'],
  [560, 'Accordeur'],
  [900, 'Chef de pupitre'],
  [1400, 'Diapason vivant'],
  [2100, 'Oreille absolue'],
]
