import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Award, GraduationCap, Star } from 'lucide-react'
import { useStore, specialtyName } from '../../lib/store'
import { useDocumentTitle } from '../../lib/hooks'
import { DAY_NAMES } from '../../lib/utils'
import { Badge, btn, Img } from '../../components/ui'
import NotFound from './NotFound'

export default function DoctorProfile() {
  const { id } = useParams()
  const db = useStore()
  const d = db.doctors.find((x) => x.id === id)
  useDocumentTitle(d?.name ?? 'Dokter')
  if (!d) return <NotFound />
  const rows = (kind: 'offline' | 'online') => db.schedules.filter((s) => s.doctorId === d.id && s.kind === kind).sort((a, b) => a.weekday - b.weekday)
  const table = (title: string, kind: 'offline' | 'online') => (
    <div>
      <h3 className="mb-2 font-bold">{title}</h3>
      {rows(kind).length ? (
        <ul className="divide-y divide-royal/10 rounded-2xl border border-royal/10 bg-white">
          {rows(kind).map((s) => <li key={s.id} className="flex justify-between px-4 py-3 text-sm"><span className="font-semibold">{DAY_NAMES[s.weekday]}</span><span className="text-navy/70">{s.start}–{s.end}</span></li>)}
        </ul>
      ) : <p className="rounded-2xl bg-mist px-4 py-3 text-sm text-navy/60">Belum ada jadwal.</p>}
    </div>
  )
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Link to="/dokter" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-royal"><ArrowLeft className="h-4 w-4" />Semua dokter</Link>
      <div className="grid gap-10 md:grid-cols-[18rem_1fr]">
        <Img src={d.photo} alt={`Foto ${d.name}`} className="aspect-square w-full rounded-[2rem] object-top shadow-pop" />
        <div>
          <Badge>Spesialis {specialtyName(db, d.specialtyId)}</Badge>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight">{d.name}</h1>
          <div className="mt-3 flex flex-wrap gap-4 text-sm text-navy/70">
            <span className="inline-flex items-center gap-1.5 font-semibold"><Star className="h-4 w-4 fill-amber-400 text-amber-400" />{d.rating.toFixed(1)}</span>
            <span className="inline-flex items-center gap-1.5"><Award className="h-4 w-4 text-royal" />{d.experience} tahun pengalaman</span>
            <span className="inline-flex items-center gap-1.5"><GraduationCap className="h-4 w-4 text-royal" />{d.education}</span>
          </div>
          <p className="mt-5 leading-relaxed text-navy/70">{d.bio}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to={`/pasien/janji-temu/baru?dokter=${d.id}`} className={btn('primary', 'lg')}>Buat Janji Temu</Link>
            <Link to={`/pasien/konsultasi?dokter=${d.id}`} className={btn('outline', 'lg')}>Konsultasi Online</Link>
          </div>
        </div>
      </div>
      <h2 className="mb-4 mt-12 text-xl font-bold">Jadwal Praktik</h2>
      <div className="grid gap-6 md:grid-cols-2">{table('Kunjungan ke rumah sakit', 'offline')}{table('Konsultasi online', 'online')}</div>
    </div>
  )
}
