import {
  forwardRef, useEffect, useState,
  type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes,
} from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, ImageIcon, Inbox, Loader2, Star, X } from 'lucide-react'
import { cx } from '../lib/utils'

/* ---------- Button ---------- */
type Variant = 'primary' | 'outline' | 'soft' | 'ghost' | 'danger' | 'white' | 'outlineWhite'
type Size = 'sm' | 'md' | 'lg'
const base = 'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition disabled:cursor-not-allowed disabled:opacity-50'
const sizes: Record<Size, string> = { sm: 'px-4 py-2 text-sm', md: 'px-6 py-3 text-sm', lg: 'px-7 py-3.5 text-base' }
const variants: Record<Variant, string> = {
  primary: 'bg-royal text-white shadow-sm hover:bg-royal-600',
  outline: 'border border-royal/40 bg-white text-royal hover:bg-soft',
  soft: 'bg-soft text-royal hover:bg-royal/10',
  ghost: 'text-navy/70 hover:bg-soft',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  white: 'bg-white text-royal hover:bg-soft',
  outlineWhite: 'border border-white/70 bg-transparent text-white hover:bg-white/10',
}
export const btn = (v: Variant = 'primary', s: Size = 'md', extra?: string) => cx(base, sizes[s], variants[v], extra)

export function Button({ variant = 'primary', size = 'md', loading, className, children, disabled, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; loading?: boolean }) {
  return (
    <button type="button" className={btn(variant, size, className)} disabled={disabled || loading} aria-busy={loading || undefined} {...p}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  )
}

export function LinkButton({ variant = 'primary', size = 'md', className, ...p }: LinkProps & { variant?: Variant; size?: Size }) {
  return <Link className={btn(variant, size, className)} {...p} />
}

/* ---------- Layout bits ---------- */
export const Card = ({ className, children }: { className?: string; children: ReactNode }) => (
  <div className={cx('rounded-3xl border border-royal/10 bg-white p-5 shadow-card', className)}>{children}</div>
)

export function SectionHeading({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        {eyebrow && <span className="mb-2 inline-block rounded-full bg-soft px-3 py-1 text-xs font-semibold text-royal">{eyebrow}</span>}
        <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h2>
      </div>
      {action}
    </div>
  )
}

export function PageHeader({ title, desc, action }: { title: string; desc?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
        {desc && <p className="mt-1 text-sm text-navy/60">{desc}</p>}
      </div>
      {action}
    </div>
  )
}

/* ---------- Image with graceful fallback ---------- */
export function Img({ src, alt, className }: { src?: string; alt: string; className?: string }) {
  const [err, setErr] = useState(false)
  if (!src || err)
    return (
      <div role="img" aria-label={alt} className={cx('grid place-items-center bg-gradient-to-br from-soft to-white text-royal/40', className)}>
        <ImageIcon className="h-8 w-8" />
      </div>
    )
  return <img src={src} alt={alt} loading="lazy" onError={() => setErr(true)} className={cx('object-cover', className)} />
}

/* ---------- Form fields ---------- */
const inputCls = 'w-full rounded-2xl border border-royal/20 bg-white px-4 py-3 text-sm text-navy placeholder:text-navy/40 focus:border-royal focus:outline-none focus:ring-2 focus:ring-royal/20 disabled:bg-mist'

export function Field({ label, error, hint, children, className }: { label: string; error?: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cx('block text-sm', className)}>
      <span className="mb-1.5 block font-semibold">{label}</span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-navy/50">{hint}</span>}
      {error && (
        <span role="alert" className="mt-1 block text-xs font-medium text-red-600">
          {error}
        </span>
      )}
    </label>
  )
}
export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ className, ...p }, r) => (
  <input ref={r} className={cx(inputCls, className)} {...p} />
))
export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(({ className, ...p }, r) => (
  <select ref={r} className={cx(inputCls, className)} {...p} />
))
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...p }, r) => (
  <textarea ref={r} rows={4} className={cx(inputCls, className)} {...p} />
))

/* ---------- Badges ---------- */
const statusColors: Record<string, string> = {
  'Menunggu Konfirmasi': 'bg-amber-50 text-amber-700',
  Menunggu: 'bg-amber-50 text-amber-700',
  Dikonfirmasi: 'bg-blue-50 text-blue-700',
  Dijadwalkan: 'bg-blue-50 text-blue-700',
  Aktif: 'bg-emerald-50 text-emerald-700',
  Selesai: 'bg-slate-100 text-slate-700',
  Dibatalkan: 'bg-red-50 text-red-700',
}
export const StatusBadge = ({ status }: { status: string }) => (
  <span className={cx('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold', statusColors[status] ?? 'bg-soft text-royal')}>{status}</span>
)
export const Badge = ({ children }: { children: ReactNode }) => (
  <span className="inline-flex items-center rounded-full bg-soft px-2.5 py-1 text-xs font-semibold text-royal">{children}</span>
)

