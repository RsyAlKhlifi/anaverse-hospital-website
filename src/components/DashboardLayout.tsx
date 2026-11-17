import { useState, type ReactNode } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Globe, LogOut, Menu, X, type LucideIcon } from 'lucide-react'
import { isBackendConfigured } from '../lib/supabase'
import { useStore } from '../lib/store'
import { cx, initials } from '../lib/utils'
import { Button, ConfirmDialog, Logo } from './ui'

export interface NavItem { to: string; label: string; icon: LucideIcon; end?: boolean; badge?: number }

export default function DashboardLayout({ items, roleLabel }: { items: NavItem[]; roleLabel: string }) {
  const { user, logout, resetDemo } = useStore()
  const nav = useNavigate()
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)

  const links = (onClick?: () => void): ReactNode =>
    items.map((i) => (
      <NavLink key={i.to} to={i.to} end={i.end} onClick={onClick}
        className={({ isActive }) => cx('flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition', isActive ? 'bg-royal text-white shadow-sm' : 'text-navy/70 hover:bg-soft')}>
        <i.icon className="h-5 w-5" aria-hidden="true" />
        <span className="flex-1">{i.label}</span>
        {!!i.badge && <span className="rounded-full bg-amber-400 px-2 py-0.5 text-xs font-bold text-navy">{i.badge}</span>}
      </NavLink>
    ))

  return (
    <div className="min-h-screen bg-mist">
      {!isBackendConfigured && (
        <div className="bg-amber-50 px-4 py-2 text-center text-xs font-medium text-amber-800">
          Mode prototipe: data demo disimpan di browser ini. Belum ada email, pembayaran, atau penyimpanan server.{' '}
          <button className="font-bold underline" onClick={() => setConfirmReset(true)}>Reset data demo</button>
        </div>
      )}
      <div className="mx-auto flex max-w-[90rem]">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-royal/10 bg-white p-4 lg:flex">
          <Link to="/" className="mb-6 px-2" aria-label="Ke situs utama"><Logo /></Link>
          <nav className="flex-1 space-y-1" aria-label={`Menu ${roleLabel}`}>{links()}</nav>
          <Link to="/" className="mt-2 flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-navy/60 hover:bg-soft"><Globe className="h-5 w-5" />Kembali ke situs</Link>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-royal/10 bg-white/90 px-4 py-3 backdrop-blur sm:px-6">
            <button className="rounded-full p-2 hover:bg-soft lg:hidden" onClick={() => setOpen(true)} aria-label="Buka menu"><Menu /></button>
            <span className="hidden rounded-full bg-soft px-3 py-1 text-xs font-bold text-royal lg:inline">{roleLabel}</span>
            <div className="ml-auto flex items-center gap-3">
              <div className="text-right leading-tight">
                <p className="max-w-[10rem] truncate text-sm font-bold sm:max-w-xs">{user?.name}</p>
                <p className="max-w-[10rem] truncate text-xs text-navy/50 sm:max-w-xs">{user?.email}</p>
              </div>
              <span className="grid h-10 w-10 place-items-center rounded-full bg-royal text-sm font-bold text-white" aria-hidden="true">{initials(user?.name ?? '?')}</span>
              <Button variant="ghost" size="sm" onClick={() => setConfirm(true)} aria-label="Keluar"><LogOut className="h-4 w-4" /><span className="hidden sm:inline">Keluar</span></Button>
            </div>
          </header>
          <main className="p-4 sm:p-6 lg:p-8"><Outlet /></main>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-navy/50" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 flex h-full w-72 flex-col bg-white p-4 shadow-pop">
            <div className="mb-6 flex items-center justify-between"><Logo /><button onClick={() => setOpen(false)} aria-label="Tutup menu" className="rounded-full p-2 hover:bg-soft"><X /></button></div>
            <nav className="flex-1 space-y-1">{links(() => setOpen(false))}</nav>
            <Link to="/" className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-navy/60 hover:bg-soft"><Globe className="h-5 w-5" />Kembali ke situs</Link>
          </div>
        </div>
      )}

      <ConfirmDialog open={confirm} title="Keluar dari akun?" message="Sesi Anda akan diakhiri." confirmLabel="Keluar" onCancel={() => setConfirm(false)} onConfirm={() => { logout(); nav('/') }} />
      <ConfirmDialog open={confirmReset} tone="danger" title="Reset data demo?" message="Semua data prototipe (akun baru, janji, konsultasi, perubahan konten) dikembalikan ke data awal dan Anda akan keluar." confirmLabel="Reset"
        onCancel={() => setConfirmReset(false)} onConfirm={() => { resetDemo(); setConfirmReset(false); nav('/') }} />
    </div>
  )
}
