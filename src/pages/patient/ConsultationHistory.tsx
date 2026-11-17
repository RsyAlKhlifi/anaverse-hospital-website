import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../../lib/store'
import { useDocumentTitle, useLoading } from '../../lib/hooks'
import { EmptyState, PageHeader, SkeletonList, Tabs, btn } from '../../components/ui'
import { ConsultationItem } from '../../components/Cards'

type Tab = 'all' | 'active' | 'Selesai' | 'Dibatalkan'

export default function ConsultationHistory() {
  useDocumentTitle('Riwayat Konsultasi')
  const { user, consultations } = useStore()
  const loading = useLoading()
  const [tab, setTab] = useState<Tab>('all')
  const mine = consultations.filter((c) => c.patientId === user?.id).sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time))
  const isActive = (s: string) => ['Menunggu', 'Dijadwalkan', 'Aktif'].includes(s)
  const shown = mine.filter((c) => (tab === 'all' ? true : tab === 'active' ? isActive(c.status) : c.status === tab))
  return (
    <div>
      <PageHeader title="Riwayat Konsultasi" desc="Seluruh konsultasi online beserta percakapan dan ringkasan dokter." action={<Link to="/pasien/konsultasi" className={btn('primary', 'sm')}>Konsultasi Baru</Link>} />
      <Tabs<Tab> value={tab} onChange={setTab} tabs={[
        { id: 'all', label: 'Semua', count: mine.length }, { id: 'active', label: 'Berjalan', count: mine.filter((c) => isActive(c.status)).length },
        { id: 'Selesai', label: 'Selesai', count: mine.filter((c) => c.status === 'Selesai').length }, { id: 'Dibatalkan', label: 'Dibatalkan', count: mine.filter((c) => c.status === 'Dibatalkan').length },
      ]} />
      {loading ? <SkeletonList /> : shown.length ? <div className="space-y-3">{shown.map((c) => <ConsultationItem key={c.id} c={c} who="patient" to={`/pasien/konsultasi/${c.id}`} />)}</div>
        : <EmptyState title="Tidak ada konsultasi" desc="Konsultasi pada kategori ini akan muncul di sini." />}
    </div>
  )
}
