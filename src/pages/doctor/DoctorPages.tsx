import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CalendarCheck, ClipboardList, MessageCircle, Search, Users } from 'lucide-react'
import type { Appointment, Consultation } from '../../types'
import { useStore, userOf } from '../../lib/store'
import { useDocumentTitle, useLoading } from '../../lib/hooks'
import { fmtDate, fmtDateShort, todayISO } from '../../lib/utils'
import { btn, Button, Card, EmptyState, Field, Input, Modal, PageHeader, Select, SkeletonList, StatusBadge, Tabs, Textarea } from '../../components/ui'
import { AppointmentItem, ConsultationItem, StatCard } from '../../components/Cards'
import ScheduleManager from '../../components/ScheduleManager'
import { useToast } from '../../components/toast'

function useDoctor() {
  const db = useStore()
  const doctorId = db.user?.doctorId ?? ''
  const appts = db.appointments.filter((a) => a.doctorId === doctorId)
  const cons = db.consultations.filter((c) => c.doctorId === doctorId)
  return { db, doctorId, appts, cons }
}
const byDate = <T extends { date: string; time: string }>(a: T, b: T) => (a.date + a.time).localeCompare(b.date + b.time)

export function DoctorDashboard() {
  useDocumentTitle('Dashboard Dokter')
  const { db, appts, cons } = useDoctor()
  const loading = useLoading()
  const today = todayISO()
  const pending = appts.filter((a) => a.status === 'Menunggu Konfirmasi').length + cons.filter((c) => c.status === 'Menunggu').length
  const patients = new Set([...appts, ...cons].map((x) => x.patientId)).size
  const todayAppts = appts.filter((a) => a.date === today && a.status === 'Dikonfirmasi').sort(byDate)
  const todayCons = cons.filter((c) => c.date === today && (c.status === 'Dijadwalkan' || c.status === 'Aktif')).sort(byDate)
  const upcomingAppts = appts.filter((a) => a.date > today && a.status === 'Dikonfirmasi').sort(byDate).slice(0, 4)
  const upcomingCons = cons.filter((c) => c.date > today && c.status === 'Dijadwalkan').sort(byDate).slice(0, 4)
  return (
    <div className="space-y-8">
      <PageHeader title={`Selamat datang, ${db.user?.name.replace(/,.*$/, '')}`} desc="Ringkasan agenda dan permintaan hari ini." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={CalendarCheck} label="Janji hari ini" value={todayAppts.length} />
        <StatCard icon={ClipboardList} label="Permintaan menunggu" value={pending} />
        <StatCard icon={MessageCircle} label="Konsultasi aktif" value={cons.filter((c) => c.status === 'Aktif').length} />
        <StatCard icon={Users} label="Pasien ditangani" value={patients} />
      </div>
      {pending > 0 && <Link to="/portal-dokter/permintaan" className={btn('primary', 'sm')}>Tinjau {pending} permintaan</Link>}
      <section>
        <h2 className="mb-3 text-lg font-bold">Agenda Hari Ini</h2>
        {loading ? <SkeletonList rows={2} /> : todayAppts.length || todayCons.length ? (
          <div className="space-y-3">
            {todayAppts.map((a) => <AppointmentItem key={a.id} a={a} who="doctor" />)}
            {todayCons.map((c) => <ConsultationItem key={c.id} c={c} who="doctor" to={`/portal-dokter/konsultasi/${c.id}`} />)}
          </div>
        ) : <EmptyState title="Tidak ada agenda hari ini" desc="Janji dan konsultasi yang dikonfirmasi untuk hari ini akan tampil di sini." />}
      </section>
      <section>
        <h2 className="mb-3 text-lg font-bold">Akan Datang</h2>
        {upcomingAppts.length || upcomingCons.length ? (
          <div className="space-y-3">
            {upcomingAppts.map((a) => <AppointmentItem key={a.id} a={a} who="doctor" />)}
            {upcomingCons.map((c) => <ConsultationItem key={c.id} c={c} who="doctor" to={`/portal-dokter/konsultasi/${c.id}`} />)}
          </div>
        ) : <EmptyState title="Belum ada jadwal mendatang" />}
      </section>
    </div>
  )
}

type Tab = 'requests' | 'appointments' | 'consultations'

