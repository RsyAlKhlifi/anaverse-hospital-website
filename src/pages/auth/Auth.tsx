import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { CheckCircle2, Eye, EyeOff } from 'lucide-react'
import { DEMO_ACCOUNTS } from '../../data/mock'
import { isBackendConfigured } from '../../lib/supabase'
import { useStore } from '../../lib/store'
import { useDocumentTitle } from '../../lib/hooks'
import { isEmail, isPhone, passwordIssue } from '../../lib/utils'
import { Button, Field, Input, Logo } from '../../components/ui'
import { portalHome } from '../../components/PublicLayout'
import { useToast } from '../../components/toast'
import { IMG } from '../../data/images'
import { Img } from '../../components/ui'

function Shell({ title, desc, children }: { title: string; desc: string; children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col px-4 py-8 sm:px-10">
        <Link to="/" aria-label="Beranda"><Logo /></Link>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
          <p className="mb-6 mt-2 text-navy/60">{desc}</p>
          {children}
        </div>
      </div>
      <div className="relative hidden lg:block">
        <Img src={IMG.hero} alt="" className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-royal-700/80 to-royal/10" />
        <p className="absolute bottom-10 left-10 right-10 text-2xl font-extrabold leading-snug text-white">Kesehatan Anda, Prioritas Kami.<span className="mt-2 block text-sm font-medium text-white/80">Janji temu dan konsultasi online dalam satu akun.</span></p>
      </div>
    </div>
  )
}

function PasswordInput(p: React.ComponentProps<typeof Input>) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <Input {...p} type={show ? 'text' : 'password'} className="pr-12" />
      <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-navy/50 hover:bg-soft">
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  )
}

export function Login() {
  useDocumentTitle('Masuk')
  const { login, user } = useStore()
  const nav = useNavigate()
  const loc = useLocation()
  const from = (loc.state as { from?: string } | null)?.from
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [err, setErr] = useState<{ email?: string; pw?: string; form?: string }>({})
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to={from && from.startsWith(portalHome(user.role)) ? from : portalHome(user.role)} replace />

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const n: typeof err = {}
    if (!isEmail(email)) n.email = 'Masukkan email yang valid.'
    if (!pw) n.pw = 'Kata sandi wajib diisi.'
    setErr(n)
    if (Object.keys(n).length) return
    setBusy(true)
    const r = await login(email, pw)
    setBusy(false)
    if (!r.ok) return setErr({ form: r.error })
    const role = r.data!.role
    nav(from && from.startsWith(portalHome(role)) ? from : portalHome(role), { replace: true })
  }

  return (
    <Shell title="Masuk" desc="Masuk untuk mengelola janji temu dan konsultasi Anda.">
      <form onSubmit={submit} noValidate className="space-y-4">
        {err.form && <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{err.form}</p>}
        <Field label="Email" error={err.email}><Input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <Field label="Kata sandi" error={err.pw}><PasswordInput autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} /></Field>
        <div className="text-right"><Link to="/lupa-password" className="text-sm font-semibold text-royal">Lupa kata sandi?</Link></div>
        <Button type="submit" loading={busy} className="w-full" size="lg">Masuk</Button>
      </form>
      <p className="mt-6 text-center text-sm text-navy/60">Belum punya akun? <Link to="/daftar" className="font-semibold text-royal">Daftar sebagai pasien</Link></p>
      {!isBackendConfigured && (
        <div className="mt-8 rounded-2xl border border-dashed border-royal/30 bg-mist p-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-royal">Akun demo (prototipe)</p>
          <div className="flex flex-wrap gap-2">
            {DEMO_ACCOUNTS.map((a) => <Button key={a.label} variant="soft" size="sm" onClick={() => { setEmail(a.email); setPw(a.password); setErr({}) }}>Isi akun {a.label}</Button>)}
          </div>
          <p className="mt-2 text-xs text-navy/50">Tombol hanya mengisi formulir; tekan Masuk untuk melanjutkan.</p>
        </div>
      )}
    </Shell>
  )
}

