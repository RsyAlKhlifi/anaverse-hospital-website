import { Link } from 'react-router-dom'
import { CalendarPlus, History, MessageCircle, UserRound, Phone, Mail } from 'lucide-react'
import { useStore } from '../../lib/store'
import { useDocumentTitle, useLoading } from '../../lib/hooks'
import { initials, todayISO } from '../../lib/utils'
import { Card, EmptyState, PageHeader, SkeletonList } from '../../components/ui'
import { AppointmentItem, ConsultationItem } from '../../components/Cards'

export default function PatientDashboard() {
  useDocumentTitle('Dashboard Pasien')
  const db = useStore()
  const { user } = db
  const loading = useLoading()
  if (!user) return null
  const today = todayISO()
  const upcoming = db.appointments
    .filter((a) => a.patientId === user.id && (a.status === 'Menunggu Konfirmasi' || a.status === 'Dikonfirmasi') && a.date >= today)
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
  const active = db.consultations.filter((c) => c.patientId === user.id && ['Menunggu', 'Dijadwalkan', 'Aktif'].includes(c.status))
  const prev = db.consultations.filter((c) => c.patientId === user.id && c.status === 'Selesai').sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3)

  const actions = [
    { to: '/pasien/konsultasi', icon: MessageCircle, t: 'Konsultasi Online' },
    { to: '/pasien/janji-temu/baru', icon: CalendarPlus, t: 'Buat Janji Offline' },
    { to: '/pasien/riwayat-konsultasi', icon: History, t: 'Riwayat Konsultasi' },
    { to: '/pasien/profil', icon: UserRound, t: 'Profil Saya' },
  ]
  return (
    <div className="space-y-8">
      <PageHeader title={`Halo, ${user.name.split(' ')[0]}!`} desc="Kelola janji temu dan konsultasi Anda di sini." />
      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {actions.map((a) => (
            <Link key={a.to} to={a.to} className="group flex flex-col items-center gap-3 rounded-3xl border border-royal/10 bg-white p-5 text-center shadow-card transition hover:-translate-y-1 hover:bg-royal hover:text-white">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-soft text-royal transition group-hover:bg-white/20 group-hover:text-white"><a.icon className="h-5 w-5" /></span>
              <span className="text-sm font-bold">{a.t}</span>
            </Link>
          ))}
        </div>
        <Card className="flex items-center gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-royal text-lg font-bold text-white">{initials(user.name)}</span>
          <div className="min-w-0 text-sm"><p className="truncate font-bold">{user.name}</p>
            <p className="flex items-center gap-1.5 truncate text-navy/60"><Mail className="h-3.5 w-3.5 shrink-0" />{user.email}</p>
            <p className="flex items-center gap-1.5 text-navy/60"><Phone className="h-3.5 w-3.5 shrink-0" />{user.phone}</p></div>
        </Card>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-bold">Janji Temu Mendatang</h2><Link to="/pasien/janji-temu" className="text-sm font-semibold text-royal">Lihat semua</Link></div>
        {loading ? <SkeletonList rows={2} /> : upcoming.length ? <div className="space-y-3">{upcoming.slice(0, 3).map((a) => <AppointmentItem key={a.id} a={a} who="patient" />)}</div>
          : <EmptyState title="Belum ada janji temu" desc="Buat janji untuk berkunjung ke rumah sakit." action={<Link to="/pasien/janji-temu/baru" className="font-semibold text-royal">Buat janji sekarang</Link>} />}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Konsultasi Online Aktif</h2>
        {loading ? <SkeletonList rows={1} /> : active.length ? <div className="space-y-3">{active.map((c) => <ConsultationItem key={c.id} c={c} who="patient" to={`/pasien/konsultasi/${c.id}`} />)}</div>
          : <EmptyState title="Tidak ada konsultasi aktif" action={<Link to="/pasien/konsultasi" className="font-semibold text-royal">Mulai konsultasi</Link>} />}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-bold">Konsultasi Sebelumnya</h2><Link to="/pasien/riwayat-konsultasi" className="text-sm font-semibold text-royal">Lihat semua</Link></div>
        {loading ? <SkeletonList rows={2} /> : prev.length ? <div className="space-y-3">{prev.map((c) => <ConsultationItem key={c.id} c={c} who="patient" to={`/pasien/konsultasi/${c.id}`} />)}</div>
          : <EmptyState title="Belum ada riwayat konsultasi" />}
      </section>
    </div>
  )
}
