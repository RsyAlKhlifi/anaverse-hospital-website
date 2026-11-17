/* eslint-disable @typescript-eslint/no-explicit-any */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type {
  Appointment, AppointmentStatus, CollectionKey, Consultation, ConsultationStatus, ContactMessage, DB, Doctor, Message, Payer, Role, ScheduleKind, User,
} from '../types'
import { supabase } from './supabase'
import { generateSlots, hoursUntil, isEmail, parseISO, refNumber, todayISO, uid } from './utils'

/**
 * Lapisan data Supabase. Kontrak useStore() dibuat semirip mungkin dengan versi localStorage
 * (disimpan di store.local.tsx) supaya komponen tidak perlu diubah.
 * - Data publik (dokter, layanan, dst.) dimuat saat aplikasi dibuka.
 * - Data privat (profil, janji, konsultasi, chat) dimuat setelah login; RLS yang menyaring isinya.
 * - Fungsi yang sebelumnya sinkron tetap sinkron: perubahan tampil langsung (optimistis), lalu
 *   dikirim ke Supabase di latar belakang dan data dimuat ulang agar sama dengan database.
 */

type Row = Record<string, any>
type Scope = 'public' | 'private' | 'both'
type Booked = { doctorId: string; date: string; time: string }

const EMPTY: DB = {
  users: [], specialties: [], doctors: [], schedules: [], appointments: [], consultations: [], messages: [],
  services: [], facilities: [], articles: [], testimonials: [], faqs: [], contacts: [], resets: [], sessionUserId: null,
}

const hm = (t: string | null | undefined) => (t ? t.slice(0, 5) : '')
const isUuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)

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

/* ---------- pemetaan tabel ⇄ tipe aplikasi ---------- */

const COLLECTIONS: Record<CollectionKey, { from: (r: Row) => any; to: (x: any) => Row; order?: { col: string; asc: boolean } }> = {
  specialties: {
    from: (r) => ({ id: r.id, name: r.name, icon: r.icon }),
    to: (x) => ({ name: x.name, icon: x.icon }),
  },
  doctors: {
    from: (r) => ({
      id: r.id, name: r.name, specialtyId: r.specialty_id, experience: r.experience_years, rating: Number(r.rating),
      photo: r.photo_url ?? '', bio: r.bio ?? '', education: r.education ?? '',
    }),
    to: (x) => ({
      name: x.name, specialty_id: x.specialtyId, experience_years: x.experience, rating: x.rating,
      photo_url: x.photo || null, bio: x.bio, education: x.education,
    }),
  },
  schedules: {
    from: (r) => ({ id: r.id, doctorId: r.doctor_id, weekday: r.weekday, start: hm(r.start_time), end: hm(r.end_time), kind: r.kind }),
    to: (x) => ({ doctor_id: x.doctorId, weekday: x.weekday, start_time: x.start, end_time: x.end, kind: x.kind }),
  },
  services: {
    from: (r) => ({
      id: r.id, slug: r.slug, name: r.name, icon: r.icon ?? '', image: r.image_url ?? '', summary: r.summary ?? '',
      description: r.description ?? '', features: r.features ?? [], hours: r.hours ?? '',
    }),
    to: (x) => ({
      slug: x.slug, name: x.name, icon: x.icon, image_url: x.image || null, summary: x.summary,
      description: x.description, features: x.features, hours: x.hours,
    }),
  },
  facilities: {
    from: (r) => ({ id: r.id, name: r.name, image: r.image_url ?? '', description: r.description ?? '' }),
    to: (x) => ({ name: x.name, image_url: x.image || null, description: x.description }),
  },
  articles: {
    from: (r) => ({
      id: r.id, slug: r.slug, title: r.title, category: r.category, excerpt: r.excerpt ?? '', content: r.content ?? '',
      image: r.image_url ?? '', date: r.published_at,
    }),
    to: (x) => ({
      slug: x.slug, title: x.title, category: x.category, excerpt: x.excerpt, content: x.content,
      image_url: x.image || null, published_at: x.date,
    }),
    order: { col: 'published_at', asc: false },
  },
  testimonials: {
    from: (r) => ({ id: r.id, name: r.patient_name, service: r.service ?? '', rating: r.rating, text: r.body }),
    to: (x) => ({ patient_name: x.name, service: x.service, rating: x.rating, body: x.text }),
  },
  faqs: {
    from: (r) => ({ id: r.id, q: r.question, a: r.answer }),
    to: (x) => ({ question: x.q, answer: x.a }),
    order: { col: 'position', asc: true },
  },
}
const COLLECTION_KEYS = Object.keys(COLLECTIONS) as CollectionKey[]

