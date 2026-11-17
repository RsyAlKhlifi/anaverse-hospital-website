import { useMemo } from 'react'
import type { ScheduleKind } from '../types'
import { useStore } from '../lib/store'
import { addDays, cx, DAY_SHORT, fmtDate, parseISO, toISO } from '../lib/utils'
import { EmptyState } from './ui'

export interface SlotValue { date: string; time: string }

/** Memilih tanggal + jam dari jadwal praktik dokter; jam yang sudah dipesan tidak dapat dipilih. */
export default function SlotPicker({ doctorId, kind, value, onChange }: { doctorId: string; kind: ScheduleKind; value: SlotValue; onChange: (v: SlotValue) => void }) {
  const db = useStore()
  const dates = useMemo(() => {
    const days = Array.from({ length: 28 }, (_, i) => toISO(addDays(new Date(), i)))
    return days.filter((d) => db.schedules.some((s) => s.doctorId === doctorId && s.kind === kind && s.weekday === parseISO(d).getDay()))
  }, [db.schedules, doctorId, kind])

  if (!dates.length)
    return <EmptyState title="Belum ada jadwal" desc={kind === 'online' ? 'Dokter ini belum membuka jadwal konsultasi online.' : 'Dokter ini belum memiliki jadwal praktik di rumah sakit.'} />

  const slots = value.date ? db.slotsFor(doctorId, value.date, kind) : []
  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-sm font-semibold">Pilih tanggal</p>
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1" role="radiogroup" aria-label="Tanggal">
          {dates.map((d) => {
            const full = !db.slotsFor(doctorId, d, kind).some((s) => s.available)
            const sel = value.date === d
            const dt = parseISO(d)
            return (
              <button key={d} role="radio" aria-checked={sel} disabled={full} onClick={() => onChange({ date: d, time: '' })}
                className={cx('flex w-16 shrink-0 flex-col items-center rounded-2xl border px-2 py-3 text-center transition', sel ? 'border-royal bg-royal text-white' : 'border-royal/20 bg-white hover:bg-soft', full && 'cursor-not-allowed opacity-40')}>
                <span className="text-xs font-semibold">{DAY_SHORT[dt.getDay()]}</span>
                <span className="text-xl font-extrabold leading-tight">{dt.getDate()}</span>
                <span className="text-[10px]">{full ? 'Penuh' : new Intl.DateTimeFormat('id-ID', { month: 'short' }).format(dt)}</span>
              </button>
            )
          })}
        </div>
      </div>
      {value.date && (
        <div>
          <p className="mb-2 text-sm font-semibold">Pilih jam — {fmtDate(value.date)}</p>
          {slots.length ? (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6" role="radiogroup" aria-label="Jam">
              {slots.map((s) => (
                <button key={s.time} role="radio" aria-checked={value.time === s.time} disabled={!s.available} onClick={() => onChange({ ...value, time: s.time })}
                  className={cx('rounded-xl border px-2 py-2.5 text-sm font-semibold transition', value.time === s.time ? 'border-royal bg-royal text-white' : 'border-royal/20 bg-white hover:bg-soft', !s.available && 'cursor-not-allowed bg-mist text-navy/30 line-through hover:bg-mist')}>
                  {s.time}
                </button>
              ))}
            </div>
          ) : <p className="rounded-2xl bg-mist px-4 py-3 text-sm text-navy/60">Tidak ada jam tersedia pada tanggal ini.</p>}
        </div>
      )}
    </div>
  )
}