export function DoctorRequests() {
  useDocumentTitle('Permintaan & Janji')
  const { db, appts, cons } = useDoctor()
  const toast = useToast()
  const nav = useNavigate()
  const loading = useLoading()
  const [tab, setTab] = useState<Tab>('requests')
  const [filter, setFilter] = useState('all')
  const [rej, setRej] = useState<{ kind: 'a' | 'c'; id: string } | null>(null)
  const [reason, setReason] = useState('')

  const pendA = appts.filter((a) => a.status === 'Menunggu Konfirmasi').sort(byDate)
  const pendC = cons.filter((c) => c.status === 'Menunggu').sort(byDate)

  const confirmA = (a: Appointment) => { db.setAppointmentStatus(a.id, 'Dikonfirmasi'); toast.success('Janji temu dikonfirmasi.') }
  const confirmC = (c: Consultation) => { db.setConsultationStatus(c.id, 'Dijadwalkan'); toast.success('Konsultasi diterima.') }
  const doReject = () => {
    if (!rej) return
    if (reason.trim().length < 5) return toast.error('Tuliskan alasan penolakan.')
    rej.kind === 'a' ? db.setAppointmentStatus(rej.id, 'Dibatalkan', reason.trim()) : db.setConsultationStatus(rej.id, 'Dibatalkan', { reason: reason.trim() })
    setRej(null); setReason(''); toast.success('Permintaan ditolak.')
  }
  const rejectBtn = (kind: 'a' | 'c', id: string) => <Button size="sm" variant="outline" onClick={() => { setRej({ kind, id }); setReason('') }}>Tolak</Button>

  const shownA = appts.filter((a) => filter === 'all' || a.status === filter).sort((a, b) => byDate(b, a))

  return (
    <div>
      <PageHeader title="Permintaan & Janji Temu" desc="Terima atau tolak permintaan, kelola status janji dan konsultasi." />
      <Tabs<Tab> value={tab} onChange={setTab} tabs={[{ id: 'requests', label: 'Permintaan Baru', count: pendA.length + pendC.length }, { id: 'appointments', label: 'Janji Offline', count: appts.length }, { id: 'consultations', label: 'Konsultasi Online', count: cons.length }]} />
      {loading ? <SkeletonList /> : (
        <>
          {tab === 'requests' && (pendA.length + pendC.length ? (
            <div className="space-y-3">
              {pendA.map((a) => <AppointmentItem key={a.id} a={a} who="doctor" actions={<><Button size="sm" onClick={() => confirmA(a)}>Terima</Button>{rejectBtn('a', a.id)}</>} />)}
              {pendC.map((c) => <ConsultationItem key={c.id} c={c} who="doctor" actions={<><Button size="sm" onClick={() => confirmC(c)}>Terima</Button>{rejectBtn('c', c.id)}</>} />)}
            </div>
          ) : <EmptyState title="Tidak ada permintaan baru" desc="Permintaan janji offline dan konsultasi online akan muncul di sini." />)}

          {tab === 'appointments' && (
            <div className="space-y-4">
              <div className="max-w-xs"><Select aria-label="Filter status" value={filter} onChange={(e) => setFilter(e.target.value)}><option value="all">Semua status</option><option>Menunggu Konfirmasi</option><option>Dikonfirmasi</option><option>Selesai</option><option>Dibatalkan</option></Select></div>
              {shownA.length ? shownA.map((a) => (
                <AppointmentItem key={a.id} a={a} who="doctor" actions={<>
                  {a.status === 'Menunggu Konfirmasi' && <><Button size="sm" onClick={() => confirmA(a)}>Konfirmasi</Button>{rejectBtn('a', a.id)}</>}
                  {a.status === 'Dikonfirmasi' && <Button size="sm" variant="soft" onClick={() => { db.setAppointmentStatus(a.id, 'Selesai'); toast.success('Ditandai selesai.') }}>Tandai Selesai</Button>}
                </>} />
              )) : <EmptyState title="Tidak ada janji temu" />}
            </div>
          )}

          {tab === 'consultations' && (cons.length ? (
            <div className="space-y-3">
              {[...cons].sort((a, b) => byDate(b, a)).map((c) => (
                <ConsultationItem key={c.id} c={c} who="doctor" to={`/portal-dokter/konsultasi/${c.id}`} actions={<>
                  {c.status === 'Menunggu' && <><Button size="sm" onClick={() => confirmC(c)}>Terima</Button>{rejectBtn('c', c.id)}</>}
                  {c.status === 'Dijadwalkan' && <Button size="sm" onClick={() => { db.setConsultationStatus(c.id, 'Aktif'); toast.success('Sesi dimulai.'); nav(`/portal-dokter/konsultasi/${c.id}`) }}>Mulai Sesi</Button>}
                  {c.status === 'Aktif' && <Link to={`/portal-dokter/konsultasi/${c.id}`} className={btn('soft', 'sm')}>Buka Chat</Link>}
                </>} />
              ))}
            </div>
          ) : <EmptyState title="Belum ada konsultasi online" />)}
        </>
      )}

      <Modal open={!!rej} onClose={() => setRej(null)} title="Tolak permintaan"
        footer={<><Button variant="ghost" onClick={() => setRej(null)}>Batal</Button><Button variant="danger" onClick={doReject}>Tolak Permintaan</Button></>}>
        <Field label="Alasan penolakan (dilihat pasien)"><Textarea value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
      </Modal>
    </div>
  )
}

