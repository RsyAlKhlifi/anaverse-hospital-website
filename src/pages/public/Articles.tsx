import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Search } from 'lucide-react'
import { useStore } from '../../lib/store'
import { useDocumentTitle, useLoading } from '../../lib/hooks'
import { cx, fmtDate, fmtDateShort } from '../../lib/utils'
import { Badge, EmptyState, Img, Input, Skeleton } from '../../components/ui'
import NotFound from './NotFound'

export function Articles() {
  useDocumentTitle('Artikel')
  const { articles } = useStore()
  const loading = useLoading()
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('all')
  const cats = useMemo(() => [...new Set(articles.map((a) => a.category))], [articles])
  const list = articles
    .filter((a) => (cat === 'all' || a.category === cat) && `${a.title} ${a.excerpt}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => b.date.localeCompare(a.date))
  const chip = (id: string, label: string) => (
    <button key={id} aria-pressed={cat === id} onClick={() => setCat(id)} className={cx('rounded-full px-4 py-2 text-sm font-semibold', cat === id ? 'bg-royal text-white' : 'bg-soft text-royal hover:bg-royal/10')}>{label}</button>
  )
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-extrabold tracking-tight">Berita & Tips Kesehatan</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-[20rem_1fr]">
        <div className="relative"><Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-navy/40" /><Input className="pl-11" placeholder="Cari artikel…" aria-label="Cari artikel" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <div className="flex flex-wrap gap-2">{chip('all', 'Semua')}{cats.map((c) => chip(c, c))}</div>
      </div>
      <div className="mt-8">
        {loading ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-80" />)}</div>
          : list.length ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((a) => (
                <article key={a.id} className="group overflow-hidden rounded-3xl border border-royal/10 bg-white shadow-card transition hover:-translate-y-1 hover:shadow-pop">
                  <div className="overflow-hidden"><Img src={a.image} alt={a.title} className="aspect-[16/10] w-full transition duration-500 group-hover:scale-105" /></div>
                  <div className="p-5">
                    <Badge>{a.category}</Badge>
                    <h2 className="mt-3 font-bold leading-snug">{a.title}</h2>
                    <p className="mt-2 text-sm text-navy/60">{a.excerpt}</p>
                    <div className="mt-4 flex items-center justify-between text-xs text-navy/50"><time dateTime={a.date}>{fmtDateShort(a.date)}</time><Link className="font-semibold text-royal" to={`/artikel/${a.slug}`}>Baca selengkapnya</Link></div>
                  </div>
                </article>
              ))}
            </div>
          ) : <EmptyState title="Artikel tidak ditemukan" desc="Coba kata kunci atau kategori lain." />}
      </div>
    </div>
  )
}

export function ArticleDetail() {
  const { slug } = useParams()
  const { articles } = useStore()
  const a = articles.find((x) => x.slug === slug)
  useDocumentTitle(a?.title ?? 'Artikel')
  if (!a) return <NotFound />
  const related = articles.filter((x) => x.id !== a.id).slice(0, 3)
  return (
    <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link to="/artikel" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-royal"><ArrowLeft className="h-4 w-4" />Semua artikel</Link>
      <Badge>{a.category}</Badge>
      <h1 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight">{a.title}</h1>
      <time dateTime={a.date} className="mt-2 block text-sm text-navy/50">{fmtDate(a.date)}</time>
      <Img src={a.image} alt={a.title} className="mt-6 aspect-[16/9] w-full rounded-3xl shadow-card" />
      <div className="mt-8 space-y-4 leading-relaxed text-navy/80">{a.content.split('\n\n').map((p, i) => <p key={i}>{p}</p>)}</div>
      <p className="mt-8 rounded-2xl bg-mist p-4 text-xs text-navy/60">Artikel ini bersifat informasi umum dan bukan pengganti pemeriksaan atau saran dokter.</p>
      {!!related.length && (
        <div className="mt-12">
          <h2 className="mb-3 font-bold">Baca juga</h2>
          <ul className="space-y-2">{related.map((r) => <li key={r.id}><Link className="text-sm font-semibold text-royal hover:underline" to={`/artikel/${r.slug}`}>{r.title}</Link></li>)}</ul>
        </div>
      )}
    </article>
  )
}
