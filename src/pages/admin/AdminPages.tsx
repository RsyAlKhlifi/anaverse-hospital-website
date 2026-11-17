import { useMemo, useState } from 'react'
import { CalendarCheck, ClipboardList, MessageCircle, Pencil, Plus, Search, Stethoscope, Trash2, Users } from 'lucide-react'
import type { Appointment, Doctor, Specialty } from '../../types'
import { doctorOf, specialtyName, useStore, userOf } from '../../lib/store'
import { useDocumentTitle, useLoading } from '../../lib/hooks'
import { cx, fmtDate, fmtDateShort, fmtDateTime, monthKey, monthLabel, todayISO, uid, addDays } from '../../lib/utils'
import { Badge, Button, Card, ConfirmDialog, EmptyState, Field, Img, Input, Modal, PageHeader, Select, SkeletonList, StatusBadge, Tabs, Textarea } from '../../components/ui'
import { AppointmentItem, StatCard } from '../../components/Cards'
import ScheduleManager from '../../components/ScheduleManager'
import ContentManager, { type FieldDef } from '../../components/ContentManager'
import { Icon } from '../../components/Icon'
import { useToast } from '../../components/toast'
import { IMG } from '../../data/images'

/* ============ Overview ============ */
export function AdminOverview() {
  useDocumentTitle('Dashboard Admin')
  const db = useStore()
  const toast = useToast()
  const loading = useLoading()
  const patients = db.users.filter((u) => u.role === 'patient')
  const pending = db.appointments.filter((a) => a.status === 'Menunggu Konfirmasi').sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
  const recent = [...patients].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5)
  return (
    <div className="space-y-8">
      <PageHeader title="Ringkasan Platform" desc="Pantau aktivitas rumah sakit secara keseluruhan." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard icon={Users} label="Pasien terdaftar" value={patients.length} />
        <StatCard icon={Stethoscope} label="Dokter" value={db.doctors.length} />
        <StatCard icon={CalendarCheck} label="Total janji temu" value={db.appointments.length} />
        <StatCard icon={MessageCircle} label="Konsultasi online" value={db.consultations.length} />
        <StatCard icon={ClipboardList} label="Janji menunggu" value={pending.length} />
      </div>
      <div className="grid gap-8 xl:grid-cols-[1fr_22rem]">
        <section>
          <h2 className="mb-3 text-lg font-bold">Janji Menunggu Konfirmasi</h2>
          {loading ? <SkeletonList /> : pending.length ? (
            <div className="space-y-3">
              {pending.slice(0, 6).map((a) => (
                <AppointmentItem key={a.id} a={a} who="admin" actions={<>
                  <Button size="sm" onClick={() => { db.setAppointmentStatus(a.id, 'Dikonfirmasi'); toast.success('Janji dikonfirmasi.') }}>Konfirmasi</Button>
                  <Button size="sm" variant="outline" onClick={() => { db.setAppointmentStatus(a.id, 'Dibatalkan', 'Ditolak oleh admin'); toast.success('Janji ditolak.') }}>Tolak</Button>
                </>} />
              ))}
            </div>
          ) : <EmptyState title="Tidak ada janji menunggu" desc="Semua permintaan sudah ditangani." />}
        </section>
        <section>
          <h2 className="mb-3 text-lg font-bold">Pendaftar Terbaru</h2>
          <Card className="p-0"><ul className="divide-y divide-royal/10">{recent.map((u) => <li key={u.id} className="px-4 py-3 text-sm"><b>{u.name}</b><p className="text-xs text-navy/50">{fmtDateTime(u.createdAt)}</p></li>)}</ul></Card>
        </section>
      </div>
    </div>
  )
}

/* ============ Doctors ============ */
const emptyDoctor = (spId: string): Doctor => ({ id: uid('d'), name: '', specialtyId: spId, experience: 1, rating: 4.5, photo: IMG.doctorM1, bio: '', education: '' })

