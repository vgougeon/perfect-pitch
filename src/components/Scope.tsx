import { useEffect, useRef } from 'react'
import { OCT } from '../lib/constants'
import { audioState, getAnalyser, getContext, isPlaying } from '../lib/audio'

/** Oscilloscope : affiche l'onde du Do pendant qu'il sonne. */
export function Scope({ playToken }: { playToken: number }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    let raf = 0
    let buf: Float32Array<ArrayBuffer> | null = null

    const draw = () => {
      const c = ref.current
      if (!c) return
      const dpr = window.devicePixelRatio || 1
      const w = c.clientWidth
      const h = c.clientHeight
      if (!w) return
      if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) {
        c.width = Math.round(w * dpr)
        c.height = Math.round(h * dpr)
      }
      const g = c.getContext('2d')!
      g.setTransform(dpr, 0, 0, dpr, 0, 0)
      g.clearRect(0, 0, w, h)
      const cs = getComputedStyle(document.documentElement)
      const analyser = getAnalyser()
      const ctx = getContext()
      const live = !!(analyser && ctx && isPlaying())
      g.lineWidth = 2
      g.lineJoin = 'round'
      g.lineCap = 'round'
      g.strokeStyle = cs.getPropertyValue(live ? '--accent' : '--line-2').trim()
      g.beginPath()
      if (live && analyser && ctx) {
        if (!buf || buf.length !== analyser.fftSize) buf = new Float32Array(analyser.fftSize)
        analyser.getFloatTimeDomainData(buf)
        // Déclenchement sur un passage par zéro montant : l'onde reste immobile à l'écran
        const period = ctx.sampleRate / OCT[audioState.playingOct].f
        let start = 0
        for (let i = 1; i < period + 2 && i < buf.length; i++) {
          if (buf[i - 1] < 0 && buf[i] >= 0) {
            start = i
            break
          }
        }
        const N = Math.min(buf.length - start, Math.round(period * 4))
        let peak = 0
        for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(buf[start + i]))
        const scale = (h * 0.42) / Math.max(peak, 0.12)
        for (let i = 0; i < N; i++) {
          const x = (i / (N - 1)) * w
          const y = h / 2 - buf[start + i] * scale
          if (i) g.lineTo(x, y)
          else g.moveTo(x, y)
        }
      } else {
        g.moveTo(1, h / 2)
        g.lineTo(w - 1, h / 2)
      }
      g.stroke()
      if (live) raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [playToken])

  return <canvas ref={ref} aria-hidden="true" className="block h-16 w-full max-w-[520px]" />
}
