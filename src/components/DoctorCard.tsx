import { Link } from 'react-router-dom'
import { CalendarDays, Star } from 'lucide-react'
import type { Doctor, Schedule } from '../types'
import { useStore, specialtyName } from '../lib/store'
import { DAY_SHORT } from '../lib/utils'
import { btn, Img } from './ui'

export function scheduleSummary(schedules: Schedule[], doctorId: string, kind: 'offline' | 'online' = 'offline') {
  const list = schedules.filter((s) => s.doctorId === doctorId && s.kind === kind).sort((a, b) => a.weekday - b.weekday)
  if (!list.length) return 'Belum ada jadwal'
  return `${list.map((s) => DAY_SHORT[s.weekday]).join(', ')} · ${list[0].start}–${list[0].end}`
}

export default function DoctorCard({ doctor, compact }: { doctor: Doctor; compact?: boolean }) {
  const db = useStore()
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-3xl border border-royal/10 bg-white shadow-card transition hover:-translate-y-1 hover:shadow-pop">
      <Img src={doctor.photo} alt={`Foto ${doctor.name}`} className="aspect-[4/4] w-full bg-soft object-top" />
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-bold leading-snug">{doctor.name}</h3>
        <p className="text-sm text-navy/60">Spesialis {specialtyName(db, doctor.specialtyId)}</p>
        <div className="mt-2 flex items-center gap-3 text-sm">
          <span className="inline-flex items-center gap-1 font-semibold"><Star className="h-4 w-4 fill-amber-400 text-amber-400" />{doctor.rating.toFixed(1)}</span>
          <span className="text-navy/50">{doctor.experience} th pengalaman</span>
        </div>
        <p className="mt-3 flex items-start gap-2 text-xs text-navy/60"><CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-royal" />{scheduleSummary(db.schedules, doctor.id)}</p>
        {!compact && (
          <div className="mt-auto grid grid-cols-2 gap-2 pt-5">
            <Link to={`/dokter/${doctor.id}`} className={btn('outline', 'sm')}>Lihat Profil</Link>
            <Link to={`/pasien/janji-temu/baru?dokter=${doctor.id}`} className={btn('primary', 'sm')}>Buat Janji</Link>
          </div>
        )}
      </div>
    </article>
  )
}
