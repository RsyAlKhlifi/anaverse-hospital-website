export type Role = 'patient' | 'doctor' | 'admin'

export interface User {
  id: string
  name: string
  email: string
  phone: string
  password: string // prototipe saja — di produksi dikelola Supabase Auth
  role: Role
  address?: string
  birthDate?: string
  gender?: 'Laki-laki' | 'Perempuan' | ''
  doctorId?: string
  active: boolean
  createdAt: string
  settings?: { reminders: boolean; newsletter: boolean }
}

export interface Specialty {
  id: string
  name: string
  icon: string
}

export interface Doctor {
  id: string
  name: string
  specialtyId: string
  experience: number
  rating: number
  photo: string
  bio: string
  education: string
}

export type ScheduleKind = 'offline' | 'online'

export interface Schedule {
  id: string
  doctorId: string
  weekday: number // 0 = Minggu
  start: string // HH:MM
  end: string
  kind: ScheduleKind
}

export type AppointmentStatus = 'Menunggu Konfirmasi' | 'Dikonfirmasi' | 'Selesai' | 'Dibatalkan'
export type Payer = 'Umum' | 'BPJS' | 'Asuransi'

export interface Appointment {
  id: string
  ref: string
  patientId: string
  doctorId: string
  date: string
  time: string
  complaint: string
  notes?: string
  payer: Payer
  status: AppointmentStatus
  cancelReason?: string
  createdAt: string
}

export type ConsultationStatus = 'Menunggu' | 'Dijadwalkan' | 'Aktif' | 'Selesai' | 'Dibatalkan'

export interface Consultation {
  id: string
  ref: string
  patientId: string
  doctorId: string
  date: string
  time: string
  complaint: string
  channel: 'chat' | 'video' // 'video' disiapkan untuk integrasi berikutnya
  status: ConsultationStatus
  summary?: string
  cancelReason?: string
  createdAt: string
}

export interface Message {
  id: string
  consultationId: string
  senderId: string
  senderRole: Role
  text: string
  createdAt: string
}

export interface Service {
  id: string
  slug: string
  name: string
  icon: string
  image: string
  summary: string
  description: string
  features: string[]
  hours: string
}

export interface Facility {
  id: string
  name: string
  image: string
  description: string
}

export interface Article {
  id: string
  slug: string
  title: string
  category: string
  excerpt: string
  content: string
  image: string
  date: string
}

export interface Testimonial {
  id: string
  name: string
  service: string
  rating: number
  text: string
}

export interface Faq {
  id: string
  q: string
  a: string
}

export interface ContactMessage {
  id: string
  name: string
  email: string
  subject: string
  message: string
  createdAt: string
}

export interface ResetToken {
  token: string
  email: string
  expires: number
}

export interface DB {
  users: User[]
  specialties: Specialty[]
  doctors: Doctor[]
  schedules: Schedule[]
  appointments: Appointment[]
  consultations: Consultation[]
  messages: Message[]
  services: Service[]
  facilities: Facility[]
  articles: Article[]
  testimonials: Testimonial[]
  faqs: Faq[]
  contacts: ContactMessage[]
  resets: ResetToken[]
  sessionUserId: string | null
}

export type CollectionKey =
  | 'specialties'
  | 'doctors'
  | 'schedules'
  | 'services'
  | 'facilities'
  | 'articles'
  | 'testimonials'
  | 'faqs'
