import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import type { Schedule, ScheduleKind } from '../types'
import { useStore } from '../lib/store'
import { DAY_NAMES, timeToMinutes, uid } from '../lib/utils'
import { Button, ConfirmDialog, EmptyState, Field, Select, Input, Badge } from './ui'
import { useToast } from './toast'

/** Mengelola jadwal praktik mingguan (offline/online) satu dokter. Dipakai di portal dokter dan admin. */
export default function ScheduleManager({ doctorId }: { doctorId: string }) {
  const { schedules, save, remove, appointments, consultations } = useStore()
  const toast = useToast()
  const mine = schedules.filter((s) => s.doctorId === doctorId).sort((a, b) => a.weekday - b.weekday || a.start.localeCompare(b.start))
  const [f, setF] = useState<{ weekday: string; start: string; end: string; kind: ScheduleKind }>({ weekday: '1', start: '09:00', end: '12:00', kind: 'offline' })
  const [del, setDel] = useState<Schedule | null>(null)

  const add = () => {
    const wd = Number(f.weekday)
    if (timeToMinutes(f.end) - timeToMinutes(f.start) < 30) return toast.error('Jam selesai harus minimal 30 menit setelah jam mulai.')
    const overlap = mine.some((s) => s.weekday === wd && timeToMinutes(f.start) < timeToMinutes(s.end) && timeToMinutes(f.end) > timeToMinutes(s.start))
    if (overlap) return toast.error('Jadwal bertumpuk dengan jadwal lain pada hari yang sama.')
    save<Schedule>('schedules', { id: uid('s'), doctorId, weekday: wd, start: f.start, end: f.end, kind: f.kind })
    toast.success('Jadwal ditambahkan.')
  }

  const hasFuture = (s: Schedule) => {
    const today = new Date().toISOString().slice(0, 10)
    const wdOf = (d: string) => new Date(`${d}T00:00:00`).getDay()
    return (
      appointments.some((a) => a.doctorId === doctorId && a.date >= today && wdOf(a.date) === s.weekday && a.time >= s.start && a.time < s.end && a.status !== 'Dibatalkan' && a.status !== 'Selesai') ||
      consultations.some((c) => c.doctorId === doctorId && c.date >= today && wdOf(c.date) === s.weekday && c.time >= s.start && c.time < s.end && c.status !== 'Dibatalkan' && c.status !== 'Selesai')
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid items-end gap-3 rounded-3xl bg-mist p-4 sm:grid-cols-5">
        <Field label="Hari"><Select value={f.weekday} onChange={(e) => setF({ ...f, weekday: e.target.value })}>{DAY_NAMES.map((d, i) => <option key={d} value={i}>{d}</option>)}</Select></Field>
        <Field label="Mulai"><Input type="time" value={f.start} onChange={(e) => setF({ ...f, start: e.target.value })} /></Field>
        <Field label="Selesai"><Input type="time" value={f.end} onChange={(e) => setF({ ...f, end: e.target.value })} /></Field>
        <Field label="Jenis"><Select value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value as ScheduleKind })}><option value="offline">Kunjungan RS</option><option value="online">Konsultasi online</option></Select></Field>
        <Button onClick={add}><Plus className="h-4 w-4" />Tambah</Button>
      </div>
      {mine.length ? (
        <ul className="divide-y divide-royal/10 rounded-3xl border border-royal/10 bg-white">
          {mine.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
              <span className="w-20 font-bold">{DAY_NAMES[s.weekday]}</span>
              <span className="text-navy/70">{s.start}–{s.end}</span>
              <Badge>{s.kind === 'online' ? 'Online' : 'Kunjungan RS'}</Badge>
              <Button variant="ghost" size="sm" className="ml-auto text-red-600" onClick={() => setDel(s)} aria-label={`Hapus jadwal ${DAY_NAMES[s.weekday]} ${s.start}`}><Trash2 className="h-4 w-4" />Hapus</Button>
            </li>
          ))}
        </ul>
      ) : <EmptyState title="Belum ada jadwal" desc="Tambahkan jadwal praktik agar pasien dapat membuat janji." />}
      <ConfirmDialog open={!!del} tone="danger" title="Hapus jadwal?" confirmLabel="Hapus"
        message={del && hasFuture(del) ? 'Masih ada janji atau konsultasi aktif pada jadwal ini. Janji yang sudah ada tetap berlaku, tetapi pasien baru tidak dapat memesan jam ini.' : 'Pasien tidak dapat lagi memesan jam pada jadwal ini.'}
        onCancel={() => setDel(null)} onConfirm={() => { if (del) remove('schedules', del.id); setDel(null); toast.success('Jadwal dihapus.') }} />
    </div>
  )
}