export function AdminDoctors() {
  useDocumentTitle('Kelola Dokter')
  const db = useStore()
  const toast = useToast()
  const [tab, setTab] = useState<'doctors' | 'specialties'>('doctors')
  const [q, setQ] = useState('')
  const [edit, setEdit] = useState<Doctor | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [acc, setAcc] = useState({ email: '', password: '' })
  const [err, setErr] = useState<Record<string, string>>({})
  const [del, setDel] = useState<Doctor | null>(null)
  const [sch, setSch] = useState<Doctor | null>(null)
  const [saving, setSaving] = useState(false)
  const list = db.doctors.filter((d) => `${d.name} ${specialtyName(db, d.specialtyId)}`.toLowerCase().includes(q.toLowerCase()))

  const open = (d?: Doctor) => { setIsNew(!d); setEdit(d ?? emptyDoctor(db.specialties[0]?.id ?? '')); setAcc({ email: '', password: '' }); setErr({}) }
  const submit = async () => {
    if (!edit || saving) return
    const n: Record<string, string> = {}
    if (edit.name.trim().length < 5) n.name = 'Nama lengkap dengan gelar wajib diisi.'
    if (!edit.specialtyId) n.specialtyId = 'Pilih spesialisasi.'
    if (!(edit.experience >= 0 && edit.experience <= 60)) n.experience = 'Pengalaman 0–60 tahun.'
    if (!(edit.rating >= 0 && edit.rating <= 5)) n.rating = 'Rating 0–5.'
    if (isNew && acc.password.length < 8) n.password = 'Kata sandi sementara minimal 8 karakter.'
    if (isNew && !acc.email) n.email = 'Email akun wajib diisi.'
    setErr(n)
    if (Object.keys(n).length) return
    setSaving(true)
    const r = await db.saveDoctorWithAccount(edit, isNew ? acc : undefined)
    setSaving(false)
    if (!r.ok) return setErr({ [isNew ? 'email' : 'name']: r.error! })
    setEdit(null)
    toast.success('Data dokter disimpan.')
  }
  const confirmDelete = () => {
    if (!del) return
    const r = db.deleteDoctor(del.id)
    setDel(null)
    r.ok ? toast.success('Dokter dihapus.') : toast.error(r.error!)
  }

  return (
    <div>
      <PageHeader title="Kelola Dokter" desc="Tambah, ubah, hapus dokter, atur spesialisasi dan jadwal praktik." />
      <Tabs value={tab} onChange={setTab} tabs={[{ id: 'doctors', label: 'Dokter', count: db.doctors.length }, { id: 'specialties', label: 'Spesialisasi', count: db.specialties.length }]} />
      {tab === 'doctors' ? (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-full max-w-sm"><Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-navy/40" /><Input className="pl-11" placeholder="Cari dokter…" aria-label="Cari dokter" value={q} onChange={(e) => setQ(e.target.value)} /></div>
            <Button onClick={() => open()}><Plus className="h-4 w-4" />Tambah Dokter</Button>
          </div>
          {list.length ? (
            <ul className="divide-y divide-royal/10 rounded-3xl border border-royal/10 bg-white">
              {list.map((d) => (
                <li key={d.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <Img src={d.photo} alt={d.name} className="h-12 w-12 rounded-full object-top" />
                  <div className="min-w-0 flex-1"><p className="font-bold">{d.name}</p><p className="text-xs text-navy/50">Spesialis {specialtyName(db, d.specialtyId)} · {d.experience} th · ★ {d.rating.toFixed(1)}</p></div>
                  <Button size="sm" variant="soft" onClick={() => setSch(d)}>Jadwal</Button>
                  <Button size="sm" variant="ghost" onClick={() => open(d)} aria-label={`Ubah ${d.name}`}><Pencil className="h-4 w-4" />Ubah</Button>
                  <Button size="sm" variant="ghost" className="text-red-600" onClick={() => setDel(d)} aria-label={`Hapus ${d.name}`}><Trash2 className="h-4 w-4" />Hapus</Button>
                </li>
              ))}
            </ul>
          ) : <EmptyState title="Dokter tidak ditemukan" />}
        </>
      ) : <SpecialtiesManager />}

      <Modal open={!!edit} onClose={() => setEdit(null)} title={isNew ? 'Tambah Dokter' : 'Ubah Dokter'} size="lg"
        footer={<><Button variant="ghost" onClick={() => setEdit(null)}>Batal</Button><Button onClick={submit}>Simpan</Button></>}>
        {edit && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nama lengkap & gelar" error={err.name} className="sm:col-span-2"><Input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
            <Field label="Spesialisasi" error={err.specialtyId}><Select value={edit.specialtyId} onChange={(e) => setEdit({ ...edit, specialtyId: e.target.value })}>{db.specialties.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></Field>
            <Field label="Pendidikan"><Input value={edit.education} onChange={(e) => setEdit({ ...edit, education: e.target.value })} /></Field>
            <Field label="Pengalaman (tahun)" error={err.experience}><Input type="number" min={0} max={60} value={edit.experience} onChange={(e) => setEdit({ ...edit, experience: Number(e.target.value) })} /></Field>
            <Field label="Rating (0–5)" error={err.rating}><Input type="number" min={0} max={5} step="0.1" value={edit.rating} onChange={(e) => setEdit({ ...edit, rating: Number(e.target.value) })} /></Field>
            <Field label="URL foto" className="sm:col-span-2" hint="Gunakan foto berlisensi milik rumah sakit."><Input value={edit.photo} onChange={(e) => setEdit({ ...edit, photo: e.target.value })} /></Field>
            <Field label="Profil singkat" className="sm:col-span-2"><Textarea rows={3} value={edit.bio} onChange={(e) => setEdit({ ...edit, bio: e.target.value })} /></Field>
            {isNew && <>
              <Field label="Email akun dokter" error={err.email}><Input type="email" value={acc.email} onChange={(e) => setAcc({ ...acc, email: e.target.value })} /></Field>
              <Field label="Kata sandi sementara" error={err.password}><Input type="text" value={acc.password} onChange={(e) => setAcc({ ...acc, password: e.target.value })} /></Field>
            </>}
          </div>
        )}
      </Modal>
      <Modal open={!!sch} onClose={() => setSch(null)} title={`Jadwal ${sch?.name ?? ''}`} size="lg">{sch && <ScheduleManager doctorId={sch.id} />}</Modal>
      <ConfirmDialog open={!!del} tone="danger" title="Hapus dokter?" confirmLabel="Hapus" message={<>Dokter <b>{del?.name}</b> dan jadwalnya akan dihapus, dan akun loginnya dinonaktifkan. Dokter yang masih memiliki janji atau konsultasi, termasuk riwayat, tidak dapat dihapus.</>} onCancel={() => setDel(null)} onConfirm={confirmDelete} />
    </div>
  )
}

function SpecialtiesManager() {
  const db = useStore()
  const toast = useToast()
  const [edit, setEdit] = useState<Specialty | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [err, setErr] = useState('')
  const [del, setDel] = useState<Specialty | null>(null)
  const open = (s?: Specialty) => { setIsNew(!s); setEdit(s ?? { id: uid('sp'), name: '', icon: 'Stethoscope' }); setErr('') }
  const submit = () => {
    if (!edit) return
    if (edit.name.trim().length < 3) return setErr('Nama spesialisasi minimal 3 karakter.')
    if (db.specialties.some((s) => s.id !== edit.id && s.name.toLowerCase() === edit.name.trim().toLowerCase())) return setErr('Spesialisasi sudah ada.')
    db.save('specialties', { ...edit, name: edit.name.trim() })
    setEdit(null); toast.success('Spesialisasi disimpan.')
  }
  const used = (id: string) => db.doctors.filter((d) => d.specialtyId === id).length
  return (
    <div>
      <div className="mb-4 flex justify-end"><Button onClick={() => open()}><Plus className="h-4 w-4" />Tambah Spesialisasi</Button></div>
      <ul className="divide-y divide-royal/10 rounded-3xl border border-royal/10 bg-white">
        {db.specialties.map((s) => (
          <li key={s.id} className="flex items-center gap-3 px-4 py-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-soft text-royal"><Icon name={s.icon} className="h-5 w-5" /></span>
            <div className="flex-1"><p className="font-bold">{s.name}</p><p className="text-xs text-navy/50">{used(s.id)} dokter</p></div>
            <Button size="sm" variant="ghost" onClick={() => open(s)}><Pencil className="h-4 w-4" />Ubah</Button>
            <Button size="sm" variant="ghost" className="text-red-600" onClick={() => (used(s.id) ? toast.error('Masih dipakai dokter. Pindahkan dokter terlebih dahulu.') : setDel(s))}><Trash2 className="h-4 w-4" />Hapus</Button>
          </li>
        ))}
      </ul>
      <Modal open={!!edit} onClose={() => setEdit(null)} title={isNew ? 'Tambah Spesialisasi' : 'Ubah Spesialisasi'}
        footer={<><Button variant="ghost" onClick={() => setEdit(null)}>Batal</Button><Button onClick={submit}>Simpan</Button></>}>
        {edit && <div className="space-y-4">
          <Field label="Nama" error={err}><Input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
          <Field label="Ikon"><Select value={edit.icon} onChange={(e) => setEdit({ ...edit, icon: e.target.value })}>{['Stethoscope', 'HeartPulse', 'Baby', 'Scissors', 'Brain', 'Sparkles', 'Eye', 'Bone', 'Activity', 'Syringe'].map((i) => <option key={i}>{i}</option>)}</Select></Field>
        </div>}
      </Modal>
      <ConfirmDialog open={!!del} tone="danger" title="Hapus spesialisasi?" confirmLabel="Hapus" message={`Spesialisasi ${del?.name} akan dihapus.`} onCancel={() => setDel(null)} onConfirm={() => { if (del) db.remove('specialties', del.id); setDel(null); toast.success('Spesialisasi dihapus.') }} />
    </div>
  )
}

/* ============ Patients ============ */
export function AdminPatients() {
  useDocumentTitle('Kelola Pasien')
  const db = useStore()
  const toast = useToast()
  const loading = useLoading()
  const [q, setQ] = useState('')
  const [view, setView] = useState<string | null>(null)
  const [toggle, setToggle] = useState<string | null>(null)
  const patients = db.users.filter((u) => u.role === 'patient' && `${u.name} ${u.email}`.toLowerCase().includes(q.toLowerCase()))
  const p = view ? userOf(db, view) : undefined
  const t = toggle ? userOf(db, toggle) : undefined
  return (
    <div>
      <PageHeader title="Kelola Pasien" desc="Lihat data pasien terdaftar dan kelola status akun." />
      <div className="relative mb-5 max-w-sm"><Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-navy/40" /><Input className="pl-11" placeholder="Cari nama atau email…" aria-label="Cari pasien" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      {loading ? <SkeletonList /> : patients.length ? (
        <div className="overflow-x-auto rounded-3xl border border-royal/10 bg-white">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="bg-mist text-xs uppercase text-navy/50"><tr><th className="px-4 py-3">Nama</th><th className="px-4 py-3">Kontak</th><th className="px-4 py-3">Terdaftar</th><th className="px-4 py-3">Status</th><th className="px-4 py-3" /></tr></thead>
            <tbody className="divide-y divide-royal/10">
              {patients.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3 font-bold">{u.name}</td>
                  <td className="px-4 py-3 text-navy/70">{u.email}<br /><span className="text-xs">{u.phone}</span></td>
                  <td className="px-4 py-3 text-navy/70">{fmtDateShort(u.createdAt.slice(0, 10))}</td>
                  <td className="px-4 py-3"><Badge>{u.active ? 'Aktif' : 'Nonaktif'}</Badge></td>
                  <td className="space-x-2 px-4 py-3 text-right"><Button size="sm" variant="soft" onClick={() => setView(u.id)}>Detail</Button><Button size="sm" variant="ghost" onClick={() => setToggle(u.id)}>{u.active ? 'Nonaktifkan' : 'Aktifkan'}</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <EmptyState title="Pasien tidak ditemukan" />}
      <Modal open={!!p} onClose={() => setView(null)} title="Detail Pasien">
        {p && (
          <dl className="space-y-3 text-sm">
            {[['Nama', p.name], ['Email', p.email], ['Telepon', p.phone], ['Jenis kelamin', p.gender || '—'], ['Tanggal lahir', p.birthDate ? fmtDateShort(p.birthDate) : '—'], ['Alamat', p.address || '—'], ['Terdaftar', fmtDateTime(p.createdAt)], ['Janji temu', String(db.appointments.filter((a) => a.patientId === p.id).length)], ['Konsultasi', String(db.consultations.filter((c) => c.patientId === p.id).length)]].map(([k, v]) => <div key={k} className="flex justify-between gap-4"><dt className="text-navy/50">{k}</dt><dd className="text-right font-semibold">{v}</dd></div>)}
          </dl>
        )}
      </Modal>
      <ConfirmDialog open={!!t} tone={t?.active ? 'danger' : 'primary'} title={t?.active ? 'Nonaktifkan akun?' : 'Aktifkan akun?'} confirmLabel={t?.active ? 'Nonaktifkan' : 'Aktifkan'}
        message={t?.active ? `${t?.name} tidak akan dapat masuk sampai akun diaktifkan kembali. Data tidak dihapus.` : `${t?.name} dapat masuk kembali.`}
        onCancel={() => setToggle(null)} onConfirm={() => { if (t) { db.setUserActive(t.id, !t.active); toast.success('Status akun diperbarui.') } setToggle(null) }} />
    </div>
  )
}

/* ============ Appointments ============ */
const STATUSES: Appointment['status'][] = ['Menunggu Konfirmasi', 'Dikonfirmasi', 'Selesai', 'Dibatalkan']

export function AdminAppointments() {
  useDocumentTitle('Kelola Janji Temu')
  const db = useStore()
  const toast = useToast()
  const loading = useLoading()
  const [date, setDate] = useState('')
  const [doctor, setDoctor] = useState('all')
  const [status, setStatus] = useState('all')
  const list = db.appointments
    .filter((a) => (!date || a.date === date) && (doctor === 'all' || a.doctorId === doctor) && (status === 'all' || a.status === status))
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time))
  return (
    <div>
      <PageHeader title="Kelola Janji Temu" desc="Konfirmasi, tolak, dan perbarui status janji temu." />
      <div className="mb-5 grid gap-3 sm:grid-cols-4">
        <Field label="Tanggal"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        <Field label="Dokter"><Select value={doctor} onChange={(e) => setDoctor(e.target.value)}><option value="all">Semua dokter</option>{db.doctors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</Select></Field>
        <Field label="Status"><Select value={status} onChange={(e) => setStatus(e.target.value)}><option value="all">Semua status</option>{STATUSES.map((s) => <option key={s}>{s}</option>)}</Select></Field>
        <div className="flex items-end"><Button variant="ghost" onClick={() => { setDate(''); setDoctor('all'); setStatus('all') }}>Reset filter</Button></div>
      </div>
      {loading ? <SkeletonList /> : list.length ? (
        <div className="overflow-x-auto rounded-3xl border border-royal/10 bg-white">
          <table className="w-full min-w-[56rem] text-left text-sm">
            <thead className="bg-mist text-xs uppercase text-navy/50"><tr><th className="px-4 py-3">Referensi</th><th className="px-4 py-3">Pasien</th><th className="px-4 py-3">Dokter</th><th className="px-4 py-3">Jadwal</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Ubah status</th></tr></thead>
            <tbody className="divide-y divide-royal/10">
              {list.map((a) => (
                <tr key={a.id}>
                  <td className="px-4 py-3 font-semibold text-royal">{a.ref}</td>
                  <td className="px-4 py-3">{userOf(db, a.patientId)?.name}</td>
                  <td className="px-4 py-3">{doctorOf(db, a.doctorId)?.name}</td>
                  <td className="px-4 py-3">{fmtDateShort(a.date)}<br /><span className="text-xs text-navy/50">{a.time}</span></td>
                  <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                  <td className="px-4 py-3">
                    <Select aria-label={`Ubah status ${a.ref}`} className="py-2" value={a.status} onChange={(e) => { db.setAppointmentStatus(a.id, e.target.value as Appointment['status'], e.target.value === 'Dibatalkan' ? 'Dibatalkan oleh admin' : undefined); toast.success('Status diperbarui.') }}>
                      {STATUSES.map((s) => <option key={s}>{s}</option>)}
                    </Select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <EmptyState title="Tidak ada janji temu" desc="Ubah filter untuk melihat data lain." />}
    </div>
  )
}

/* ============ Content ============ */
type CT = 'services' | 'facilities' | 'articles' | 'testimonials' | 'faqs' | 'messages'

const Row2 = ({ title, sub }: { title: string; sub?: string }) => <><p className="truncate font-bold">{title}</p>{sub && <p className="truncate text-xs text-navy/50">{sub}</p>}</>

export function AdminContent() {
  useDocumentTitle('Kelola Konten')
  const db = useStore()
  const [tab, setTab] = useState<CT>('services')
  const f = (key: string, label: string, type: FieldDef['type'] = 'text', extra: Partial<FieldDef> = {}): FieldDef => ({ key, label, type, required: true, ...extra })
  return (
    <div>
      <PageHeader title="Kelola Konten" desc="Ubah konten yang tampil di situs publik." />
      <Tabs<CT> value={tab} onChange={setTab} tabs={[
        { id: 'services', label: 'Layanan', count: db.services.length }, { id: 'facilities', label: 'Fasilitas', count: db.facilities.length },
        { id: 'articles', label: 'Artikel', count: db.articles.length }, { id: 'testimonials', label: 'Testimoni', count: db.testimonials.length },
        { id: 'faqs', label: 'FAQ', count: db.faqs.length }, { id: 'messages', label: 'Pesan Masuk', count: db.contacts.length },
      ]} />
      {tab === 'services' && <ContentManager collection="services" noun="Layanan" items={db.services} slugFrom="name" defaults={{ icon: 'Stethoscope', image: IMG.poli, features: [] }}
        fields={[f('name', 'Nama'), f('icon', 'Ikon', 'icon'), f('image', 'URL gambar', 'url'), f('hours', 'Jam layanan'), f('summary', 'Ringkasan', 'textarea'), f('description', 'Deskripsi', 'textarea'), f('features', 'Keunggulan', 'lines')]}
        render={(i) => <Row2 title={i.name} sub={i.summary} />} />}
      {tab === 'facilities' && <ContentManager collection="facilities" noun="Fasilitas" items={db.facilities} defaults={{ image: IMG.icu }}
        fields={[f('name', 'Nama'), f('image', 'URL gambar', 'url'), f('description', 'Deskripsi', 'textarea')]} render={(i) => <Row2 title={i.name} sub={i.description} />} />}
      {tab === 'articles' && <ContentManager collection="articles" noun="Artikel" items={db.articles} slugFrom="title" defaults={{ image: IMG.heart, date: todayISO() }}
        fields={[f('title', 'Judul'), f('category', 'Kategori'), f('date', 'Tanggal terbit', 'date'), f('image', 'URL gambar', 'url'), f('excerpt', 'Ringkasan', 'textarea'), f('content', 'Isi artikel', 'textarea', { hint: 'Pisahkan paragraf dengan baris kosong.' })]}
        render={(i) => <Row2 title={i.title} sub={`${i.category} · ${i.date}`} />} />}
      {tab === 'testimonials' && <ContentManager collection="testimonials" noun="Testimoni" items={db.testimonials} defaults={{ rating: 5 }}
        fields={[f('name', 'Nama pasien'), f('service', 'Kategori layanan'), f('rating', 'Rating (1–5)', 'number', { min: 1, max: 5 }), f('text', 'Isi testimoni', 'textarea')]}
        render={(i) => <Row2 title={`${i.name} · ${'★'.repeat(i.rating)}`} sub={i.text} />} />}
      {tab === 'faqs' && <ContentManager collection="faqs" noun="FAQ" items={db.faqs} fields={[f('q', 'Pertanyaan', 'textarea'), f('a', 'Jawaban', 'textarea')]} render={(i) => <Row2 title={i.q} sub={i.a} />} />}
      {tab === 'messages' && (db.contacts.length ? (
        <ul className="space-y-3">{db.contacts.map((m) => <li key={m.id}><Card><p className="font-bold">{m.subject}</p><p className="text-xs text-navy/50">{m.name} · {m.email} · {fmtDateTime(m.createdAt)}</p><p className="mt-2 whitespace-pre-wrap text-sm">{m.message}</p></Card></li>)}</ul>
      ) : <EmptyState title="Belum ada pesan" desc="Pesan dari formulir kontak akan tampil di sini." />)}
    </div>
  )
}

/* ============ Reports ============ */
function BarChart({ title, labels, values }: { title: string; labels: string[]; values: number[] }) {
  const max = Math.max(1, ...values)
  return (
    <Card>
      <h3 className="mb-4 font-bold">{title}</h3>
      <div className="flex h-44 items-end gap-3" role="img" aria-label={`${title}: ${labels.map((l, i) => `${l} ${values[i]}`).join(', ')}`}>
        {values.map((v, i) => (
          <div key={labels[i]} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
            <span className="text-xs font-bold">{v}</span>
            <div className="w-full rounded-t-xl bg-royal" style={{ height: `${(v / max) * 100}%`, minHeight: v ? 6 : 2, opacity: v ? 1 : 0.2 }} />
            <span className="text-[11px] text-navy/50">{labels[i]}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}

export function AdminReports() {
  useDocumentTitle('Laporan')
  const db = useStore()
  const months = useMemo(() => Array.from({ length: 6 }, (_, i) => monthKey(addDays(new Date(), -30 * (5 - i)).toISOString())), [])
  const dedup = [...new Set(months)]
  const count = (iso: string[]) => dedup.map((m) => iso.filter((x) => monthKey(x) === m).length)
  const labels = dedup.map(monthLabel)
  const statusCount = (s: string) => db.appointments.filter((a) => a.status === s).length
  const total = Math.max(1, db.appointments.length)
  return (
    <div className="space-y-6">
      <PageHeader title="Laporan & Statistik" desc="Tren 6 bulan terakhir berdasarkan tanggal pembuatan data." />
      <div className="grid gap-6 xl:grid-cols-3">
        <BarChart title="Janji temu dibuat" labels={labels} values={count(db.appointments.map((a) => a.createdAt))} />
        <BarChart title="Konsultasi online dibuat" labels={labels} values={count(db.consultations.map((c) => c.createdAt))} />
        <BarChart title="Pendaftaran pasien" labels={labels} values={count(db.users.filter((u) => u.role === 'patient').map((u) => u.createdAt))} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="mb-4 font-bold">Status janji temu</h3>
          <ul className="space-y-3">{STATUSES.map((s) => <li key={s}><div className="mb-1 flex justify-between text-sm"><span>{s}</span><b>{statusCount(s)}</b></div><div className="h-2 rounded-full bg-soft"><div className="h-2 rounded-full bg-royal" style={{ width: `${(statusCount(s) / total) * 100}%` }} /></div></li>)}</ul>
        </Card>
        <Card>
          <h3 className="mb-4 font-bold">Beban per dokter</h3>
          <table className="w-full text-sm"><thead className="text-left text-xs uppercase text-navy/50"><tr><th className="pb-2">Dokter</th><th className="pb-2 text-right">Janji</th><th className="pb-2 text-right">Konsultasi</th></tr></thead>
            <tbody className="divide-y divide-royal/10">{db.doctors.map((d) => <tr key={d.id}><td className="py-2">{d.name}</td><td className={cx('py-2 text-right font-semibold')}>{db.appointments.filter((a) => a.doctorId === d.id).length}</td><td className="py-2 text-right font-semibold">{db.consultations.filter((c) => c.doctorId === d.id).length}</td></tr>)}</tbody></table>
        </Card>
      </div>
      <p className="text-xs text-navy/50">Tanggal laporan: {fmtDate(todayISO())}. Data diambil dari database Supabase.</p>
    </div>
  )
}