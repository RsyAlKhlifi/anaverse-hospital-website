import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CalendarDays, Lock, Mail, Phone, Send, Video } from 'lucide-react'
import { doctorOf, specialtyName, cancelPolicy, useStore, userOf } from '../lib/store'
import { videoProvider } from '../services/video'
import { cx, fmtDate, fmtDateShort, fmtTime, initials } from '../lib/utils'
import { Button, Card, ConfirmDialog, EmptyState, Field, Img, Modal, StatusBadge, Textarea } from './ui'
import { useToast } from './toast'

/** Ruang konsultasi: dipakai pasien (/pasien/konsultasi/:id) dan dokter (/portal-dokter/konsultasi/:id). */
export default function ConsultationRoom({ backTo }: { backTo: string }) {
  const { id } = useParams()
  const db = useStore()
  const toast = useToast()
  const { user } = db
  const c = db.consultations.find((x) => x.id === id)
  const endRef = useRef<HTMLDivElement>(null)
  const [text, setText] = useState('')
  const [reject, setReject] = useState(false)
  const [reason, setReason] = useState('')
  const [finish, setFinish] = useState(false)
  const [summary, setSummary] = useState('')
  const [cancel, setCancel] = useState(false)

  const msgs = db.messages.filter((m) => m.consultationId === id).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }) }, [msgs.length])

  const isDoctor = user?.role === 'doctor'
  const allowed = !!c && !!user && ((user.role === 'patient' && c.patientId === user.id) || (isDoctor && c.doctorId === user.doctorId))
  if (!c || !allowed)
    return <EmptyState title="Konsultasi tidak ditemukan" desc="Konsultasi tidak ada atau Anda tidak memiliki akses." action={<Link to={backTo} className="font-semibold text-royal">Kembali</Link>} />

  const doctor = doctorOf(db, c.doctorId)
  const patient = userOf(db, c.patientId)
  const active = c.status === 'Aktif'

  const send = (e: FormEvent) => {
    e.preventDefault()
    const r = db.sendMessage(c.id, text)
    if (!r.ok) return toast.error(r.error!)
    setText('')
  }

  let lastDay = ''
  return (
    <div>
      <Link to={backTo} className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-royal"><ArrowLeft className="h-4 w-4" />Kembali</Link>
      <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
        <div className="space-y-4">
          <Card>
            <div className="mb-3 flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-wide text-navy/50">{c.ref}</p><StatusBadge status={c.status} /></div>
            {isDoctor ? (
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-soft font-bold text-royal">{initials(patient?.name ?? '?')}</span>
                <div className="min-w-0"><p className="font-bold">{patient?.name}</p><p className="text-xs text-navy/50">Pasien</p></div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Img src={doctor?.photo} alt={doctor?.name ?? 'Dokter'} className="h-12 w-12 rounded-full object-top" />
                <div className="min-w-0"><p className="font-bold leading-tight">{doctor?.name}</p><p className="text-xs text-navy/50">Spesialis {doctor && specialtyName(db, doctor.specialtyId)}</p></div>
              </div>
            )}
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex gap-2"><CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-royal" /><dd>{fmtDate(c.date)}, {c.time}</dd></div>
              {isDoctor && patient && <>
                <div className="flex gap-2"><Phone className="mt-0.5 h-4 w-4 shrink-0 text-royal" /><dd>{patient.phone}</dd></div>
                <div className="flex gap-2"><Mail className="mt-0.5 h-4 w-4 shrink-0 text-royal" /><dd className="break-all">{patient.email}</dd></div>
              </>}
            </dl>
            <div className="mt-4 rounded-2xl bg-mist p-3 text-sm"><p className="mb-1 text-xs font-bold text-navy/50">Keluhan</p>{c.complaint}</div>
            {c.summary && <div className="mt-3 rounded-2xl bg-soft p-3 text-sm"><p className="mb-1 text-xs font-bold text-royal">Ringkasan dokter</p>{c.summary}</div>}
            {c.cancelReason && <p className="mt-3 text-xs text-red-600">Alasan: {c.cancelReason}</p>}
          </Card>

          <Card className="space-y-2">
            <p className="flex items-center gap-2 text-sm font-bold"><Video className="h-4 w-4 text-royal" />Konsultasi video</p>
            <p className="text-xs text-navy/60">{videoProvider ? 'Tersedia.' : 'Belum tersedia — sesi saat ini berbasis chat. Integrasi video disiapkan lewat src/services/video.ts.'}</p>
          </Card>

          <div className="flex flex-col gap-2">
            {isDoctor && c.status === 'Menunggu' && <>
              <Button onClick={() => { db.setConsultationStatus(c.id, 'Dijadwalkan'); toast.success('Konsultasi diterima.') }}>Terima Permintaan</Button>
              <Button variant="outline" onClick={() => setReject(true)}>Tolak</Button>
            </>}
            {isDoctor && c.status === 'Dijadwalkan' && <Button onClick={() => { db.setConsultationStatus(c.id, 'Aktif'); toast.success('Sesi dimulai.') }}>Mulai Sesi</Button>}
            {isDoctor && active && <Button variant="outline" onClick={() => setFinish(true)}>Akhiri Sesi</Button>}
            {!isDoctor && (c.status === 'Menunggu' || c.status === 'Dijadwalkan') && (
              <Button variant="outline" onClick={() => setCancel(true)}>Batalkan Konsultasi</Button>
            )}
          </div>
        </div>

        <Card className="flex h-[34rem] flex-col p-0">
          <div className="border-b border-royal/10 px-5 py-3"><p className="font-bold">Percakapan</p><p className="text-xs text-navy/50">{active ? 'Sesi aktif' : c.status === 'Selesai' ? 'Sesi selesai — hanya baca' : 'Percakapan dibuka saat sesi aktif'}</p></div>
          <div className="flex-1 space-y-3 overflow-y-auto bg-mist px-4 py-4" role="log" aria-live="polite" aria-label="Pesan konsultasi">
            {!msgs.length && <p className="grid h-full place-items-center text-center text-sm text-navy/50">{active ? 'Belum ada pesan. Mulai percakapan.' : 'Belum ada pesan.'}</p>}
            {msgs.map((m) => {
              const mine = isDoctor ? m.senderRole === 'doctor' : m.senderRole === 'patient'
              const day = m.createdAt.slice(0, 10)
              const sep = day !== lastDay
              lastDay = day
              return (
                <div key={m.id}>
                  {sep && <p className="my-2 text-center text-xs font-semibold text-navy/40">{fmtDateShort(day)}</p>}
                  <div className={cx('flex', mine ? 'justify-end' : 'justify-start')}>
                    <div className={cx('max-w-[80%] rounded-2xl px-4 py-2.5 text-sm', mine ? 'rounded-br-md bg-royal text-white' : 'rounded-bl-md bg-white shadow-sm')}>
                      <p className="whitespace-pre-wrap break-words">{m.text}</p>
                      <p className={cx('mt-1 text-right text-[10px]', mine ? 'text-white/70' : 'text-navy/40')}><time dateTime={m.createdAt}>{fmtTime(m.createdAt)}</time></p>
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={endRef} />
          </div>
          <form onSubmit={send} className="flex items-end gap-2 border-t border-royal/10 p-3">
            {active ? (
              <>
                <Textarea rows={1} value={text} onChange={(e) => setText(e.target.value)} aria-label="Tulis pesan" placeholder="Tulis pesan…" className="min-h-[3rem] resize-none"
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); e.currentTarget.form?.requestSubmit() } }} />
                <Button type="submit" disabled={!text.trim()} aria-label="Kirim pesan"><Send className="h-4 w-4" /></Button>
              </>
            ) : (
              <p className="flex w-full items-center gap-2 px-2 py-3 text-sm text-navy/50"><Lock className="h-4 w-4" />
                {c.status === 'Menunggu' ? 'Menunggu persetujuan dokter.' : c.status === 'Dijadwalkan' ? `Sesi dimulai dokter pada ${fmtDateShort(c.date)}, ${c.time}.` : 'Sesi tidak aktif.'}</p>
            )}
          </form>
        </Card>
      </div>

      <Modal open={reject} onClose={() => setReject(false)} title="Tolak konsultasi"
        footer={<><Button variant="ghost" onClick={() => setReject(false)}>Batal</Button><Button variant="danger" onClick={() => { if (reason.trim().length < 5) return toast.error('Tuliskan alasan penolakan.'); db.setConsultationStatus(c.id, 'Dibatalkan', { reason: reason.trim() }); setReject(false); toast.success('Konsultasi ditolak.') }}>Tolak</Button></>}>
        <Field label="Alasan penolakan"><Textarea value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
      </Modal>
      <Modal open={finish} onClose={() => setFinish(false)} title="Akhiri sesi konsultasi"
        footer={<><Button variant="ghost" onClick={() => setFinish(false)}>Batal</Button><Button onClick={() => { if (summary.trim().length < 10) return toast.error('Ringkasan minimal 10 karakter.'); db.setConsultationStatus(c.id, 'Selesai', { summary: summary.trim() }); setFinish(false); toast.success('Sesi diselesaikan.') }}>Selesaikan</Button></>}>
        <Field label="Ringkasan konsultasi untuk pasien"><Textarea value={summary} onChange={(e) => setSummary(e.target.value)} /></Field>
      </Modal>
      <ConfirmDialog open={cancel} tone="danger" title="Batalkan konsultasi?" confirmLabel="Batalkan" onCancel={() => setCancel(false)}
        message={cancelPolicy(c).ok ? 'Jadwal akan dilepas dan dapat dipesan pasien lain.' : cancelPolicy(c).reason}
        onConfirm={() => { const r = db.cancelConsultation(c.id); setCancel(false); r.ok ? toast.success('Konsultasi dibatalkan.') : toast.error(r.error!) }} />
    </div>
  )
}
