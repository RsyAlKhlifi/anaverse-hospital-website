import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Clock, Phone } from 'lucide-react'
import { HOSPITAL } from '../../data/hospital'
import { useStore } from '../../lib/store'
import { useDocumentTitle } from '../../lib/hooks'
import { btn, EmptyState, Img } from '../../components/ui'
import { Icon } from '../../components/Icon'
import NotFound from './NotFound'

export default function ServiceDetail() {
  const { slug } = useParams()
  const { services } = useStore()
  const s = services.find((x) => x.slug === slug)
  useDocumentTitle(s?.name ?? 'Layanan')
  if (!s) return <NotFound />
  const isEmergency = s.slug === 'igd-24-jam'
  const others = services.filter((x) => x.id !== s.id)
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Link to="/#layanan" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-royal"><ArrowLeft className="h-4 w-4" />Semua layanan</Link>
      <div className="grid gap-10 lg:grid-cols-2">
        <Img src={s.image} alt={s.name} className="aspect-[4/3] w-full rounded-[2.5rem] shadow-pop" />
        <div>
          <span className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-soft text-royal"><Icon name={s.icon} className="h-6 w-6" /></span>
          <h1 className="text-3xl font-extrabold tracking-tight">{s.name}</h1>
          <p className="mt-4 leading-relaxed text-navy/70">{s.description}</p>
          <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-soft px-4 py-2 text-sm font-semibold text-royal"><Clock className="h-4 w-4" />{s.hours}</p>
          <ul className="mt-6 space-y-2">{s.features.map((f) => <li key={f} className="flex gap-3 text-sm"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-royal" />{f}</li>)}</ul>
          <div className="mt-8 flex flex-wrap gap-3">
            {isEmergency ? (
              <a href={HOSPITAL.phoneHref} className={btn('danger', 'lg')}><Phone className="h-4 w-4" />Hubungi {HOSPITAL.phone}</a>
            ) : (
              <Link to="/pasien/janji-temu/baru" className={btn('primary', 'lg')}>Buat Janji Temu</Link>
            )}
            <Link to="/dokter" className={btn('outline', 'lg')}>Lihat Dokter</Link>
          </div>
          {isEmergency && <p className="mt-3 text-xs text-navy/50">Dalam keadaan darurat, datang langsung ke IGD tanpa janji temu.</p>}
        </div>
      </div>
      <h2 className="mb-4 mt-16 text-xl font-bold">Layanan lainnya</h2>
      {others.length ? (
        <div className="flex flex-wrap gap-2">{others.map((o) => <Link key={o.id} to={`/layanan/${o.slug}`} className={btn('soft', 'sm')}>{o.name}</Link>)}</div>
      ) : <EmptyState title="Belum ada layanan lain" />}
    </div>
  )
}
