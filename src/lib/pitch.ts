/** Détection de hauteur au micro (algorithme YIN), entièrement dans le navigateur. */

export const NOTES = ['Do', 'Do♯', 'Ré', 'Mi♭', 'Mi', 'Fa', 'Fa♯', 'Sol', 'La♭', 'La', 'Si♭', 'Si']

export type ListenError = 'denied' | 'unsupported' | 'silence' | 'error'

type Handlers = {
  onLevel: (level: number) => void
  onProgress: (p: number) => void
  onDone: (cents: number) => void
  onError: (code: ListenError) => void
}

export const micSupported = () => typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia

/** Écart en cents par rapport au Do le plus proche, toutes octaves confondues (-600 à +600). */
export function centsFromC(freq: number): number {
  const midi = 69 + 12 * Math.log2(freq / 440)
  return wrap(midi * 100)
}

const wrap = (c: number) => ((((c + 600) % 1200) + 1200) % 1200) - 600

function unwrap(c: number, ref: number) {
  while (c - ref > 600) c -= 1200
  while (c - ref < -600) c += 1200
  return c
}

function median(xs: number[]) {
  const s = [...xs].sort((a, b) => a - b)
  const m = s.length >> 1
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

/** Note la plus proche d'un écart au Do, et l'écart à cette note. */
export function nearestNote(cents: number) {
  const semis = Math.round(cents / 100)
  return { name: NOTES[((semis % 12) + 12) % 12], semis, dev: Math.round(cents - semis * 100) }
}

export function yin(x: Float32Array, sr: number): number | null {
  const tauMin = Math.floor(sr / 1100)
  const tauMax = Math.min(Math.floor(sr / 65), Math.floor(x.length / 2))
  const W = x.length - tauMax
  const d = new Float32Array(tauMax + 1)
  for (let tau = 1; tau <= tauMax; tau++) {
    let s = 0
    for (let j = 0; j < W; j++) {
      const v = x[j] - x[j + tau]
      s += v * v
    }
    d[tau] = s
  }
  const cm = new Float32Array(tauMax + 1)
  cm[0] = 1
  let run = 0
  for (let tau = 1; tau <= tauMax; tau++) {
    run += d[tau]
    cm[tau] = run ? (d[tau] * tau) / run : 1
  }
  let tau = -1
  for (let t = tauMin; t <= tauMax; t++) {
    if (cm[t] < 0.15) {
      while (t + 1 <= tauMax && cm[t + 1] < cm[t]) t++
      tau = t
      break
    }
  }
  if (tau < 1) return null
  const a = cm[tau - 1]
  const b = cm[tau]
  const c = tau + 1 <= tauMax ? cm[tau + 1] : b
  const den = a + c - 2 * b
  const shift = den ? (a - c) / (2 * den) : 0
  return sr / (tau + shift)
}

const STEP_MS = 50
const HOLD_MS = 1200
const TIMEOUT_MS = 12000

/** Écoute le micro jusqu'à une note tenue ~1,2 s. Renvoie une fonction pour arrêter. */
export function listen(h: Handlers): () => void {
  let stopped = false
  let stream: MediaStream | null = null
  let ctx: AudioContext | null = null
  let timer = 0

  const stop = () => {
    stopped = true
    window.clearInterval(timer)
    stream?.getTracks().forEach((t) => t.stop())
    if (ctx && ctx.state !== 'closed') void ctx.close()
  }

  void (async () => {
    if (!micSupported()) {
      h.onError('unsupported')
      return
    }
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      })
    } catch (e) {
      if (!stopped) h.onError((e as DOMException)?.name === 'NotAllowedError' ? 'denied' : 'error')
      stop()
      return
    }
    if (stopped) {
      stop()
      return
    }
    ctx = new AudioContext()
    const an = ctx.createAnalyser()
    an.fftSize = 2048
    ctx.createMediaStreamSource(stream).connect(an)
    const buf = new Float32Array(an.fftSize)
    const sr = ctx.sampleRate
    const need = Math.round(HOLD_MS / STEP_MS)
    const start = performance.now()
    let readings: number[] = []
    let ref: number | null = null
    let lastVoiced = 0

    timer = window.setInterval(() => {
      an.getFloatTimeDomainData(buf)
      let rms = 0
      for (let i = 0; i < buf.length; i++) rms += buf[i] * buf[i]
      rms = Math.sqrt(rms / buf.length)
      h.onLevel(Math.min(1, rms * 10))
      const now = performance.now()
      const f = rms > 0.01 ? yin(buf, sr) : null

      if (f) {
        const c = centsFromC(f)
        const u = ref == null ? c : unwrap(c, ref)
        if (readings.length && Math.abs(u - median(readings)) > 50) {
          // La note a bougé : on repart de zéro
          readings = [c]
          ref = c
        } else {
          if (ref == null) ref = c
          readings.push(u)
        }
        lastVoiced = now
        h.onProgress(readings.length / need)
        if (readings.length >= need) {
          const cents = wrap(median(readings.slice(3)))
          stop()
          h.onDone(cents)
          return
        }
      } else if (readings.length && now - lastVoiced > 350) {
        readings = []
        ref = null
        h.onProgress(0)
      }

      if (now - start > TIMEOUT_MS) {
        stop()
        h.onError('silence')
      }
    }, STEP_MS)
  })()

  return stop
}
