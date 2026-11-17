import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type {
  Appointment, AppointmentStatus, CollectionKey, Consultation, ConsultationStatus, DB, Payer, Role, ScheduleKind, User,
} from '../types'
import { seed } from '../data/mock'
import { generateSlots, hoursUntil, isEmail, parseISO, refNumber, sleep, todayISO, uid } from './utils'

/**
 * Lapisan data PROTOTIPE: seluruh data disimpan di localStorage browser.
 * Tanda tangan fungsi di sini adalah kontrak yang nanti diganti dengan pemanggilan Supabase
 * (lihat README dan supabase/schema.sql). Tidak ada transaksi nyata, email, atau pembayaran.
 */
const KEY = 'anaverse.db.v1'
const SESSION_KEY = 'anaverse.session'

/** Login disimpan per tab (sessionStorage) agar pasien dan dokter bisa login bersamaan di tab berbeda. */
const readSession = (): string | null => {
  try {
    return sessionStorage.getItem(SESSION_KEY)
  } catch {
    return null
  }
}
const writeSession = (id: string | null) => {
  try {
    if (id) sessionStorage.setItem(SESSION_KEY, id)
    else sessionStorage.removeItem(SESSION_KEY)
  } catch {
    /* diblokir */
  }
}

/**
 * Gambar bawaan (/images/... atau Unsplash) selalu diambil ulang dari data awal, supaya perubahan di
 * src/data/images.ts langsung terlihat tanpa reset. URL kustom yang diisi admin tidak ikut ditimpa.
 */
const isManagedImage = (v: unknown) => typeof v === 'string' && (v.startsWith('/images/') || v.includes('images.unsplash.com'))

function syncImages(db: DB): DB {
  const fresh = seed()
  const fix = <T extends { id: string }>(list: T[], base: T[], key: string): T[] =>
    list.map((item) => {
      const b = base.find((x) => x.id === item.id) as Record<string, unknown> | undefined
      return b && isManagedImage((item as Record<string, unknown>)[key]) ? ({ ...item, [key]: b[key] } as T) : item
    })
  return {
    ...db,
    doctors: fix(db.doctors, fresh.doctors, 'photo'),
    services: fix(db.services, fresh.services, 'image'),
    facilities: fix(db.facilities, fresh.facilities, 'image'),
    articles: fix(db.articles, fresh.articles, 'image'),
  }
}

function load(): DB {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return syncImages({ ...seed(), ...JSON.parse(raw) })
  } catch {
    /* abaikan data rusak */
  }
  return seed()
}

export interface Result<T = undefined> {
  ok: boolean
  error?: string
  data?: T
}
const fail = (error: string): Result<never> => ({ ok: false, error })

export interface Slot {
  time: string
  available: boolean
}

export const CANCEL_WINDOW_HOURS = 24

export function cancelPolicy(item: { date: string; time: string; status: string }): { ok: boolean; reason?: string } {
  if (item.status === 'Selesai' || item.status === 'Dibatalkan' || item.status === 'Aktif')
    return { ok: false, reason: 'Jadwal ini tidak dapat dibatalkan lagi.' }
  if (hoursUntil(item.date, item.time) < CANCEL_WINDOW_HOURS)
    return { ok: false, reason: `Pembatalan maksimal ${CANCEL_WINDOW_HOURS} jam sebelum jadwal. Hubungi rumah sakit untuk bantuan.` }
  return { ok: true }
}

interface Store extends DB {
  user: User | null
  login(email: string, password: string): Promise<Result<User>>
  register(d: { name: string; email: string; phone: string; password: string }): Promise<Result<User>>
  logout(): void
  requestReset(email: string): Promise<Result<{ token?: string }>>
  resetPassword(token: string, password: string): Promise<Result>
  updateProfile(patch: Partial<User>): Result
  changePassword(current: string, next: string): Result

  slotsFor(doctorId: string, date: string, kind: ScheduleKind): Slot[]
  createAppointment(d: { doctorId: string; date: string; time: string; complaint: string; notes?: string; payer: Payer }): Promise<Result<Appointment>>
  setAppointmentStatus(id: string, status: AppointmentStatus, reason?: string): Result
  cancelAppointment(id: string): Result
  createConsultation(d: { doctorId: string; date: string; time: string; complaint: string }): Promise<Result<Consultation>>
  setConsultationStatus(id: string, status: ConsultationStatus, extra?: { summary?: string; reason?: string }): Result
  cancelConsultation(id: string): Result
  sendMessage(consultationId: string, text: string): Result