export function Register() {
  useDocumentTitle('Daftar')
  const { register, user } = useStore()
  const nav = useNavigate()
  const toast = useToast()
  const [f, setF] = useState({ name: '', email: '', phone: '', password: '', confirm: '' })
  const [err, setErr] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  if (user) return <Navigate to={portalHome(user.role)} replace />
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const n: Record<string, string> = {}
    if (f.name.trim().length < 3) n.name = 'Nama lengkap minimal 3 karakter.'
    if (!isEmail(f.email)) n.email = 'Masukkan email yang valid.'
    if (!isPhone(f.phone)) n.phone = 'Gunakan nomor Indonesia, mis. 0812xxxxxxx.'
    const pi = passwordIssue(f.password)
    if (pi) n.password = pi
    if (f.confirm !== f.password) n.confirm = 'Konfirmasi kata sandi tidak sama.'
    setErr(n)
    if (Object.keys(n).length) return
    setBusy(true)
    const r = await register(f)
    setBusy(false)
    if (!r.ok) return setErr({ email: r.error! })
    toast.success('Akun berhasil dibuat. Selamat datang!')
    nav('/pasien', { replace: true })
  }

  return (
    <Shell title="Daftar Akun Pasien" desc="Buat akun untuk membuat janji temu dan berkonsultasi dengan dokter.">
      <form onSubmit={submit} noValidate className="space-y-4">
        <Field label="Nama lengkap" error={err.name}><Input autoComplete="name" value={f.name} onChange={set('name')} /></Field>
        <Field label="Email" error={err.email}><Input type="email" autoComplete="email" value={f.email} onChange={set('email')} /></Field>
        <Field label="Nomor telepon" error={err.phone}><Input type="tel" autoComplete="tel" value={f.phone} onChange={set('phone')} /></Field>
        <Field label="Kata sandi" error={err.password} hint="Minimal 8 karakter, kombinasi huruf dan angka."><PasswordInput autoComplete="new-password" value={f.password} onChange={set('password')} /></Field>
        <Field label="Konfirmasi kata sandi" error={err.confirm}><PasswordInput autoComplete="new-password" value={f.confirm} onChange={set('confirm')} /></Field>
        <Button type="submit" loading={busy} className="w-full" size="lg">Daftar</Button>
      </form>
      <p className="mt-6 text-center text-sm text-navy/60">Sudah punya akun? <Link to="/masuk" className="font-semibold text-royal">Masuk</Link></p>
    </Shell>
  )
}

export function Forgot() {
  useDocumentTitle('Lupa Kata Sandi')
  const { requestReset } = useStore()
  const [email, setEmail] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState<{ token?: string } | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!isEmail(email)) return setErr('Masukkan email yang valid.')
    setErr('')
    setBusy(true)
    const r = await requestReset(email)
    setBusy(false)
    setDone(r.data ?? {})
  }

  return (
    <Shell title="Lupa Kata Sandi" desc="Masukkan email akun Anda untuk mengatur ulang kata sandi.">
      {done ? (
        <div className="space-y-4 rounded-3xl bg-soft p-5 text-sm">
          <p className="flex gap-2 font-semibold"><CheckCircle2 className="h-5 w-5 shrink-0 text-royal" />Jika email terdaftar, tautan reset akan dikirim.</p>
          {!isBackendConfigured && (
            <div className="rounded-2xl bg-white p-4">
              <p className="mb-2 text-xs text-navy/60">Mode prototipe tidak mengirim email. {done.token ? 'Gunakan tautan berikut (berlaku 30 menit):' : 'Email ini tidak ditemukan pada data demo.'}</p>
              {done.token && <Link to={`/reset-password/${done.token}`} className="font-semibold text-royal underline">Buka halaman reset kata sandi</Link>}
            </div>
          )}
          <Link to="/masuk" className="block text-center font-semibold text-royal">Kembali ke halaman masuk</Link>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="space-y-4">
          <Field label="Email" error={err}><Input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
          <Button type="submit" loading={busy} className="w-full" size="lg">Kirim Tautan Reset</Button>
          <Link to="/masuk" className="block text-center text-sm font-semibold text-royal">Kembali ke halaman masuk</Link>
        </form>
      )}
    </Shell>
  )
}

export function ResetPassword() {
  useDocumentTitle('Atur Ulang Kata Sandi')
  const { token = '' } = useParams()
  const { resetPassword, resets } = useStore()
  const nav = useNavigate()
  const toast = useToast()
  const valid = resets.some((r) => r.token === token && r.expires > Date.now())
  const [pw, setPw] = useState('')
  const [cf, setCf] = useState('')
  const [err, setErr] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const n: Record<string, string> = {}
    const pi = passwordIssue(pw)
    if (pi) n.pw = pi
    if (cf !== pw) n.cf = 'Konfirmasi kata sandi tidak sama.'
    setErr(n)
    if (Object.keys(n).length) return
    setBusy(true)
    const r = await resetPassword(token, pw)
    setBusy(false)
    if (!r.ok) return setErr({ form: r.error! })
    toast.success('Kata sandi diperbarui. Silakan masuk.')
    nav('/masuk', { replace: true })
  }

  if (!valid)
    return (
      <Shell title="Tautan Tidak Valid" desc="Tautan reset kata sandi tidak valid atau sudah kedaluwarsa.">
        <Link to="/lupa-password" className="font-semibold text-royal">Minta tautan baru</Link>
      </Shell>
    )
  return (
    <Shell title="Atur Ulang Kata Sandi" desc="Buat kata sandi baru untuk akun Anda.">
      <form onSubmit={submit} noValidate className="space-y-4">
        {err.form && <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{err.form}</p>}
        <Field label="Kata sandi baru" error={err.pw} hint="Minimal 8 karakter, kombinasi huruf dan angka."><PasswordInput autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} /></Field>
        <Field label="Konfirmasi kata sandi" error={err.cf}><PasswordInput autoComplete="new-password" value={cf} onChange={(e) => setCf(e.target.value)} /></Field>
        <Button type="submit" loading={busy} className="w-full" size="lg">Simpan Kata Sandi</Button>
      </form>
    </Shell>
  )
}
