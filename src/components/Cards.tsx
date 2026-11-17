import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, Clock, MessageCircle, type LucideIcon } from 'lucide-react'
import type { Appointment, Consultation } from '../types'
import { doctorOf, specialtyName, useStore, userOf } from '../lib/store'
import { fmtDateShort } from '../lib/utils'
import { StatusBadge } from './ui'

type Who = 'patient' | 'doctor' | 'admin'

export function StatCard({ icon: I, label, value, hint }: { icon: LucideIcon; label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="flex items-center gap-4 rounded-3xl border border-royal/10 bg-white p-5 shadow-card">
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-soft text-royal"><I className="h-5 w-5" /></span>
      <div><p className="text-2xl font-extrabold leading-none">{value}</p><p className="mt-1 text-sm text-navy/60">{label}</p>{hint && <p className="text-xs text-navy/40">{hint}</p>}</div>
    </div>
  )
}

function Title({ doctorId, patientId, who }: { doctorId: string; patientId: string; who: Who }) {
  const db = useStore()
  const d = doctorOf(db, doctorId)
  const p = userOf(db, patientId)
  if (who === 'doctor') return <><p className="truncate font-bold">{p?.name ?? 'Pasien'}</p></>
  if (who === 'admin') return <><p className="truncate font-bold">{p?.name ?? 'Pasien'} → {d?.name}</p></>
  return <><p className="truncate font-bold">{d?.name}</p><p className="truncate text-xs text-navy/50">Spesialis {d && specialtyName(db, d.specialtyId)}</p></>
}

export function AppointmentItem({ a, who, onClick, actions }: { a: Appointment; who: Who; onClick?: () => void; actions?: ReactNode }) {
  const body = (
    <>
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-soft text-royal"><CalendarDays className="h-5 w-5" /></span>
      <div className="min-w-0 flex-1 text-left">
        <Title doctorId={a.doctorId} patientId={a.patientId} who={who} />
        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-navy/60"><Clock className="h-3.5 w-3.5" />{fmtDateShort(a.date)} · {a.time} · {a.ref}</p>
        {who !== 'patient' && <p className="mt-1 truncate text-xs text-navy/50">{a.complaint}</p>}
      </div>
      <StatusBadge status={a.status} />
    </>
  )
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-royal/10 bg-white p-4 shadow-card">
      {onClick ? <button onClick={onClick} className="flex min-w-0 flex-1 items-center gap-3 text-left">{body}</button> : <div className="flex min-w-0 flex-1 items-center gap-3">{body}</div>}
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export function ConsultationItem({ c, who, to, actions }: { c: Consultation; who: Who; to?: string; actions?: ReactNode }) {
  const body = (
    <>
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-soft text-royal"><MessageCircle className="h-5 w-5" /></span>
      <div className="min-w-0 flex-1">
        <Title doctorId={c.doctorId} patientId={c.patientId} who={who} />
        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-navy/60"><Clock className="h-3.5 w-3.5" />{fmtDateShort(c.date)} · {c.time} · {c.ref}</p>
        <p className="mt-1 truncate text-xs text-navy/50">{c.complaint}</p>
      </div>
      <StatusBadge status={c.status} />
    </>
  )
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-royal/10 bg-white p-4 shadow-card">
      {to ? <Link to={to} className="flex min-w-0 flex-1 items-center gap-3">{body}</Link> : <div className="flex min-w-0 flex-1 items-center gap-3">{body}</div>}
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}