  save<T extends { id: string }>(key: CollectionKey, item: T): void
  remove(key: CollectionKey, id: string): void
  saveDoctorWithAccount(doctor: DoctorInput, account?: { email: string; password: string }): Result
  deleteDoctor(id: string): Result
  setUserActive(id: string, active: boolean): void
  addContact(d: { name: string; email: string; subject: string; message: string }): Promise<Result>
  resetDemo(): void
}

type DoctorInput = import('../types').Doctor

const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<DB>(load)
  const ref = useRef(db)
  const [sessionId, setSessionId] = useState<string | null>(readSession)
  const sessionRef = useRef(sessionId)
  const setSession = useCallback((id: string | null) => {
    sessionRef.current = id
    writeSession(id)
    setSessionId(id)
  }, [])

  const commit = useCallback((fn: (d: DB) => DB) => {
    const next = fn(ref.current)
    ref.current = next
    setDb(next)
    try {
      localStorage.setItem(KEY, JSON.stringify(next))
    } catch {
      /* penyimpanan penuh/diblokir */
    }
  }, [])

  // Sinkronisasi antar tab (membuat chat dokter–pasien terasa real-time saat dua tab dibuka)
  useEffect(() => {
    const h = (e: StorageEvent) => {
      if (e.key === KEY && e.newValue) {
        const next = { ...seed(), ...JSON.parse(e.newValue) } as DB
        ref.current = next
        setDb(next)
      }
    }
    window.addEventListener('storage', h)
    return () => window.removeEventListener('storage', h)
  }, [])

  const user = useMemo(() => db.users.find((u) => u.id === sessionId && u.active) ?? null, [db.users, sessionId])

  const api = useMemo<Store>(() => {
    const cur = () => ref.current
    const me = () => cur().users.find((u) => u.id === sessionRef.current) ?? null

    const slotsFor: Store['slotsFor'] = (doctorId, date, kind) => {
      const d = cur()
      const wd = parseISO(date).getDay()
      const taken = new Set<string>([
        ...d.appointments.filter((a) => a.doctorId === doctorId && a.date === date && a.status !== 'Dibatalkan').map((a) => a.time),
        ...d.consultations.filter((c) => c.doctorId === doctorId && c.date === date && c.status !== 'Dibatalkan').map((c) => c.time),
      ])
      const now = new Date()
      const nowMin = now.getHours() * 60 + now.getMinutes()
      const isToday = date === todayISO()
      const times = d.schedules
        .filter((s) => s.doctorId === doctorId && s.weekday === wd && s.kind === kind)
        .flatMap((s) => generateSlots(s.start, s.end))
      return [...new Set(times)].sort().map((time) => {
        const [h, m] = time.split(':').map(Number)
        const past = date < todayISO() || (isToday && h * 60 + m <= nowMin)
        return { time, available: !taken.has(time) && !past }
      })
    }

    const requirePatient = () => {
      const u = me()
      return u && u.role === 'patient' && u.active ? u : null
    }

    return {
      ...db,
      user,
      slotsFor,

      async login(email, password) {
        await sleep(600)
        const u = cur().users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase())
        if (!u || u.password !== password) return fail('Email atau kata sandi salah.')
        if (!u.active) return fail('Akun Anda dinonaktifkan. Hubungi administrator rumah sakit.')
        setSession(u.id)
        return { ok: true, data: u }
      },

      async register(f) {
        await sleep(700)
        if (cur().users.some((x) => x.email.toLowerCase() === f.email.trim().toLowerCase())) return fail('Email sudah terdaftar. Silakan masuk.')
        const u: User = {
          id: uid('p'), name: f.name.trim(), email: f.email.trim(), phone: f.phone.trim(), password: f.password,
          role: 'patient', active: true, createdAt: new Date().toISOString(), gender: '', settings: { reminders: true, newsletter: false },
        }
        commit((d) => ({ ...d, users: [...d.users, u] }))
        setSession(u.id)
        return { ok: true, data: u }
      },

      logout() {
        setSession(null)
      },

      async requestReset(email) {
        await sleep(600)
        const u = cur().users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase())
        if (!u) return { ok: true, data: {} }
        const token = uid('rst') + uid('')
        commit((d) => ({ ...d, resets: [...d.resets.filter((r) => r.email !== u.email), { token, email: u.email, expires: Date.now() + 30 * 60000 }] }))
        return { ok: true, data: { token } }
      },

      async resetPassword(token, password) {
        await sleep(600)
        const r = cur().resets.find((x) => x.token === token)
        if (!r || r.expires < Date.now()) return fail('Tautan reset tidak valid atau sudah kedaluwarsa.')
        commit((d) => ({
          ...d,
          users: d.users.map((u) => (u.email === r.email ? { ...u, password } : u)),
          resets: d.resets.filter((x) => x.token !== token),
        }))
        return { ok: true }
      },

      updateProfile(patch) {
        const u = me()
        if (!u) return fail('Sesi berakhir. Silakan masuk kembali.')
        if (patch.email && !isEmail(patch.email)) return fail('Format email tidak valid.')
        if (patch.email && cur().users.some((x) => x.id !== u.id && x.email.toLowerCase() === patch.email!.toLowerCase())) return fail('Email sudah dipakai akun lain.')
        const { role: _r, id: _i, active: _a, ...safe } = patch
        commit((d) => ({ ...d, users: d.users.map((x) => (x.id === u.id ? { ...x, ...safe } : x)) }))
        return { ok: true }
      },

      changePassword(current, next) {
        const u = me()
        if (!u) return fail('Sesi berakhir. Silakan masuk kembali.')
        if (u.password !== current) return fail('Kata sandi saat ini salah.')
        commit((d) => ({ ...d, users: d.users.map((x) => (x.id === u.id ? { ...x, password: next } : x)) }))
        return { ok: true }
      },

      async createAppointment(f) {
        await sleep(700)
        const u = requirePatient()
        if (!u) return fail('Hanya akun pasien yang dapat membuat janji temu.')
        const slot = slotsFor(f.doctorId, f.date, 'offline').find((s) => s.time === f.time)
        if (!slot) return fail('Jadwal tersebut tidak tersedia untuk dokter ini.')
        if (!slot.available) return fail('Maaf, jam ini baru saja dipesan. Silakan pilih jam lain.')
        const a: Appointment = {
          id: uid('a'), ref: refNumber('ANV'), patientId: u.id, doctorId: f.doctorId, date: f.date, time: f.time,
          complaint: f.complaint.trim(), notes: f.notes?.trim() || undefined, payer: f.payer, status: 'Menunggu Konfirmasi', createdAt: new Date().toISOString(),
        }
        commit((d) => ({ ...d, appointments: [...d.appointments, a] }))
        return { ok: true, data: a }
      },

      setAppointmentStatus(id, status, reason) {
        commit((d) => ({
          ...d,
          appointments: d.appointments.map((a) => (a.id === id ? { ...a, status, cancelReason: status === 'Dibatalkan' ? reason || a.cancelReason : a.cancelReason } : a)),
        }))
        return { ok: true }
      },

      cancelAppointment(id) {
        const u = me()
        const a = cur().appointments.find((x) => x.id === id)
        if (!a || !u || a.patientId !== u.id) return fail('Janji temu tidak ditemukan.')
        const p = cancelPolicy(a)
        if (!p.ok) return fail(p.reason!)
        commit((d) => ({ ...d, appointments: d.appointments.map((x) => (x.id === id ? { ...x, status: 'Dibatalkan', cancelReason: 'Dibatalkan oleh pasien' } : x)) }))
        return { ok: true }
      },

      async createConsultation(f) {
        await sleep(700)
        const u = requirePatient()
        if (!u) return fail('Hanya akun pasien yang dapat membuat konsultasi.')
        const slot = slotsFor(f.doctorId, f.date, 'online').find((s) => s.time === f.time)
        if (!slot) return fail('Jadwal tersebut tidak tersedia untuk dokter ini.')
        if (!slot.available) return fail('Maaf, jam ini baru saja dipesan. Silakan pilih jam lain.')
        const c: Consultation = {
          id: uid('c'), ref: refNumber('KON'), patientId: u.id, doctorId: f.doctorId, date: f.date, time: f.time,
          complaint: f.complaint.trim(), channel: 'chat', status: 'Menunggu', createdAt: new Date().toISOString(),
        }
        commit((d) => ({ ...d, consultations: [...d.consultations, c] }))
        return { ok: true, data: c }
      },

      setConsultationStatus(id, status, extra) {
        commit((d) => ({
          ...d,
          consultations: d.consultations.map((c) =>
            c.id === id ? { ...c, status, summary: extra?.summary ?? c.summary, cancelReason: status === 'Dibatalkan' ? extra?.reason ?? c.cancelReason : c.cancelReason } : c,
          ),
        }))
        return { ok: true }
      },

      cancelConsultation(id) {
        const u = me()
        const c = cur().consultations.find((x) => x.id === id)
        if (!c || !u || c.patientId !== u.id) return fail('Konsultasi tidak ditemukan.')
        const p = cancelPolicy(c)
        if (!p.ok) return fail(p.reason!)
        commit((d) => ({ ...d, consultations: d.consultations.map((x) => (x.id === id ? { ...x, status: 'Dibatalkan', cancelReason: 'Dibatalkan oleh pasien' } : x)) }))
        return { ok: true }
      },

      sendMessage(consultationId, text) {
        const u = me()
        const c = cur().consultations.find((x) => x.id === consultationId)
        if (!u || !c) return fail('Konsultasi tidak ditemukan.')
        const allowed = (u.role === 'patient' && c.patientId === u.id) || (u.role === 'doctor' && c.doctorId === u.doctorId)
        if (!allowed) return fail('Anda tidak memiliki akses ke konsultasi ini.')
        if (c.status !== 'Aktif') return fail('Sesi konsultasi belum aktif atau sudah berakhir.')
        if (!text.trim()) return fail('Pesan kosong.')
        commit((d) => ({
          ...d,
          messages: [...d.messages, { id: uid('m'), consultationId, senderId: u.role === 'doctor' ? `u-${u.doctorId}` : u.id, senderRole: u.role as Role, text: text.trim(), createdAt: new Date().toISOString() }],
        }))
        return { ok: true }
      },

      save(key, item) {
        commit((d) => {
          const list = d[key] as unknown as { id: string }[]
          const exists = list.some((x) => x.id === item.id)
          const next = exists ? list.map((x) => (x.id === item.id ? item : x)) : [...list, item]
          return { ...d, [key]: next } as DB
        })
      },

      remove(key, id) {
        commit((d) => ({ ...d, [key]: (d[key] as unknown as { id: string }[]).filter((x) => x.id !== id) }) as DB)
      },

      saveDoctorWithAccount(doctor, account) {
        const d0 = cur()
        const isNew = !d0.doctors.some((x) => x.id === doctor.id)
        if (isNew) {
          if (!account) return fail('Email dan kata sandi akun dokter wajib diisi.')
          if (!isEmail(account.email)) return fail('Format email tidak valid.')
          if (d0.users.some((u) => u.email.toLowerCase() === account.email.toLowerCase())) return fail('Email sudah terdaftar.')
        }
        commit((d) => ({
          ...d,
          doctors: isNew ? [...d.doctors, doctor] : d.doctors.map((x) => (x.id === doctor.id ? doctor : x)),
          users: d.users.map((u) => (u.doctorId === doctor.id ? { ...u, name: doctor.name } : u)).concat(
            isNew && account
              ? [{ id: `u-${doctor.id}`, name: doctor.name, email: account.email, phone: '', password: account.password, role: 'doctor' as Role, doctorId: doctor.id, active: true, createdAt: new Date().toISOString(), gender: '' as const }]
              : [],
          ),
        }))
        return { ok: true }
      },

      deleteDoctor(id) {
        const d0 = cur()
        const busy =
          d0.appointments.some((a) => a.doctorId === id && (a.status === 'Menunggu Konfirmasi' || a.status === 'Dikonfirmasi')) ||
          d0.consultations.some((c) => c.doctorId === id && ['Menunggu', 'Dijadwalkan', 'Aktif'].includes(c.status))
        if (busy) return fail('Dokter masih memiliki janji atau konsultasi aktif. Selesaikan atau batalkan terlebih dahulu.')
        commit((d) => ({
          ...d,
          doctors: d.doctors.filter((x) => x.id !== id),
          schedules: d.schedules.filter((s) => s.doctorId !== id),
          users: d.users.filter((u) => u.doctorId !== id),
        }))
        return { ok: true }
      },

      setUserActive(id, active) {
        commit((d) => ({ ...d, users: d.users.map((u) => (u.id === id ? { ...u, active } : u)) }))
      },

      async addContact(f) {
        await sleep(600)
        commit((d) => ({ ...d, contacts: [{ id: uid('msg'), ...f, createdAt: new Date().toISOString() }, ...d.contacts] }))
        return { ok: true }
      },

      resetDemo() {
        commit(() => seed())
        setSession(null)
      },
    }
  }, [db, user, commit, setSession])

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}

export function useStore() {
  const s = useContext(Ctx)
  if (!s) throw new Error('useStore harus dipakai di dalam StoreProvider')
  return s
}

/* ---------- helper turunan ---------- */
export const specialtyName = (db: DB, id: string) => db.specialties.find((s) => s.id === id)?.name ?? '—'
export const doctorOf = (db: DB, id: string) => db.doctors.find((d) => d.id === id)
export const userOf = (db: DB, id: string) => db.users.find((u) => u.id === id)