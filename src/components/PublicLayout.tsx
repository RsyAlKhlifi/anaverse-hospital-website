import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Facebook, Instagram, Mail, MapPin, Menu, Phone, X, Youtube, Clock } from 'lucide-react'
import { HOSPITAL } from '../data/hospital'
import { useStore } from '../lib/store'
import { btn, Button, ConfirmDialog, Logo } from './ui'
import { cx } from '../lib/utils'

export const portalHome = (role?: string) => (role === 'admin' ? '/admin' : role === 'doctor' ? '/portal-dokter' : '/pasien')

const links = [
  { to: '/', label: 'Beranda' },
  { to: '/#tentang', label: 'Tentang Kami' },
  { to: '/#layanan', label: 'Layanan' },
  { to: '/dokter', label: 'Dokter' },
  { to: '/#fasilitas', label: 'Fasilitas' },
  { to: '/artikel', label: 'Artikel' },
  { to: '/#faq', label: 'FAQ' },
  { to: '/#kontak', label: 'Kontak' },
]

function ScrollToHash() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1))
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 50)
        return
      }
    }
    window.scrollTo({ top: 0 })
  }, [pathname, hash])
  return null
}

function Navbar() {
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const { pathname, hash } = useLocation()
  const { user, logout } = useStore()
  const nav = useNavigate()
  useEffect(() => setOpen(false), [pathname, hash])

  const active = (to: string) => {
    const [p, h] = to.split('#')
    if (h) return pathname === '/' && hash === `#${h}`
    return p === '/' ? pathname === '/' && !hash : pathname.startsWith(p)
  }
  const item = (to: string, label: string) => (
    <Link key={to} to={to} className={cx('rounded-full px-3 py-2 text-sm font-semibold transition hover:text-royal', active(to) ? 'text-royal' : 'text-navy/75')} aria-current={active(to) ? 'page' : undefined}>
      {label}
    </Link>
  )

  return (
    <header className="sticky top-0 z-50 border-b border-royal/10 bg-white/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link to="/" aria-label="Rumah Sakit Anaverse — beranda"><Logo /></Link>
        <nav className="hidden items-center gap-1 xl:flex" aria-label="Utama">{links.map((l) => item(l.to, l.label))}</nav>
        <div className="hidden items-center gap-2 lg:flex">
          {user ? (
            <>
              <Link to={portalHome(user.role)} className={btn('soft', 'sm')}>Portal Saya</Link>
              <Button variant="ghost" size="sm" onClick={() => setConfirm(true)}>Keluar</Button>
            </>
          ) : (
            <Link to="/masuk" className={btn('ghost', 'sm')}>Masuk / Daftar</Link>
          )}
          <Link to="/pasien/janji-temu/baru" className={btn('primary', 'sm')}>Buat Janji Temu</Link>
        </div>
        <button className="rounded-full p-2 text-navy hover:bg-soft lg:hidden" onClick={() => setOpen((o) => !o)} aria-label={open ? 'Tutup menu' : 'Buka menu'} aria-expanded={open}>
          {open ? <X /> : <Menu />}
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-royal/10 bg-white lg:hidden">
            <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4" aria-label="Menu seluler">
              {links.map((l) => item(l.to, l.label))}
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {user ? (
                  <>
                    <Link to={portalHome(user.role)} className={btn('soft')}>Portal Saya</Link>
                    <Button variant="outline" onClick={() => setConfirm(true)}>Keluar</Button>
                  </>
                ) : (
                  <Link to="/masuk" className={btn('outline')}>Masuk / Daftar</Link>
                )}
                <Link to="/pasien/janji-temu/baru" className={btn('primary', 'md', 'sm:col-span-2')}>Buat Janji Temu</Link>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
      <ConfirmDialog open={confirm} title="Keluar dari akun?" message="Anda perlu masuk kembali untuk membuat janji atau membuka portal." confirmLabel="Keluar"
        onCancel={() => setConfirm(false)} onConfirm={() => { logout(); setConfirm(false); nav('/') }} />
    </header>
  )
}

function Footer() {
  const { services } = useStore()
  const social = { Instagram, Facebook, YouTube: Youtube } as const
  return (
    <footer className="bg-navy text-white/80">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo light />
          <p className="mt-4 max-w-xs text-sm leading-relaxed">Layanan kesehatan profesional dengan teknologi modern dan lingkungan yang nyaman bagi pasien.</p>
          <div className="mt-5 flex gap-2">
            {HOSPITAL.socials.map((s) => {
              const I = social[s.label as keyof typeof social]
              return (
                <a key={s.label} href={s.href} target="_blank" rel="noreferrer" aria-label={s.label} className="grid h-10 w-10 place-items-center rounded-full bg-white/10 transition hover:bg-royal">
                  <I className="h-4 w-4" />
                </a>
              )
            })}
          </div>
        </div>
        <div>
          <h3 className="mb-4 font-bold text-white">Tautan Cepat</h3>
          <ul className="space-y-2 text-sm">
            {links.slice(1).map((l) => <li key={l.to}><Link className="hover:text-white" to={l.to}>{l.label}</Link></li>)}
            <li><Link className="hover:text-white" to="/masuk">Masuk / Daftar</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-4 font-bold text-white">Layanan</h3>
          <ul className="space-y-2 text-sm">
            {services.map((s) => <li key={s.id}><Link className="hover:text-white" to={`/layanan/${s.slug}`}>{s.name}</Link></li>)}
          </ul>
        </div>
        <div>
          <h3 className="mb-4 font-bold text-white">Kontak</h3>
          <ul className="space-y-3 text-sm">
            <li className="flex gap-3"><MapPin className="mt-0.5 h-4 w-4 shrink-0" />{HOSPITAL.address}</li>
            <li className="flex gap-3"><Phone className="mt-0.5 h-4 w-4 shrink-0" /><a href={HOSPITAL.phoneHref} className="hover:text-white">{HOSPITAL.phone}</a></li>
            <li className="flex gap-3"><Mail className="mt-0.5 h-4 w-4 shrink-0" /><a href={`mailto:${HOSPITAL.email}`} className="hover:text-white">{HOSPITAL.email}</a></li>
            <li className="flex gap-3"><Clock className="mt-0.5 h-4 w-4 shrink-0" />IGD buka 24 jam</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-white/60">
        © {new Date().getFullYear()} {HOSPITAL.name}. Situs prototipe — seluruh konten adalah contoh.
      </div>
    </footer>
  )
}

export default function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-royal focus:px-4 focus:py-2 focus:text-white">Lewati ke konten</a>
      <ScrollToHash />
      <Navbar />
      <main id="main" className="flex-1"><Outlet /></main>
      <Footer />
    </div>
  )
}

export { NavLink }
