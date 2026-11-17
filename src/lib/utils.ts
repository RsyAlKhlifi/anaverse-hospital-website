export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')

export const uid = (p = 'id') => `${p}_${Math.random().toString(36).slice(2, 10)}`
export const pad = (n: number) => String(n).padStart(2, '0')

export const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const todayISO = () => toISO(new Date())
export const parseISO = (s: string) => new Date(`${s}T00:00:00`)
export const addDays = (d: Date, n: number) => {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

export const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
export const DAY_SHORT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

export const fmtDate = (s: string) =>
  new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(parseISO(s))
export const fmtDateShort = (s: string) =>
  new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(parseISO(s))
export const fmtTime = (iso: string) =>
  new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(iso)).replace('.', ':')
export const fmtDateTime = (iso: string) => `${fmtDateShort(iso.slice(0, 10))}, ${fmtTime(iso)}`

export const initials = (name: string) =>
  name
    .replace(/^dr\.?\s*/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')

export const refNumber = (prefix = 'ANV') =>
  `${prefix}-${todayISO().slice(2).replace(/-/g, '')}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`

export const hoursUntil = (date: string, time: string) =>
  (new Date(`${date}T${time}:00`).getTime() - Date.now()) / 36e5

const toMin = (t: string) => {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}
export const timeToMinutes = toMin
export const minutesToTime = (m: number) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`

export function generateSlots(start: string, end: string, step = 30): string[] {
  const out: string[] = []
  for (let m = toMin(start); m + step <= toMin(end); m += step) out.push(minutesToTime(m))
  return out
}

export const monthKey = (iso: string) => iso.slice(0, 7)
export const monthLabel = (key: string) =>
  new Intl.DateTimeFormat('id-ID', { month: 'short', year: '2-digit' }).format(new Date(`${key}-01T00:00:00`))

export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
export const isPhone = (v: string) => /^(\+62|62|0)8[1-9][0-9]{6,10}$/.test(v.replace(/[\s-]/g, ''))
export const passwordIssue = (v: string) =>
  v.length < 8 ? 'Kata sandi minimal 8 karakter.' : !/[A-Za-z]/.test(v) || !/\d/.test(v) ? 'Gunakan kombinasi huruf dan angka.' : ''

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
