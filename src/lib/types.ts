export type Attempt = {
  id: string
  /** Moment de la réponse (ms) */
  t: number
  ok: boolean
  /** Temps écoulé depuis le dernier Do entendu au moment de la révélation (ms), null si jamais */
  g: number | null
}

export type Phase = 'imagine' | 'judge' | 'done'
export type Timbre = 'piano' | 'fork' | 'organ'
export type Octave = 3 | 4 | 5
export type Range = 'day' | 'week'

export type Prefs = {
  timbre: Timbre
  oct: Octave
  range: Range
}

export type Result = {
  id: string
  ok: boolean
  gain: number
  comboText: string
}

export type Toast = {
  id: number
  text: string
  strong?: string
  mark?: string
}