export function DoctorSchedule() {
  useDocumentTitle('Jadwal Praktik')
  const { doctorId } = useDoctor()
  return (
    <div>
      <PageHeader title="Jadwal Praktik" desc="Atur hari dan jam praktik untuk kunjungan rumah sakit dan konsultasi online. Pasien hanya dapat memesan pada jam yang Anda buka." />
      <ScheduleManager doctorId={doctorId} />
    </div>
  )
}

export function DoctorPatients() {
  useDocumentTitle('Pasien Saya')
  const { db, appts, cons } = useDoctor()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState<string | null>(null)
  const loading = useLoading()
  const list = useMemo(() => {
    const ids = [...new Set([...appts, ...cons].map((x) => x.patientId))]
    return ids.map((id) => userOf(db, id)).filter(Boolean).filter((u) => u!.name.toLowerCase().includes(q.toLowerCase()))
  }, [db, appts, cons, q])
  const p = open ? userOf(db, open) : undefined
  return (
    <div>
      <PageHeader title="Pasien Saya" desc="Pasien yang pernah membuat janji atau konsultasi dengan Anda." />
      <div className="relative mb-5 max-w-sm"><Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-navy/40" /><Input className="pl-11" placeholder="Cari pasien…" aria-label="Cari pasien" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      {loading ? <SkeletonList /> : list.length ? (
        <ul className="divide-y divide-royal/10 rounded-3xl border border-royal/10 bg-white">
          {list.map((u) => (
            <li key={u!.id} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1"><p className="font-bold">{u!.name}</p><p className="text-xs text-navy/50">{u!.phone} · {appts.filter((a) => a.patientId === u!.id).length} janji · {cons.filter((c) => c.patientId === u!.id).length} konsultasi</p></div>
              <Button size="sm" variant="soft" onClick={() => setOpen(u!.id)}>Lihat Info</Button>
            </li>
          ))}
        </ul>
      ) : <EmptyState title="Pasien tidak ditemukan" desc="Pasien muncul setelah membuat janji atau konsultasi dengan Anda." />}
      <Modal open={!!p} onClose={() => setOpen(null)} title="Informasi Pasien" size="lg">
        {p && (
          <div className="space-y-5 text-sm">
            <dl className="grid gap-3 sm:grid-cols-2">
              {[['Nama', p.name], ['Telepon', p.phone], ['Email', p.email], ['Jenis kelamin', p.gender || '—'], ['Tanggal lahir', p.birthDate ? fmtDateShort(p.birthDate) : '—'], ['Alamat', p.address || '—']].map(([k, v]) => <div key={k}><dt className="text-xs text-navy/50">{k}</dt><dd className="font-semibold">{v}</dd></div>)}
            </dl>
            <div><h3 className="mb-2 font-bold">Riwayat bersama Anda</h3>
              <ul className="space-y-2">
                {appts.filter((a) => a.patientId === p.id).sort((a, b) => byDate(b, a)).map((a) => <li key={a.id} className="flex items-center justify-between gap-3 rounded-2xl bg-mist px-4 py-2"><span>Janji · {fmtDate(a.date)} {a.time}<br /><span className="text-xs text-navy/50">{a.complaint}</span></span><StatusBadge status={a.status} /></li>)}
                {cons.filter((c) => c.patientId === p.id).sort((a, b) => byDate(b, a)).map((c) => <li key={c.id} className="flex items-center justify-between gap-3 rounded-2xl bg-mist px-4 py-2"><span>Konsultasi · {fmtDate(c.date)} {c.time}<br /><span className="text-xs text-navy/50">{c.complaint}</span></span><StatusBadge status={c.status} /></li>)}
              </ul></div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export function DoctorHistory() {
  useDocumentTitle('Riwayat')
  const { appts, cons } = useDoctor()
  const doneA = appts.filter((a) => a.status === 'Selesai').sort((a, b) => byDate(b, a))
  const doneC = cons.filter((c) => c.status === 'Selesai').sort((a, b) => byDate(b, a))
  return (
    <div className="space-y-8">
      <PageHeader title="Riwayat" desc="Janji temu dan konsultasi yang telah selesai." />
      <section><h2 className="mb-3 text-lg font-bold">Konsultasi Online Selesai</h2>
        {doneC.length ? <div className="space-y-3">{doneC.map((c) => <Card key={c.id} className="p-0"><ConsultationItem c={c} who="doctor" to={`/portal-dokter/konsultasi/${c.id}`} /></Card>)}</div> : <EmptyState title="Belum ada konsultasi selesai" />}</section>
      <section><h2 className="mb-3 text-lg font-bold">Janji Offline Selesai</h2>
        {doneA.length ? <div className="space-y-3">{doneA.map((a) => <AppointmentItem key={a.id} a={a} who="doctor" />)}</div> : <EmptyState title="Belum ada janji selesai" />}</section>
    </div>
  )
}
