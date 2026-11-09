import { MIN } from './constants'

export const pct = new Intl.NumberFormat('fr-FR', { style: 'percent', maximumFractionDigits: 0 })
export const num = new Intl.NumberFormat('fr-FR')
export const fDay = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
export const fDM = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' })
export const fMonth = new Intl.DateTimeFormat('fr-FR', { month: 'short' })
export const WD = ['D', 'L', 'M', 'M', 'J', 'V', 'S']

export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
export const fmtMult = (m: number) => '×' + String(m).replace('.', ',')
export const pl = (n: number, one: string, many: string) => (n > 1 ? many : one)

export function fmtDur(ms: number): string {
  const m = Math.max(0, Math.round(ms / MIN))
  if (m < 1) return 'moins d’une minute'
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  const mm = m % 60
  if (h < 24) return `${h} h${mm ? ' ' + String(mm).padStart(2, '0') : ''}`
  const d = Math.floor(h / 24)
  return `${d} ${pl(d, 'jour', 'jours')}`
}
