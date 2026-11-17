import { useState, type FormEvent } from 'react'
import { useStore } from '../../lib/store'
import { useDocumentTitle } from '../../lib/hooks'
import { isEmail, isPhone, passwordIssue } from '../../lib/utils'
import { Button, Card, Field, Input, PageHeader, Select, Textarea } from '../../components/ui'
import { useToast } from '../../components/toast'

export default function PatientProfile() {
  useDocumentTitle('Profil Saya')
  const { user, updateProfile, changePassword } = useStore()
  const toast = useToast()
  const [f, setF] = useState({ name: user?.name ?? '', email: user?.email ?? '', phone: user?.phone ?? '', address: user?.address ?? '', birthDate: user?.birthDate ?? '', gender: user?.gender ?? '' })
  const [err, setErr] = useState<Record<string, string>>({})
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' })
  const [pwErr, setPwErr] = useState<Record<string, string>>({})
  const [savingPw, setSavingPw] = useState(false)
  const [settings, setSettings] = useState(user?.settings ?? { reminders: true, newsletter: false })
  if (!user) return null
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }))

  const saveProfile = (e: FormEvent) => {
    e.preventDefault()
    const n: Record<string, string> = {}
    if (f.name.trim().length < 3) n.name = 'Nama minimal 3 karakter.'
    if (!isEmail(f.email)) n.email = 'Email tidak valid.'
    if (!isPhone(f.phone)) n.phone = 'Gunakan nomor Indonesia, mis. 0812xxxxxxx.'
    if (f.birthDate && f.birthDate > new Date().toISOString().slice(0, 10)) n.birthDate = 'Tanggal lahir tidak boleh di masa depan.'
    setErr(n)
    if (Object.keys(n).length) return
    const r = updateProfile({ ...f, gender: f.gender as 'Laki-laki' | 'Perempuan' | '' })
    r.ok ? toast.success('Profil diperbarui.') : setErr({ email: r.error! })
  }

  const savePw = async (e: FormEvent) => {
    e.preventDefault()
    if (savingPw) return
    const n: Record<string, string> = {}
    if (!pw.current) n.current = 'Masukkan kata sandi saat ini.'
    const pi = passwordIssue(pw.next)
    if (pi) n.next = pi
    if (pw.confirm !== pw.next) n.confirm = 'Konfirmasi tidak sama.'
    setPwErr(n)
    if (Object.keys(n).length) return
    setSavingPw(true)
    const r = await changePassword(pw.current, pw.next)
    setSavingPw(false)
    if (!r.ok) return setPwErr({ current: r.error! })
    setPw({ current: '', next: '', confirm: '' })
    toast.success('Kata sandi diubah.')
  }

  const toggle = (k: 'reminders' | 'newsletter') => {
    const next = { ...settings, [k]: !settings[k] }
    setSettings(next)
    updateProfile({ settings: next })
    toast.info('Pengaturan diperbarui.')
  }

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title="Profil Saya" desc="Perbarui data pribadi dan pengaturan akun." />
      <Card>
        <form onSubmit={saveProfile} noValidate className="space-y-4">
          <h2 className="text-lg font-bold">Data Pribadi</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nama lengkap" error={err.name}><Input value={f.name} onChange={set('name')} /></Field>
            <Field label="Email" error={err.email} hint="Email akun tidak dapat diubah. Hubungi administrator bila perlu."><Input type="email" value={f.email} readOnly /></Field>
            <Field label="Nomor telepon" error={err.phone}><Input type="tel" value={f.phone} onChange={set('phone')} /></Field>
            <Field label="Tanggal lahir" error={err.birthDate}><Input type="date" value={f.birthDate} onChange={set('birthDate')} /></Field>
            <Field label="Jenis kelamin"><Select value={f.gender} onChange={set('gender')}><option value="">Pilih…</option><option>Laki-laki</option><option>Perempuan</option></Select></Field>
          </div>
          <Field label="Alamat"><Textarea rows={3} value={f.address} onChange={set('address')} /></Field>
          <Button type="submit">Simpan Perubahan</Button>
        </form>
      </Card>
      <Card>
        <form onSubmit={savePw} noValidate className="space-y-4">
          <h2 className="text-lg font-bold">Ubah Kata Sandi</h2>
          <Field label="Kata sandi saat ini" error={pwErr.current}><Input type="password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Kata sandi baru" error={pwErr.next}><Input type="password" autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} /></Field>
            <Field label="Konfirmasi" error={pwErr.confirm}><Input type="password" autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} /></Field>
          </div>
          <Button type="submit" variant="outline" disabled={savingPw}>{savingPw ? 'Menyimpan…' : 'Ubah Kata Sandi'}</Button>
        </form>
      </Card>
      <Card className="space-y-3">
        <h2 className="text-lg font-bold">Pengaturan Akun</h2>
        {([['reminders', 'Pengingat jadwal', 'Tampilkan pengingat untuk janji dan konsultasi mendatang.'], ['newsletter', 'Buletin kesehatan', 'Terima tips dan berita kesehatan.']] as const).map(([k, t, d]) => (
          <label key={k} className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl bg-mist p-4">
            <span><b className="block text-sm">{t}</b><span className="text-xs text-navy/60">{d}</span></span>
            <input type="checkbox" role="switch" className="h-5 w-5 accent-royal" checked={settings[k]} onChange={() => toggle(k)} />
          </label>
        ))}
        <p className="text-xs text-navy/50">Preferensi ini belum disimpan ke database dan belum mengirim notifikasi.</p>
      </Card>
    </div>
  )
}