import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Appointment } from '../../types'
import { cancelPolicy, doctorOf, specialtyName, useStore } from '../../lib/store'
import { useDocumentTitle, useLoading } from '../../lib/hooks'
import { fmtDate, todayISO } from '../../lib/utils'
import { btn, Button, ConfirmDialog, EmptyState, Modal, PageHeader, SkeletonList, StatusBadge, Tabs } from '../../components/ui'
import { AppointmentItem } from '../../components/Cards'
import { useToast } from '../../components/toast'

type Tab = 'upcoming' | 'done' | 'cancelled'

export default function AppointmentHistory() {
  useDocumentTitle('Riwayat Janji Temu')
  const db = useStore()
  const toast = useToast()
  const loading = useLoading()
  const [tab, setTab] = useState<Tab>('upcoming')
  const [detail, setDetail] = useState<Appointment | null>(null)
  const [cancel, setCancel] = useState<Appointment | null>(null)
  const today = todayISO()
  const mine = db.appointments.filter((a) => a.patientId === db.user?.id).sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time))
  const groups: Record<Tab, Appointment[]> = {
    upcoming: mine.filter((a) => (a.status === 'Menunggu Konfirmasi' || a.status === 'Dikonfirmasi') && a.date >= today).reverse(),
    done: mine.filter((a) => a.status === 'Selesai' || ((a.status === 'Dikonfirmasi' || a.status === 'Menunggu Konfirmasi') && a.date < today)),
    cancelled: mine.filter((a) => a.status === 'Dibatalkan'),
  }
  const policy = cancel ? cancelPolicy(cancel) : { ok: true }
  const d = detail ? doctorOf(db, detail.doctorId) : undefined

  return (
    <div>
      <PageHeader title="Riwayat Janji Temu" desc="Pantau status dan batalkan janji sesuai kebijakan rumah sakit." action={<Link to="/pasien/janji-temu/baru" className={btn('primary', 'sm')}>Buat Janji Baru</Link>} />
      <Tabs<Tab> value={tab} onChange={setTab} tabs={[{ id: 'upcoming', label: 'Akan Datang', count: groups.upcoming.length }, { id: 'done', label: 'Selesai', count: groups.done.length }, { id: 'cancelled', label: 'Dibatalkan', count: groups.cancelled.length }]} />
      {loading ? <SkeletonList /> : groups[tab].length ? (
        <div className="space-y-3">
          {groups[tab].map((a) => (
            <AppointmentItem key={a.id} a={a} who="patient" onClick={() => setDetail(a)}
              actions={tab === 'upcoming' && <Button size="sm" variant="outline" onClick={() => setCancel(a)}>Batalkan</Button>} />
          ))}
        </div>
      ) : <EmptyState title="Tidak ada janji temu" desc="Janji temu pada kategori ini akan muncul di sini." />}

      <Modal open={!!detail} onClose={() => setDetail(null)} title="Detail Janji Temu">
        {detail && (
          <dl className="space-y-3 text-sm">
            <div className="flex items-center justify-between"><dt className="text-navy/50">Referensi</dt><dd className="font-bold text-royal">{detail.ref}</dd></div>
            {[['Status', <StatusBadge key="s" status={detail.status} />], ['Dokter', d?.name], ['Spesialis', d && specialtyName(db, d.specialtyId)], ['Jadwal', `${fmtDate(detail.date)}, ${detail.time}`], ['Keluhan', detail.complaint], ['Catatan', detail.notes || '—'], ['Pembayaran', detail.payer], ['Alasan pembatalan', detail.status === 'Dibatalkan' ? detail.cancelReason || '—' : undefined]]
              .filter(([, v]) => v !== undefined)
              .map(([k, v]) => <div key={k as string} className="flex justify-between gap-4"><dt className="text-navy/50">{k}</dt><dd className="text-right font-semibold">{v}</dd></div>)}
          </dl>
        )}
      </Modal>

      <ConfirmDialog open={!!cancel} tone="danger" title="Batalkan janji temu?" confirmLabel="Ya, batalkan" onCancel={() => setCancel(null)}
        message={policy.ok ? 'Jadwal akan dilepas dan dapat dipesan pasien lain.' : policy.reason}
        onConfirm={() => { if (!cancel) return; const r = db.cancelAppointment(cancel.id); setCancel(null); r.ok ? toast.success('Janji temu dibatalkan.') : toast.error(r.error!) }} />
    </div>
  )
}