export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={`Rating ${value} dari 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} width={size} height={size} className={i <= Math.round(value) ? 'fill-amber-400 text-amber-400' : 'text-navy/20'} />
      ))}
    </span>
  )
}

/* ---------- States ---------- */
export function EmptyState({ title, desc, action }: { title: string; desc?: string; action?: ReactNode }) {
  return (
    <div className="grid place-items-center rounded-3xl border border-dashed border-royal/25 bg-mist px-6 py-12 text-center">
      <Inbox className="mb-3 h-9 w-9 text-royal/50" aria-hidden="true" />
      <p className="font-bold">{title}</p>
      {desc && <p className="mt-1 max-w-sm text-sm text-navy/60">{desc}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export const Skeleton = ({ className }: { className?: string }) => <div className={cx('animate-pulse rounded-2xl bg-soft', className)} aria-hidden="true" />

export function SkeletonList({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3" role="status" aria-label="Memuat">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-20" />
      ))}
    </div>
  )
}

/* ---------- Modal & confirm ---------- */
export function Modal({ open, onClose, title, children, footer, size = 'md' }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; size?: 'md' | 'lg' }) {
  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', h)
      document.body.style.overflow = ''
    }
  }, [open, onClose])
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[70] grid place-items-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-navy/50" onClick={onClose} />
          <motion.div
            role="dialog" aria-modal="true" aria-label={title}
            initial={{ y: 16, scale: 0.98 }} animate={{ y: 0, scale: 1 }} exit={{ y: 16, scale: 0.98 }}
            className={cx('relative flex max-h-[90vh] w-full flex-col rounded-3xl bg-white shadow-pop', size === 'lg' ? 'max-w-3xl' : 'max-w-lg')}
          >
            <div className="flex items-center justify-between border-b border-royal/10 px-6 py-4">
              <h2 className="text-lg font-bold">{title}</h2>
              <button onClick={onClose} aria-label="Tutup" className="rounded-full p-1.5 text-navy/60 hover:bg-soft">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-y-auto px-6 py-5">{children}</div>
            {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-royal/10 px-6 py-4">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function ConfirmDialog({ open, title, message, confirmLabel = 'Ya, lanjutkan', tone = 'primary', onConfirm, onCancel }: {
  open: boolean; title: string; message: ReactNode; confirmLabel?: string; tone?: 'primary' | 'danger'; onConfirm: () => void; onCancel: () => void
}) {
  return (
    <Modal open={open} onClose={onCancel} title={title}
      footer={<>
        <Button variant="ghost" onClick={onCancel}>Batal</Button>
        <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm}>{confirmLabel}</Button>
      </>}>
      <div className="text-sm text-navy/80">{message}</div>
    </Modal>
  )
}

/* ---------- Accordion ---------- */
export function Accordion({ items }: { items: { id: string; q: string; a: string }[] }) {
  const [open, setOpen] = useState<string | null>(items[0]?.id ?? null)
  return (
    <div className="space-y-3">
      {items.map((it) => {
        const isOpen = open === it.id
        return (
          <div key={it.id} className="rounded-2xl border border-royal/10 bg-white shadow-card">
            <h3>
              <button className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-semibold" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : it.id)}>
                {it.q}
                <ChevronDown className={cx('h-5 w-5 shrink-0 text-royal transition', isOpen && 'rotate-180')} />
              </button>
            </h3>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <p className="px-5 pb-5 text-sm leading-relaxed text-navy/70">{it.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}

/* ---------- Stepper & Tabs ---------- */
export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="mb-8 flex items-center gap-2 overflow-x-auto no-scrollbar" aria-label="Progres">
      {steps.map((s, i) => (
        <li key={s} className="flex shrink-0 items-center gap-2" aria-current={i === current ? 'step' : undefined}>
          <span className={cx('grid h-8 w-8 place-items-center rounded-full text-sm font-bold', i < current ? 'bg-royal text-white' : i === current ? 'bg-royal text-white ring-4 ring-royal/20' : 'bg-soft text-royal/60')}>
            {i < current ? '✓' : i + 1}
          </span>
          <span className={cx('text-sm font-semibold', i === current ? 'text-navy' : 'text-navy/50')}>{s}</span>
          {i < steps.length - 1 && <span className="mx-1 h-px w-6 bg-royal/20" />}
        </li>
      ))}
    </ol>
  )
}

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { id: T; label: string; count?: number }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div role="tablist" className="mb-5 flex flex-wrap gap-2">
      {tabs.map((t) => (
        <button key={t.id} role="tab" aria-selected={value === t.id} onClick={() => onChange(t.id)}
          className={cx('rounded-full px-4 py-2 text-sm font-semibold transition', value === t.id ? 'bg-royal text-white' : 'bg-soft text-royal hover:bg-royal/10')}>
          {t.label}
          {t.count !== undefined && <span className={cx('ml-2 rounded-full px-2 py-0.5 text-xs', value === t.id ? 'bg-white/20' : 'bg-white')}>{t.count}</span>}
        </button>
      ))}
    </div>
  )
}

export function Logo({ light }: { light?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-royal text-white shadow-sm">
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" aria-hidden="true"><path d="M12 4v16M4 12h16" /></svg>
      </span>
      <span className={cx('leading-none', light ? 'text-white' : 'text-navy')}>
        <span className="block text-[11px] font-semibold uppercase tracking-wider opacity-70">Rumah Sakit</span>
        <span className="block text-lg font-extrabold tracking-tight">ANAVERSE</span>
      </span>
    </span>
  )
}
