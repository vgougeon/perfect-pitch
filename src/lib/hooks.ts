import { useEffect, useState, type RefObject } from 'react'

/** Horloge qui se rafraîchit à intervalle régulier et au retour sur l'onglet. */
export function useNow(intervalMs: number): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs)
    const onVis = () => {
      if (document.visibilityState === 'visible') setNow(Date.now())
    }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [intervalMs])
  return now
}

/** Largeur d'un élément, suivie au redimensionnement. */
export function useWidth(ref: RefObject<HTMLElement | null>, fallback: number): number {
  const [w, setW] = useState(fallback)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => setW(Math.round(el.clientWidth) || fallback)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref, fallback])
  return w
}
