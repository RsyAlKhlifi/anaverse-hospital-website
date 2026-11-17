import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Award, CheckCircle2, Search, Star } from 'lucide-react'
import type { Consultation, Doctor } from '../../types'
import { specialtyName, useStore } from '../../lib/store'
import { useDocumentTitle } from '../../lib/hooks'
import { cx, fmtDate } from '../../lib/utils'
import { Badge, btn, Button, EmptyState, Field, Img, Input, Modal, PageHeader, Stepper, Textarea, Card } from '../../components/ui'
import SlotPicker, { type SlotValue } from '../../components/SlotPicker'
import { scheduleSummary } from '../../components/DoctorCard'
import { useToast } from '../../components/toast'

const STEPS = ['Pilih Dokter', 'Jadwal', 'Konfirmasi', 'Sesi']

export default function OnlineConsult() {
  useDocumentTitle('Konsultasi Online')
  const db = useStore()
  const toast = useToast()
  const [params] = useSearchParams()
  const pre = params.get('dokter')
  const [step, setStep] = useState(0)
  const [doctor, setDoctor] = useState<Doctor | null>(null)
  const [profile, setProfile] = useState<Doctor | null>(null)
  const [q, setQ] = useState('')
  const [sp, setSp] = useState('all')
  const [slot, setSlot] = useState<SlotValue>({ date: '', time: '' })
  const [complaint, setComplaint] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [created, setCreated] = useState<Consultation | null>(null)

  useEffect(() => {
    const d = pre ? db.doctors.find((x) => x.id === pre) : undefined
    if (d && db.schedules.some((s) => s.doctorId === d.id && s.kind === 'online')) { setDoctor(d); setStep(1) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pre])

  const hasOnline = (id: string) => db.schedules.some((s) => s.doctorId === id && s.kind === 'online')
  const list = useMemo(
    () => db.doctors.filter((d) => (sp === 'all' || d.specialtyId === sp) && `${d.name} ${specialtyName(db, d.specialtyId)}`.toLowerCase().includes(q.toLowerCase())),
    [db, q, sp],
  )

  const confirm = async () => {
    if (!doctor) return
    setBusy(true)
    const r = await db.createConsultation({ doctorId: doctor.id, date: slot.date, time: slot.time, complaint })
    setBusy(false)
    if (!r.ok) { toast.error(r.error!); setSlot({ date: '', time: '' }); setStep(1); return }
    setCreated(r.data!)
    setStep(3)
    toast.success('Permintaan konsultasi terkirim.')
  }

  const next2 = () => {
    if (!slot.date || !slot.time) return setErr('Pilih tanggal dan jam konsultasi.')
    if (complaint.trim().length < 10) return setErr('Jelaskan keluhan Anda minimal 10 karakter.')
    setErr('')
    setStep(2)
  }

  return (
    <div>
      <PageHeader title="Konsultasi Online" desc="Konsultasi dengan dokter lewat chat — tanpa perlu datang ke rumah sakit." />
      <Stepper steps={STEPS} current={step} />

      {step === 0 && (
        <div className="space-y-5">
          <div className="grid gap-3 md:grid-cols-[18rem_1fr]">
            <div className="relative"><Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-navy/40" /><Input className="pl-11" placeholder="Cari dokter…" aria-label="Cari dokter" value={q} onChange={(e) => setQ(e.target.value)} /></div>
            <div className="flex flex-wrap gap-2">
              {[{ id: 'all', name: 'Semua' }, ...db.specialties].map((s) => (
                <button key={s.id} aria-pressed={sp === s.id} onClick={() => setSp(s.id)} className={cx('rounded-full px-4 py-2 text-sm font-semibold', sp === s.id ? 'bg-royal text-white' : 'bg-soft text-royal hover:bg-royal/10')}>{s.name}</button>
              ))}
            </div>
          </div>
          {list.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {list.map((d) => {
                const ok = hasOnline(d.id)
                return (
                  <Card key={d.id} className="flex gap-4">
                    <Img src={d.photo} alt={d.name} className="h-24 w-24 shrink-0 rounded-2xl object-top" />
                    <div className="flex min-w-0 flex-1 flex-col">
                      <p className="font-bold leading-snug">{d.name}</p>
                      <p className="text-xs text-navy/60">Spesialis {specialtyName(db, d.specialtyId)}</p>
                      <p className="mt-1 text-xs text-navy/60">{ok ? scheduleSummary(db.schedules, d.id, 'online') : 'Belum ada jadwal online'}</p>
                      <div className="mt-auto flex gap-2 pt-3">
                        <Button size="sm" variant="outline" onClick={() => setProfile(d)}>Profil</Button>
                        <Button size="sm" disabled={!ok} onClick={() => { setDoctor(d); setSlot({ date: '', time: '' }); setStep(1) }}>Pilih</Button>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          ) : <EmptyState title="Dokter tidak ditemukan" desc="Coba kata kunci atau spesialisasi lain." />}
        </div>
      )}

      {step === 1 && doctor && (
        <div className="max-w-3xl space-y-6">
          <Card className="flex items-center gap-4"><Img src={doctor.photo} alt={doctor.name} className="h-16 w-16 rounded-2xl object-top" /><div><p className="font-bold">{doctor.name}</p><p className="text-sm text-navy/60">Spesialis {specialtyName(db, doctor.specialtyId)}</p></div></Card>
          <SlotPicker doctorId={doctor.id} kind="online" value={slot} onChange={setSlot} />
          <Field label="Keluhan / topik konsultasi" error={err && complaint.trim().length < 10 ? err : undefined}><Textarea value={complaint} onChange={(e) => setComplaint(e.target.value)} placeholder="Ceritakan keluhan, sejak kapan, dan obat yang sedang dikonsumsi…" /></Field>
          {err && (!slot.date || !slot.time) && <p role="alert" className="text-sm font-medium text-red-600">{err}</p>}
          <div className="flex justify-between"><Button variant="ghost" onClick={() => setStep(0)}>Kembali</Button><Button onClick={next2}>Lanjut</Button></div>
        </div>
      )}

      {step === 2 && doctor && (
        <div className="max-w-2xl space-y-5">
          <Card className="space-y-3 text-sm">
            <h2 className="text-lg font-bold">Tinjau Konsultasi</h2>
            {[['Dokter', doctor.name], ['Spesialis', specialtyName(db, doctor.specialtyId)], ['Jadwal', `${fmtDate(slot.date)}, ${slot.time}`], ['Media', 'Chat (video segera hadir)'], ['Keluhan', complaint]].map(([k, v]) => (
              <div key={k} className="flex gap-4"><dt className="w-24 shrink-0 text-navy/50">{k}</dt><dd className="font-semibold">{v}</dd></div>
            ))}
          </Card>
          <p className="rounded-2xl bg-mist p-4 text-xs text-navy/60">Dokter perlu menyetujui permintaan Anda. Sesi chat dibuka oleh dokter pada jadwal. Konsultasi online tidak untuk keadaan darurat — hubungi IGD bila gawat.</p>
          <div className="flex justify-between"><Button variant="ghost" onClick={() => setStep(1)}>Kembali</Button><Button loading={busy} onClick={confirm}>Konfirmasi Konsultasi</Button></div>
        </div>
      )}

      {step === 3 && created && (
        <div className="mx-auto max-w-lg rounded-[2rem] border border-royal/10 bg-white p-8 text-center shadow-card">
          <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" />
          <h2 className="mt-4 text-2xl font-extrabold">Permintaan Terkirim</h2>
          <p className="mt-2 text-sm text-navy/60">Nomor referensi Anda</p>
          <p className="mt-1 text-xl font-extrabold tracking-wider text-royal">{created.ref}</p>
          <p className="mt-3 text-sm text-navy/70">Status: <b>Menunggu persetujuan dokter</b>. Anda dapat membuka ruang konsultasi kapan saja untuk melihat statusnya.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to={`/pasien/konsultasi/${created.id}`} className={btn('primary')}>Buka Ruang Konsultasi</Link>
            <Link to="/pasien/riwayat-konsultasi" className={btn('outline')}>Riwayat Konsultasi</Link>
          </div>
        </div>
      )}

      <Modal open={!!profile} onClose={() => setProfile(null)} title="Profil Dokter"
        footer={profile && hasOnline(profile.id) ? <Button onClick={() => { setDoctor(profile); setSlot({ date: '', time: '' }); setProfile(null); setStep(1) }}>Pilih Dokter Ini</Button> : undefined}>
        {profile && (
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-4"><Img src={profile.photo} alt={profile.name} className="h-20 w-20 rounded-2xl object-top" /><div><p className="font-bold">{profile.name}</p><Badge>Spesialis {specialtyName(db, profile.specialtyId)}</Badge></div></div>
            <p className="flex gap-4"><span className="inline-flex items-center gap-1"><Star className="h-4 w-4 fill-amber-400 text-amber-400" />{profile.rating.toFixed(1)}</span><span className="inline-flex items-center gap-1"><Award className="h-4 w-4 text-royal" />{profile.experience} tahun</span></p>
            <p className="text-navy/70">{profile.bio}</p>
            <p><b>Jadwal online:</b> {scheduleSummary(db.schedules, profile.id, 'online')}</p>
          </div>
        )}
      </Modal>
    </div>
  )
}
