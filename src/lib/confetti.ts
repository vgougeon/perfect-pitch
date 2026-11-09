type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  r: number
  vr: number
  w: number
  h: number
  c: string
  life: number
}

let canvas: HTMLCanvasElement | null = null
let parts: Particle[] = []
let raf = 0
const LIFE = 160

const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

/** Petite gerbe de confettis depuis le centre d'un élément. */
export function burstFrom(el: Element | null, count: number) {
  if (!el || reduced()) return
  if (!canvas) {
    canvas = document.createElement('canvas')
    canvas.className = 'confetti'
    canvas.setAttribute('aria-hidden', 'true')
    document.body.appendChild(canvas)
  }
  const r = el.getBoundingClientRect()
  const x = r.left + r.width / 2
  const y = r.top + r.height / 2
  const cs = getComputedStyle(document.documentElement)
  const colors = ['--accent', '--gold', '--good'].map((v) => cs.getPropertyValue(v).trim())
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2
    const sp = 3 + Math.random() * 7
    parts.push({
      x,
      y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp - 4,
      r: Math.random() * 6,
      vr: (Math.random() - 0.5) * 0.3,
      w: 5 + Math.random() * 5,
      h: 3 + Math.random() * 4,
      c: colors[i % colors.length],
      life: 0,
    })
  }
  if (!raf) raf = requestAnimationFrame(step)
}

function step() {
  if (!canvas) return
  const dpr = window.devicePixelRatio || 1
  const W = window.innerWidth
  const H = window.innerHeight
  if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
    canvas.width = Math.round(W * dpr)
    canvas.height = Math.round(H * dpr)
  }
  const g = canvas.getContext('2d')!
  g.setTransform(dpr, 0, 0, dpr, 0, 0)
  g.clearRect(0, 0, W, H)
  parts = parts.filter((p) => p.life < LIFE && p.y < H + 30)
  for (const p of parts) {
    p.life++
    p.vy += 0.28
    p.vx *= 0.985
    p.x += p.vx
    p.y += p.vy
    p.r += p.vr
    g.save()
    g.translate(p.x, p.y)
    g.rotate(p.r)
    g.globalAlpha = Math.max(0, 1 - p.life / LIFE)
    g.fillStyle = p.c
    g.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
    g.restore()
  }
  raf = parts.length ? requestAnimationFrame(step) : 0
}
