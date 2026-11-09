import type { Toast } from '../lib/types'

export function Toasts({ items }: { items: Toast[] }) {
  return (
    <div className="toasts" aria-live="polite">
      {items.map((t) => (
        <div
          key={t.id}
          className="toast-in pointer-events-auto flex max-w-[440px] items-center gap-3 rounded-[14px] bg-ink px-4 py-3 text-sm leading-snug text-surface shadow-[var(--shadow)]"
        >
          {t.mark && (
            <span className="grid size-[34px] flex-none place-items-center rounded-full bg-gold font-display text-[13px] font-bold text-[#1a1405] italic">
              {t.mark}
            </span>
          )}
          <span>
            {t.text}
            {t.strong && <b className="font-bold">{t.strong}</b>}
          </span>
        </div>
      ))}
    </div>
  )
}
