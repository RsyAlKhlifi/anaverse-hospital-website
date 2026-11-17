import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2, Info } from 'lucide-react'
import type { Appointment, Doctor, Payer } from '../../types'
import { CANCEL_WINDOW_HOURS, specialtyName, useStore } from '../../lib/store'
import { useDocumentTitle } from '../../lib/hooks'
import { cx, DAY_NAMES, fmtDate } from '../../lib/utils'
import { btn, Button, Card, EmptyState, Field, Img, PageHeader, Select, Stepper, Textarea } from '../../components/ui'
import { Icon } from '../../components/Icon'
import SlotPicker, { type SlotValue } from '../../components/SlotPicker'
import { useToast } from '../../components/toast'

const STEPS = ['Spesialis', 'Dokter', 'Jadwal', 'Detail', 'Konfirmasi']

export default function BookAppointment() {
  useDocumentTitle('Buat Janji Temu')
  const db = useStore()
  const toast = useToast()
  const [params] = useSearchParams()
  const pre = params.get('dokter')
  const [step, setStep] = useState(0)
  const [spId, setSpId] = useState('')
  const [doctor, setDoctor] = useState<Doctor | null>(null)
  const [slot, setSlot] = useState<SlotValue>({ date: '', time: '' })
  const [complaint, setComplaint] = useState('')
  const [notes, setNotes] = useState('')
  const [payer, setPayer] = useState<Payer>('Umum')
  const [agree, setAgree] = useState(false)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState<Appointment | null>(null)

  useEffect(() => {
    const d = pre ? db.doctors.find((x) => x.id === pre) : undefined
    if (d) { setDoctor(d); setSpId(d.specialtyId); setStep(2) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pre])

  const doctors = db.doctors.filter((d) => d.specialtyId === spId)
  const weekly = doctor ? db.schedules.filter((s) => s.doctorId === doctor.id && s.kind === 'offline').sort((a, b) => a.weekday - b.weekday) : []

  const toDetail = () => {
    if (!slot.date || !slot.time) return setErr('Pilih tanggal dan jam kunjungan.')
    setErr(''); setStep(3)
  }
  const toReview = () => {
    if (complaint.trim().length < 10) return setErr('Jelaskan keluhan Anda minimal 10 karakter.')
    setErr(''); setStep(4)
  }
  const confirm = async () => {
    if (!doctor) return
    if (!agree) return setErr('Centang persetujuan kebijakan pembatalan untuk melanjutkan.')
    setErr(''); setBusy(true)
    const r = await db.createAppointment({ doctorId: doctor.id, ...slot, complaint, notes, payer })
    setBusy(false)
    if (!r.ok) { toast.error(r.error!); setSlot({ date: slot.date, time: '' }); setStep(2); return }
    setDone(r.data!)
    toast.success('Janji temu berhasil dibuat.')
  }

  if (done)
    return (
      <div className="mx-auto max-w-lg rounded-[2rem] border border-royal/10 bg-white p-8 text-center shadow-card">
        <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" />
        <h1 className="mt-4 text-2xl font-extrabold">Janji Temu Dibuat</h1>
        <p className="mt-2 text-sm text-navy/60">Nomor referensi</p>
        <p className="text-2xl font-extrabold tracking-wider text-royal">{done.ref}</p>
        <dl className="mx-auto mt-5 max-w-xs space-y-1 text-left text-sm">
          <div className="flex justify-between"><dt className="text-navy/50">Dokter</dt><dd className="text-right font-semibold">{doctor?.name}</dd></div>
          <div className="flex justify-between"><dt className="text-navy/50">Jadwal</dt><dd className="text-right font-semibold">{fmtDate(done.date)}, {done.time}</dd></div>
          <div className="flex justify-between"><dt className="text-navy/50">Status</dt><dd className="font-semibold">{done.status}</dd></div>
        </dl>
        <p className="mt-4 text-xs text-navy/50">Rumah sakit akan mengonfirmasi janji Anda. Pantau statusnya di Riwayat Janji Temu.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3"><Link to="/pasien/janji-temu" className={btn('primary')}>Lihat Janji Temu</Link><Link to="/pasien" className={btn('outline')}>Ke Dashboard</Link></div>
      </div>
    )

  return (
    <div>
      <PageHeader title="Buat Janji Temu" desc="Pilih spesialis, dokter, dan jadwal kunjungan ke rumah sakit." />
      <Stepper steps={STEPS} current={step} />

      {step === 0 && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
          {db.specialties.map((s) => (
            <button key={s.id} onClick={() => { setSpId(s.id); setDoctor(null); setStep(1) }}
              className={cx('flex flex-col items-center gap-3 rounded-3xl border bg-white p-5 text-center shadow-card transition hover:-translate-y-1 hover:border-royal', spId === s.id ? 'border-royal' : 'border-royal/10')}>
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-soft text-royal"><Icon name={s.icon} className="h-5 w-5" /></span>
              <span className="text-sm font-bold">{s.name}</span>
              <span className="text-xs text-navy/50">{db.doctors.filter((d) => d.specialtyId === s.id).length} dokter</span>
            </button>
          ))}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          {doctors.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {doctors.map((d) => {
                const ok = db.schedules.some((s) => s.doctorId === d.id && s.kind === 'offline')
                return (
                  <Card key={d.id} className="flex gap-4">
                    <Img src={d.photo} alt={d.name} className="h-24 w-24 shrink-0 rounded-2xl object-top" />
                    <div className="flex flex-1 flex-col"><p className="font-bold leading-snug">{d.name}</p><p className="text-xs text-navy/60">{d.experience} tahun · ★ {d.rating.toFixed(1)}</p>
                      <Button size="sm" className="mt-auto self-start" disabled={!ok} onClick={() => { setDoctor(d); setSlot({ date: '', time: '' }); setStep(2) }}>{ok ? 'Pilih Dokter' : 'Belum ada jadwal'}</Button></div>
                  </Card>
                )
              })}
            </div>
          ) : <EmptyState title="Belum ada dokter" desc="Belum ada dokter pada spesialisasi ini." />}
          <Button variant="ghost" onClick={() => setStep(0)}>Kembali</Button>
        </div>
      )}

      {step === 2 && doctor && (
        <div className="max-w-3xl space-y-6">
          <Card className="space-y-3">
            <div className="flex items-center gap-4"><Img src={doctor.photo} alt={doctor.name} className="h-16 w-16 rounded-2xl object-top" /><div><p className="font-bold">{doctor.name}</p><p className="text-sm text-navy/60">Spesialis {specialtyName(db, doctor.specialtyId)}</p></div></div>
            <p className="text-sm"><b>Jadwal praktik:</b> {weekly.length ? weekly.map((s) => `${DAY_NAMES[s.weekday]} ${s.start}–${s.end}`).join(' · ') : 'Belum ada jadwal'}</p>
          </Card>
          <SlotPicker doctorId={doctor.id} kind="offline" value={slot} onChange={setSlot} />
          {err && <p role="alert" className="text-sm font-medium text-red-600">{err}</p>}
          <div className="flex justify-between"><Button variant="ghost" onClick={() => setStep(1)}>Kembali</Button><Button onClick={toDetail}>Lanjut</Button></div>
        </div>
      )}

      {step === 3 && (
        <div className="max-w-2xl space-y-5">
          <Field label="Keluhan utama" error={err}><Textarea value={complaint} onChange={(e) => setComplaint(e.target.value)} placeholder="Ceritakan keluhan Anda…" /></Field>
          <Field label="Catatan tambahan (opsional)"><Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Alergi, obat yang sedang dikonsumsi, dsb." /></Field>
          <Field label="Jenis pembayaran" hint="Bawa kartu identitas dan kartu BPJS/asuransi (jika ada) saat datang."><Select value={payer} onChange={(e) => setPayer(e.target.value as Payer)}><option>Umum</option><option>BPJS</option><option>Asuransi</option></Select></Field>
          <div className="flex justify-between"><Button variant="ghost" onClick={() => setStep(2)}>Kembali</Button><Button onClick={toReview}>Tinjau Janji</Button></div>
        </div>
      )}

      {step === 4 && doctor && (
        <div className="max-w-2xl space-y-5">
          <Card className="space-y-3 text-sm">
            <h2 className="text-lg font-bold">Tinjau Janji Temu</h2>
            {[['Dokter', doctor.name], ['Spesialis', specialtyName(db, doctor.specialtyId)], ['Jadwal', `${fmtDate(slot.date)}, ${slot.time}`], ['Keluhan', complaint], ['Catatan', notes || '—'], ['Pembayaran', payer]].map(([k, v]) => (
              <div key={k} className="flex gap-4"><dt className="w-24 shrink-0 text-navy/50">{k}</dt><dd className="font-semibold">{v}</dd></div>
            ))}
          </Card>
          <div className="flex gap-3 rounded-2xl bg-soft p-4 text-sm"><Info className="mt-0.5 h-5 w-5 shrink-0 text-royal" /><p>Kebijakan pembatalan: janji dapat dibatalkan paling lambat <b>{CANCEL_WINDOW_HOURS} jam</b> sebelum jadwal. Status awal janji adalah “Menunggu Konfirmasi”.</p></div>
          <label className="flex items-start gap-3 text-sm"><input type="checkbox" className="mt-1 h-4 w-4 accent-royal" checked={agree} onChange={(e) => setAgree(e.target.checked)} />Saya memahami kebijakan pembatalan dan data yang saya isi sudah benar.</label>
          {err && <p role="alert" className="text-sm font-medium text-red-600">{err}</p>}
          <div className="flex justify-between"><Button variant="ghost" onClick={() => setStep(3)}>Kembali</Button><Button loading={busy} onClick={confirm}>Konfirmasi Janji Temu</Button></div>
        </div>
      )}
    </div>
  )
}
