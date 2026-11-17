import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { useStore, specialtyName } from '../../lib/store'
import { useDocumentTitle, useLoading } from '../../lib/hooks'
import { cx } from '../../lib/utils'
import { EmptyState, Input, Skeleton } from '../../components/ui'
import DoctorCard from '../../components/DoctorCard'

export default function Doctors() {
  useDocumentTitle('Dokter')
  const db = useStore()
  const loading = useLoading()
  const [q, setQ] = useState('')
  const [sp, setSp] = useState('all')
  const list = useMemo(
    () => db.doctors.filter((d) => (sp === 'all' || d.specialtyId === sp) && `${d.name} ${specialtyName(db, d.specialtyId)}`.toLowerCase().includes(q.toLowerCase())),
    [db, q, sp],
  )
  const chip = (id: string, label: string) => (
    <button key={id} onClick={() => setSp(id)} aria-pressed={sp === id}
      className={cx('rounded-full px-4 py-2 text-sm font-semibold transition', sp === id ? 'bg-royal text-white' : 'bg-soft text-royal hover:bg-royal/10')}>{label}</button>
  )
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-extrabold tracking-tight">Dokter Spesialis Kami</h1>
      <p className="mt-2 text-navy/60">Cari dokter berdasarkan nama atau spesialisasi, lalu buat janji temu atau konsultasi online.</p>
      <div className="mt-6 grid gap-4 md:grid-cols-[20rem_1fr]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-navy/40" aria-hidden="true" />
          <Input className="pl-11" placeholder="Cari nama dokter…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Cari dokter" />
        </div>
        <div className="flex flex-wrap gap-2">{chip('all', 'Semua')}{db.specialties.map((s) => chip(s.id, s.name))}</div>
      </div>
      <div className="mt-8">
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-96" />)}</div>
        ) : list.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{list.map((d) => <DoctorCard key={d.id} doctor={d} />)}</div>
        ) : (
          <EmptyState title="Dokter tidak ditemukan" desc="Coba ubah kata kunci atau pilih spesialisasi lain." />
        )}
      </div>
    </div>
  )
}
