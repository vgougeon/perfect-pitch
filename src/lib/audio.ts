import { OCT } from './constants'
import type { Octave, Timbre } from './types'

let ctx: AudioContext | null = null
let master: GainNode | null = null
let analyser: AnalyserNode | null = null

export const audioState = { playingUntil: 0, playingOct: 4 as Octave }

function ensure(): AudioContext | null {
  if (!ctx) {
    const AC =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    ctx = new AC()
    master = ctx.createGain()
    master.gain.value = 0.9
    const comp = ctx.createDynamicsCompressor()
    analyser = ctx.createAnalyser()
    analyser.fftSize = 2048
    master.connect(comp)
    comp.connect(analyser)
    analyser.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

export const getAnalyser = () => analyser
export const getContext = () => ctx
export const isPlaying = () => !!(ctx && ctx.currentTime < audioState.playingUntil)

/** Joue un Do synthétisé. Renvoie false si le navigateur n'a pas d'audio. */
export function playC(oct: Octave, timbre: Timbre): boolean {
  const ac = ensure()
  if (!ac || !master) return false
  const f = OCT[oct].f
  const t0 = ac.currentTime + 0.03
  const bus = ac.createGain()
  bus.connect(master)

  const partial = (freq: number, shape: (g: AudioParam) => void, stopAt: number) => {
    const o = ac.createOscillator()
    const g = ac.createGain()
    o.type = 'sine'
    o.frequency.value = freq
    o.connect(g)
    g.connect(bus)
    shape(g.gain)
    o.start(t0)
    o.stop(stopAt)
  }

  let end: number
  if (timbre === 'fork') {
    // Diapason : sinus pur, longue décroissance
    partial(f, (g) => {
      g.setValueAtTime(0, t0)
      g.linearRampToValueAtTime(0.42, t0 + 0.02)
      g.setTargetAtTime(0, t0 + 0.05, 1.9)
    }, t0 + 7)
    end = t0 + 6.5
  } else if (timbre === 'organ') {
    // Orgue : harmoniques tenues, relâchement court
    for (const [n, amp] of [[1, 0.5], [2, 0.28], [3, 0.14], [4, 0.1], [6, 0.05], [8, 0.03]]) {
      partial(f * n, (g) => {
        g.setValueAtTime(0, t0)
        g.linearRampToValueAtTime(amp * 0.55, t0 + 0.06)
        g.setValueAtTime(amp * 0.55, t0 + 2.3)
        g.setTargetAtTime(0, t0 + 2.3, 0.12)
      }, t0 + 3.2)
    }
    end = t0 + 2.9
  } else {
    // Piano : partiels légèrement inharmoniques, double décroissance, petit coup de marteau
    const B = 0.00035
    const tau = oct === 3 ? 1.7 : oct === 4 ? 1.25 : 0.9
    ;[1, 0.55, 0.32, 0.2, 0.12, 0.08, 0.05, 0.03].forEach((amp, i) => {
      const n = i + 1
      const peak = amp * 0.3
      const freq = n === 1 ? f : f * n * Math.sqrt(1 + B * n * n)
      partial(freq, (g) => {
        g.setValueAtTime(0, t0)
        g.linearRampToValueAtTime(peak, t0 + 0.004)
        g.setTargetAtTime(peak * 0.35, t0 + 0.004, 0.18 / (1 + 0.3 * (n - 1)))
        g.setTargetAtTime(0, t0 + 0.45, tau / (1 + 0.45 * (n - 1)))
      }, t0 + 5.5)
    })
    const len = Math.floor(ac.sampleRate * 0.035)
    const buf = ac.createBuffer(1, len, ac.sampleRate)
    const ch = buf.getChannelData(0)
    for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3)
    const src = ac.createBufferSource()
    const bp = ac.createBiquadFilter()
    const ng = ac.createGain()
    src.buffer = buf
    bp.type = 'bandpass'
    bp.frequency.value = Math.min(f * 5, 4000)
    bp.Q.value = 0.9
    ng.gain.value = 0.12
    src.connect(bp)
    bp.connect(ng)
    ng.connect(bus)
    src.start(t0)
    end = t0 + 4.6
  }
  audioState.playingUntil = end
  audioState.playingOct = oct
  return true
}
