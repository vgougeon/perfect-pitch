export function dayKey(x: number | Date): string {
  const d = new Date(x)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function startOfDay(x: number | Date): Date {
  const d = new Date(x)
  d.setHours(0, 0, 0, 0)
  return d
}

export function addDays(x: number | Date, n: number): Date {
  const d = new Date(x)
  d.setDate(d.getDate() + n)
  return d
}

/** Lundi de la semaine (00:00) */
export function startOfWeek(x: number | Date): Date {
  const d = startOfDay(x)
  return addDays(d, -((d.getDay() + 6) % 7))
}

export function parseKey(k: string): Date {
  const [y, m, d] = k.split('-').map(Number)
  return new Date(y, m - 1, d)
}