const TABLE: Record<CollectionKey, string> = {
  specialties: 'specialties',
  doctors: 'doctors',
  schedules: 'doctor_schedules',
  services: 'services',
  facilities: 'facilities',
  articles: 'articles',
  testimonials: 'testimonials',
  faqs: 'faqs',
}

const toAppt = (r: Row): Appointment => ({
  id: r.id, ref: r.reference, patientId: r.patient_id, doctorId: r.doctor_id, date: r.appointment_date, time: hm(r.appointment_time),
  complaint: r.complaint, notes: r.notes ?? undefined, payer: r.payer as Payer, status: r.status as AppointmentStatus,
  cancelReason: r.cancel_reason ?? undefined, createdAt: r.created_at,
})
const toCons = (r: Row): Consultation => ({
  id: r.id, ref: r.reference, patientId: r.patient_id, doctorId: r.doctor_id, date: r.consultation_date, time: hm(r.consultation_time),
  complaint: r.complaint, channel: r.channel, status: r.status as ConsultationStatus, summary: r.summary ?? undefined,
  cancelReason: r.cancel_reason ?? undefined, createdAt: r.created_at,
})
const toUser = (r: Row, profMap: Record<string, string>): User => ({
  id: r.id, name: r.full_name, email: r.email, phone: r.phone ?? '', password: '', role: r.role as Role,
  address: r.address ?? undefined, birthDate: r.birth_date ?? undefined, gender: (r.gender ?? '') as User['gender'],
  doctorId: profMap[r.id], active: r.active, createdAt: r.created_at, settings: { reminders: true, newsletter: false },
})
const toContact = (r: Row): ContactMessage => ({
  id: r.id, name: r.name, email: r.email, subject: r.subject, message: r.message, createdAt: r.created_at,
})

const logErr = (where: string, e: { message: string } | null) => {
  if (e) console.error(`[supabase] ${where}:`, e.message)
}

/* ---------- pemuatan data ---------- */

async function loadPublic(sb: SupabaseClient) {
  const results = await Promise.all(
    COLLECTION_KEYS.map((k) => {
      const base = sb.from(TABLE[k]).select('*')
      const o = COLLECTIONS[k].order
      return o ? base.order(o.col, { ascending: o.asc }) : base
    }),
  )
  const out: Partial<DB> = {}
  const doctorProfiles: Record<string, string> = {}
  results.forEach((res, i) => {
    const k = COLLECTION_KEYS[i]
    if (res.error) return logErr(k, res.error)
    ;(out as any)[k] = (res.data ?? []).map(COLLECTIONS[k].from)
    if (k === 'doctors') for (const r of res.data ?? []) if (r.profile_id) doctorProfiles[r.profile_id] = r.id
  })
  return { out, doctorProfiles }
}

async function loadPrivate(sb: SupabaseClient, profMap: Record<string, string>) {
  const [pr, ap, co, ms, ct] = await Promise.all([
    sb.from('profiles').select('*'),
    sb.from('appointments').select('*').order('appointment_date').order('appointment_time'),
    sb.from('consultations').select('*').order('consultation_date').order('consultation_time'),
    sb.from('consultation_messages').select('*').order('created_at'),
    sb.from('contact_messages').select('*').order('created_at', { ascending: false }),
  ])
  logErr('profiles', pr.error); logErr('appointments', ap.error); logErr('consultations', co.error)
  logErr('consultation_messages', ms.error); logErr('contact_messages', ct.error)

  const consultations = (co.data ?? []).map(toCons)
  const patientOf = new Map(consultations.map((c) => [c.id, c.patientId]))
  const messages: Message[] = (ms.data ?? []).map((r: Row) => ({
    id: r.id, consultationId: r.consultation_id, senderId: r.sender_id,
    senderRole: (patientOf.get(r.consultation_id) === r.sender_id ? 'patient' : 'doctor') as Role,
    text: r.body, createdAt: r.created_at,
  }))
  return {
    users: (pr.data ?? []).map((r: Row) => toUser(r, profMap)),
    appointments: (ap.data ?? []).map(toAppt),
    consultations,
    messages,
    contacts: (ct.data ?? []).map(toContact),
  }
}

