import { TIERS } from '../lib/constants'
import { fmtMult } from '../lib/format'

export function Rules() {
  return (
    <section className="grid gap-3.5 px-1 pt-1.5" aria-labelledby="h-rules">
      <h2 id="h-rules" className="text-[22px]">
        Barème
      </h2>
      <div className="grid grid-cols-2 gap-2.5 min-[701px]:grid-cols-4">
        {TIERS.map((t) => (
          <div key={t.label} className="grid gap-0.5 rounded-[14px] px-3.5 py-3 shadow-[inset_0_0_0_1px_var(--line-2)]">
            <span className="font-mono text-lg font-medium text-gold-ink">{fmtMult(t.mult)}</span>
            <span className="text-[15px] font-semibold">{t.label}</span>
            <span className="text-[13px] text-muted">{t.cond}</span>
          </div>
        ))}
      </div>
      <p className="max-w-[72ch] text-[14.5px] text-ink-2">
        Do juste : 10 XP, plus 2 XP par Do juste d’affilée (jusqu’à +10). À côté : 2 XP, parce qu’une réponse honnête fait aussi
        progresser. Le tout est multiplié par la fraîcheur. Le meilleur test reste le Do du matin, avant d’avoir entendu la moindre
        note.
      </p>
      <p className="max-w-[72ch] text-[14.5px] text-ink-2">
        Au micro, le verdict est automatique : juste si tu es à moins de 50 cents du Do (25 en mode strict). Un cent vaut un
        centième de demi-ton, et l’octave ne compte pas. Le graphique « Écart en cents » montre ta précision moyenne, même quand tu
        trouves déjà la bonne note.
      </p>
      <p className="max-w-[72ch] text-[13px] text-muted">
        Do central = C4 en notation internationale, do3 en notation française. Accordage La 440 Hz. Le Do grave sonne une octave plus
        bas (130,81 Hz), le Do aigu une octave plus haut (523,25 Hz).
      </p>
    </section>
  )
}
