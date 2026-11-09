export type Attempt = {
  id: string
  /** Moment de la réponse (ms) */
  t: number
  ok: boolean
  /** Temps écoulé depuis le dernier Do entendu au moment de la révélation (ms), null si jamais */
  g: number | null
  /** Essai au micro : écart mesuré au Do, en cents (-600 à +600). Absent pour une auto-évaluation. */
  c?: number
}

export type Phase = 'imagine' | 'listen' | 'judge' | 'done'
export type Timbre = 'piano' | 'fork' | 'organ'
export type Octave = 3 | 4 | 5
export type Range = 'day' | 'week'
export type Metric = 'rate' | 'cents'
export type Tolerance = 25 | 50

export type Prefs = {
  timbre: Timbre
  oct: Octave
  range: Range
  metric: Metric
  tol: Tolerance
}

export type Result = {
  id: string
  ok: boolean
  gain: number
  comboText: string
  cents: number | null
}

export type Toast = {
  id: number
  text: string
  strong?: string
  mark?: string
}