async function loadBooked(sb: SupabaseClient): Promise<Booked[]> {
  const { data, error } = await sb.rpc('booked_slots')
  if (error) {
    console.warn('[supabase] booked_slots belum tersedia (jalankan patch_01.sql):', error.message)
    return []
  }
  return (data ?? []).map((r: Row) => ({ doctorId: r.doctor_id, date: r.slot_date, time: hm(r.slot_time) }))
}

const authMsg = (m?: string) => {
  if (!m) return 'Email atau kata sandi salah.'
  if (/invalid login credentials/i.test(m)) return 'Email atau kata sandi salah.'
  if (/email not confirmed/i.test(m)) return 'Email belum dikonfirmasi. Cek kotak masuk Anda.'
  return m
}

/* ---------- store ---------- */

interface Store extends DB {
  user: User | null
  login(email: string, password: string): Promise<Result<User>>
  register(d: { name: string; email: string; phone: string; password: string }): Promise<Result<User>>
  logout(): void
  requestReset(email: string): Promise<Result<{ token?: string }>>
  resetPassword(token: string, password: string): Promise<Result>
  updateProfile(patch: Partial<User>): Result
  changePassword(current: string, next: string): Promise<Result>

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
  saveDoctorWithAccount(doctor: DoctorInput, account?: { email: string; password: string }): Promise<Result>
  deleteDoctor(id: string): Result
  setUserActive(id: string, active: boolean): void
  addContact(d: { name: string; email: string; subject: string; message: string }): Promise<Result>
  resetDemo(): void
}

type DoctorInput = Doctor

const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  if (!supabase) {
    return (
      <div style={{ padding: 24, fontFamily: 'sans-serif' }}>
        <h2>Supabase belum dikonfigurasi</h2>
        <p>Isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di file .env, lalu restart npm run dev.</p>
      </div>
    )
  }
  return <RemoteStore sb={supabase}>{children}</RemoteStore>
}

