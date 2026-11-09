import { useRef, type KeyboardEvent } from 'react'

type Option<T> = { value: T; label: string }

type Props<T extends string | number> = {
  labelledBy?: string
  label?: string
  options: Option<T>[]
  value: T
  onChange: (v: T) => void
}

export function Segmented<T extends string | number>({ labelledBy, label, options, value, onChange }: Props<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    e.preventDefault()
    e.stopPropagation()
    const i = options.findIndex((o) => o.value === value)
    const n = (i + (e.key === 'ArrowRight' ? 1 : -1) + options.length) % options.length
    onChange(options[n].value)
    refs.current[n]?.focus()
  }

  return (
    <div
      role="radiogroup"
      aria-labelledby={labelledBy}
      aria-label={label}
      onKeyDown={onKey}
      className="inline-flex gap-0.5 rounded-[10px] bg-bg p-[3px] shadow-[inset_0_0_0_1px_var(--line)]"
    >
      {options.map((o, i) => {
        const on = o.value === value
        return (
          <button
            key={String(o.value)}
            ref={(el) => {
              refs.current[i] = el
            }}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(o.value)}
            className={`cursor-pointer whitespace-nowrap rounded-lg px-[11px] py-1.5 text-[13px] font-medium transition-colors ${
              on
                ? 'bg-surface text-ink shadow-[0_1px_2px_rgba(0,0,0,.08),inset_0_0_0_1px_var(--line-2)]'
                : 'text-ink-2 hover:text-ink'
            }`}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