function RemoteStore({ sb, children }: { sb: SupabaseClient; children: ReactNode }) {
  const [db, setDb] = useState<DB>(EMPTY)
  const ref = useRef(db)
  const [booked, setBooked] = useState<Booked[]>([])
  const [ready, setReady] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const sessionRef = useRef<string | null>(null)
  const profMap = useRef<Record<string, string>>({})

  const setSession = useCallback((id: string | null) => {
    sessionRef.current = id
    setSessionId(id)
  }, [])

  const merge = useCallback((patch: Partial<DB>) => {
    const next = { ...ref.current, ...patch }
    ref.current = next
    setDb(next)
  }, [])

  const refreshPublic = useCallback(async () => {
    const { out, doctorProfiles } = await loadPublic(sb)
    profMap.current = doctorProfiles
    merge(out)
  }, [sb, merge])

  const refreshPrivate = useCallback(async () => {
    if (!sessionRef.current) return
    const [priv, slots] = await Promise.all([loadPrivate(sb, profMap.current), loadBooked(sb)])
    if (!sessionRef.current) return // sudah logout selagi memuat
    merge(priv)
    setBooked(slots)
  }, [sb, merge])

  const clearPrivate = useCallback(() => {
    merge({ users: [], appointments: [], consultations: [], messages: [], contacts: [] })
    setBooked([])
  }, [merge])

  /** Jalankan permintaan di latar belakang, lalu muat ulang agar tampilan sama dengan database. */
  const sync = useCallback(
    (p: PromiseLike<{ error: { message: string } | null }>, scope: Scope = 'private') => {
      void Promise.resolve(p).then(async ({ error }) => {
        logErr('tulis', error)
        if (scope !== 'private') await refreshPublic()
        if (scope !== 'public') await refreshPrivate()
      })
    },
    [refreshPublic, refreshPrivate],
  )

  // Muat awal + pantau perubahan login (termasuk dari tab lain)
  useEffect(() => {
    let alive = true
    void (async () => {
      await refreshPublic()
      const { data } = await sb.auth.getSession()
      if (data.session) {
        setSession(data.session.user.id)
        await refreshPrivate()
      }
      if (alive) setReady(true)
    })()
    const { data: sub } = sb.auth.onAuthStateChange((event, session) => {
      // Ditunda agar tidak memanggil Supabase di dalam callback auth.
      setTimeout(() => {
        if (event === 'SIGNED_OUT') {
          setSession(null)
          clearPrivate()
        } else if (event === 'SIGNED_IN' && session && session.user.id !== sessionRef.current) {
          setSession(session.user.id)
          void refreshPrivate()
        }
      }, 0)
    })
    return () => {
      alive = false
      sub.subscription.unsubscribe()
    }
  }, [sb, refreshPublic, refreshPrivate, setSession, clearPrivate])

  // Realtime: janji, konsultasi, dan chat. Saat ada perubahan, data privat dimuat ulang.
  useEffect(() => {
    if (!sessionId) return
    let t: ReturnType<typeof setTimeout> | undefined
    const kick = () => {
      clearTimeout(t)
      t = setTimeout(() => void refreshPrivate(), 300)
    }
    const ch = sb.channel(`anaverse-live-${sessionId}`)
    for (const table of ['appointments', 'consultations', 'consultation_messages'])
      ch.on('postgres_changes', { event: '*', schema: 'public', table }, kick)
    ch.subscribe()
    const onVisible = () => {
      if (document.visibilityState === 'visible') kick()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearTimeout(t)
      document.removeEventListener('visibilitychange', onVisible)
      void sb.removeChannel(ch)
    }
  }, [sb, sessionId, refreshPrivate])

  const user = useMemo(() => db.users.find((u) => u.id === sessionId && u.active) ?? null, [db.users, sessionId])

  const api = useMemo<Store>(() => {
    const cur = () => ref.current
    const me = () => cur().users.find((u) => u.id === sessionRef.current) ?? null
    const requirePatient = () => {
      const u = me()
      return u && u.role === 'patient' && u.active ? u : null
    }

    const slotsFor: Store['slotsFor'] = (doctorId, date, kind) => {
      const d = cur()
      const wd = parseISO(date).getDay()
      const taken = new Set<string>([
        ...booked.filter((b) => b.doctorId === doctorId && b.date === date).map((b) => b.time),
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

    const patchLocal = <K extends 'appointments' | 'consultations' | 'users'>(key: K, id: string, patch: Row) =>
      merge({ [key]: (ref.current[key] as any[]).map((x) => (x.id === id ? { ...x, ...patch } : x)) } as Partial<DB>)

    return {
      ...db,
      user,
      slotsFor,

      async login(email, password) {
        const { data, error } = await sb.auth.signInWithPassword({ email: email.trim(), password })
        if (error || !data.user) return fail(authMsg(error?.message))
        const { data: prof } = await sb.from('profiles').select('*').eq('id', data.user.id).maybeSingle()
        if (!prof) {
          await sb.auth.signOut()
          return fail('Profil akun tidak ditemukan. Hubungi administrator.')
        }
        if (!prof.active) {
          await sb.auth.signOut()
          return fail('Akun Anda dinonaktifkan. Hubungi administrator rumah sakit.')
        }
        setSession(data.user.id)
        await refreshPrivate()
        const u = ref.current.users.find((x) => x.id === data.user!.id)
        return u ? { ok: true, data: u } : fail('Gagal memuat profil. Coba lagi.')
      },

      async register(f) {
        const { data, error } = await sb.auth.signUp({
          email: f.email.trim(),
          password: f.password,
          options: { data: { full_name: f.name.trim(), phone: f.phone.trim() } },
        })
        if (error) return fail(/already registered/i.test(error.message) ? 'Email sudah terdaftar. Silakan masuk.' : error.message)
        if (!data.user || data.user.identities?.length === 0) return fail('Email sudah terdaftar. Silakan masuk.')
        if (!data.session) return fail('Pendaftaran berhasil. Cek email Anda untuk konfirmasi, lalu masuk.')
        setSession(data.user.id)
        await refreshPrivate()
        const u = ref.current.users.find((x) => x.id === data.user!.id)
        return u ? { ok: true, data: u } : fail('Akun dibuat, tetapi profil gagal dimuat. Coba masuk kembali.')
      },

      logout() {
        setSession(null)
        clearPrivate()
        void sb.auth.signOut()
      },

      async requestReset(email) {
        await sb.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset-password` })
        return { ok: true, data: {} } // sengaja selalu berhasil agar email tidak bisa ditebak
      },

      async resetPassword(_token, password) {
        const { error } = await sb.auth.updateUser({ password })
        if (error) return fail('Tautan reset tidak valid atau sudah kedaluwarsa.')
        return { ok: true }
      },

      updateProfile(patch) {
        const u = me()
        if (!u) return fail('Sesi berakhir. Silakan masuk kembali.')
        if (patch.email && !isEmail(patch.email)) return fail('Format email tidak valid.')
        if (patch.email && patch.email.toLowerCase() !== u.email.toLowerCase())
          return fail('Mengubah email belum didukung. Hubungi administrator.')
        const { role: _r, id: _i, active: _a, email: _e, password: _p, ...safe } = patch
        patchLocal('users', u.id, safe)
        const row: Row = {}
        if ('name' in safe) row.full_name = safe.name
        if ('phone' in safe) row.phone = safe.phone
        if ('address' in safe) row.address = safe.address || null
        if ('birthDate' in safe) row.birth_date = safe.birthDate || null
        if ('gender' in safe) row.gender = safe.gender || null
        if (Object.keys(row).length) sync(sb.from('profiles').update(row).eq('id', u.id))
        return { ok: true }
      },

      async changePassword(current, next) {
        const u = me()
        if (!u) return fail('Sesi berakhir. Silakan masuk kembali.')
        const { error: e1 } = await sb.auth.signInWithPassword({ email: u.email, password: current })
        if (e1) return fail('Kata sandi saat ini salah.')
        const { error } = await sb.auth.updateUser({ password: next })
        if (error) return fail(error.message)
        return { ok: true }
      },

      async createAppointment(f) {
        const u = requirePatient()
        if (!u) return fail('Hanya akun pasien yang dapat membuat janji temu.')
        const slot = slotsFor(f.doctorId, f.date, 'offline').find((s) => s.time === f.time)
        if (!slot) return fail('Jadwal tersebut tidak tersedia untuk dokter ini.')
        if (!slot.available) return fail('Maaf, jam ini baru saja dipesan. Silakan pilih jam lain.')
        const { data, error } = await sb
          .from('appointments')
          .insert({
            reference: refNumber('ANV'), patient_id: u.id, doctor_id: f.doctorId, appointment_date: f.date, appointment_time: f.time,
            complaint: f.complaint.trim(), notes: f.notes?.trim() || null, payer: f.payer, status: 'Menunggu Konfirmasi',
          })
          .select()
          .single()
        if (error || !data) {
          logErr('buat janji', error)
          return fail(error?.code === '23505' ? 'Maaf, jam ini baru saja dipesan. Silakan pilih jam lain.' : 'Gagal membuat janji temu. Coba lagi.')
        }
        const a = toAppt(data)
        merge({ appointments: [...ref.current.appointments, a] })
        void refreshPrivate()
        return { ok: true, data: a }
      },

      setAppointmentStatus(id, status, reason) {
        const row: Row = { status }
        if (status === 'Dibatalkan' && reason) row.cancel_reason = reason
        patchLocal('appointments', id, { status, ...(row.cancel_reason ? { cancelReason: reason } : {}) })
        sync(sb.from('appointments').update(row).eq('id', id))
        return { ok: true }
      },

      cancelAppointment(id) {
        const u = me()
        const a = cur().appointments.find((x) => x.id === id)
        if (!a || !u || a.patientId !== u.id) return fail('Janji temu tidak ditemukan.')
        const p = cancelPolicy(a)
        if (!p.ok) return fail(p.reason!)
        patchLocal('appointments', id, { status: 'Dibatalkan', cancelReason: 'Dibatalkan oleh pasien' })
        sync(sb.from('appointments').update({ status: 'Dibatalkan', cancel_reason: 'Dibatalkan oleh pasien' }).eq('id', id))
        return { ok: true }
      },

      async createConsultation(f) {
        const u = requirePatient()
        if (!u) return fail('Hanya akun pasien yang dapat membuat konsultasi.')
        const slot = slotsFor(f.doctorId, f.date, 'online').find((s) => s.time === f.time)
        if (!slot) return fail('Jadwal tersebut tidak tersedia untuk dokter ini.')
        if (!slot.available) return fail('Maaf, jam ini baru saja dipesan. Silakan pilih jam lain.')
        const { data, error } = await sb
          .from('consultations')
          .insert({
            reference: refNumber('KON'), patient_id: u.id, doctor_id: f.doctorId, consultation_date: f.date, consultation_time: f.time,
            complaint: f.complaint.trim(), channel: 'chat', status: 'Menunggu',
          })
          .select()
          .single()
        if (error || !data) {
          logErr('buat konsultasi', error)
          return fail(error?.code === '23505' ? 'Maaf, jam ini baru saja dipesan. Silakan pilih jam lain.' : 'Gagal membuat konsultasi. Coba lagi.')
        }
        const c = toCons(data)
        merge({ consultations: [...ref.current.consultations, c] })
        void refreshPrivate()
        return { ok: true, data: c }
      },

      setConsultationStatus(id, status, extra) {
        const row: Row = { status }
        if (extra?.summary !== undefined) row.summary = extra.summary
        if (status === 'Dibatalkan' && extra?.reason) row.cancel_reason = extra.reason
        patchLocal('consultations', id, {
          status,
          ...(extra?.summary !== undefined ? { summary: extra.summary } : {}),
          ...(status === 'Dibatalkan' && extra?.reason ? { cancelReason: extra.reason } : {}),
        })
        sync(sb.from('consultations').update(row).eq('id', id))
        return { ok: true }
      },

      cancelConsultation(id) {
        const u = me()
        const c = cur().consultations.find((x) => x.id === id)
        if (!c || !u || c.patientId !== u.id) return fail('Konsultasi tidak ditemukan.')
        const p = cancelPolicy(c)
        if (!p.ok) return fail(p.reason!)
        patchLocal('consultations', id, { status: 'Dibatalkan', cancelReason: 'Dibatalkan oleh pasien' })
        sync(sb.from('consultations').update({ status: 'Dibatalkan', cancel_reason: 'Dibatalkan oleh pasien' }).eq('id', id))
        return { ok: true }
      },

      sendMessage(consultationId, text) {
        const u = me()
        const c = cur().consultations.find((x) => x.id === consultationId)
        if (!u || !c) return fail('Konsultasi tidak ditemukan.')
        const allowed = (u.role === 'patient' && c.patientId === u.id) || (u.role === 'doctor' && c.doctorId === u.doctorId)
        if (!allowed) return fail('Anda tidak memiliki akses ke konsultasi ini.')
        if (c.status !== 'Aktif') return fail('Sesi konsultasi belum aktif atau sudah berakhir.')
        const body = text.trim()
        if (!body) return fail('Pesan kosong.')
        const tmp: Message = { id: uid('m'), consultationId, senderId: u.id, senderRole: u.role as Role, text: body, createdAt: new Date().toISOString() }
        merge({ messages: [...ref.current.messages, tmp] })
        sync(sb.from('consultation_messages').insert({ consultation_id: consultationId, sender_id: u.id, body }))
        return { ok: true }
      },

      save(key, item) {
        const list = ref.current[key] as unknown as { id: string }[]
        const exists = list.some((x) => x.id === item.id)
        merge({ [key]: exists ? list.map((x) => (x.id === item.id ? item : x)) : [...list, item] } as Partial<DB>)
        const row = COLLECTIONS[key].to(item)
        if (key === 'faqs' && !isUuid(item.id)) row.position = ref.current.faqs.length
        const q = isUuid(item.id) ? sb.from(TABLE[key]).update(row).eq('id', item.id) : sb.from(TABLE[key]).insert(row)
        sync(q, 'public')
      },

      remove(key, id) {
        merge({ [key]: (ref.current[key] as unknown as { id: string }[]).filter((x) => x.id !== id) } as Partial<DB>)
        if (isUuid(id)) sync(sb.from(TABLE[key]).delete().eq('id', id), 'public')
      },

      async saveDoctorWithAccount(doctor, account) {
        const d0 = cur()
        const isNew = !d0.doctors.some((x) => x.id === doctor.id)

        if (!isNew) {
          const { error } = await sb.from('doctors').update(COLLECTIONS.doctors.to(doctor)).eq('id', doctor.id)
          if (error) return fail('Gagal menyimpan data dokter.')
          const pid = Object.entries(profMap.current).find(([, did]) => did === doctor.id)?.[0]
          if (pid) await sb.from('profiles').update({ full_name: doctor.name }).eq('id', pid)
          await Promise.all([refreshPublic(), refreshPrivate()])
          return { ok: true }
        }

        if (!account) return fail('Email dan kata sandi akun dokter wajib diisi.')
        if (!isEmail(account.email)) return fail('Format email tidak valid.')
        if (d0.users.some((u) => u.email.toLowerCase() === account.email.toLowerCase())) return fail('Email sudah terdaftar.')

        // Klien sementara tanpa sesi, agar sesi admin tidak tertimpa akun dokter yang baru dibuat.
        const tmp = createClient(import.meta.env.VITE_SUPABASE_URL as string, import.meta.env.VITE_SUPABASE_ANON_KEY as string, {
          auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: 'anaverse.tmp-signup' },
        })
        const { data, error } = await tmp.auth.signUp({
          email: account.email.trim(),
          password: account.password,
          options: { data: { full_name: doctor.name } },
        })
        if (error) return fail(error.message)
        if (!data.user || data.user.identities?.length === 0) return fail('Email sudah terdaftar.')
        const newId = data.user.id

        const r1 = await sb.from('doctors').insert({ ...COLLECTIONS.doctors.to(doctor), profile_id: newId })
        if (r1.error) {
          logErr('simpan dokter', r1.error)
          return fail('Akun dibuat, tetapi data dokter gagal disimpan.')
        }
        const r2 = await sb.from('profiles').update({ role: 'doctor', full_name: doctor.name }).eq('id', newId)
        if (r2.error) {
          logErr('atur peran', r2.error)
          return fail('Dokter tersimpan, tetapi peran akun gagal diatur. Atur lewat SQL Editor.')
        }
        await Promise.all([refreshPublic(), refreshPrivate()])
        return { ok: true }
      },

      deleteDoctor(id) {
        const d0 = cur()
        const busy =
          d0.appointments.some((a) => a.doctorId === id && (a.status === 'Menunggu Konfirmasi' || a.status === 'Dikonfirmasi')) ||
          d0.consultations.some((c) => c.doctorId === id && ['Menunggu', 'Dijadwalkan', 'Aktif'].includes(c.status))
        if (busy) return fail('Dokter masih memiliki janji atau konsultasi aktif. Selesaikan atau batalkan terlebih dahulu.')
        const hasHistory = d0.appointments.some((a) => a.doctorId === id) || d0.consultations.some((c) => c.doctorId === id)
        if (hasHistory) return fail('Dokter memiliki riwayat janji atau konsultasi sehingga tidak dapat dihapus. Nonaktifkan akunnya bila perlu.')
        const pid = Object.entries(profMap.current).find(([, did]) => did === id)?.[0]
        merge({ doctors: d0.doctors.filter((x) => x.id !== id), schedules: d0.schedules.filter((s) => s.doctorId !== id) })
        sync(sb.from('doctors').delete().eq('id', id), 'both')
        if (pid) sync(sb.from('profiles').update({ active: false }).eq('id', pid), 'private')
        return { ok: true }
      },

      setUserActive(id, active) {
        patchLocal('users', id, { active })
        sync(sb.from('profiles').update({ active }).eq('id', id))
      },

      async addContact(f) {
        const { error } = await sb.from('contact_messages').insert({ name: f.name, email: f.email, subject: f.subject, message: f.message })
        if (error) {
          logErr('kontak', error)
          return fail('Pesan gagal dikirim. Coba lagi.')
        }
        return { ok: true }
      },

      resetDemo() {
        // Tidak ada reset demo pada mode Supabase; hanya memuat ulang data dari database.
        void refreshPublic()
        void refreshPrivate()
      },
    }
  }, [db, user, booked, sb, merge, refreshPublic, refreshPrivate, setSession, clearPrivate, sync])

  if (!ready) return <div style={{ padding: 24, fontFamily: 'sans-serif' }}>Memuat data…</div>
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