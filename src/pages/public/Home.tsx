import { useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight, CalendarDays, CheckCircle2, Clock, HeartPulse, History, Hospital, Mail, MapPin, MessageCircle, Phone, Quote, ShieldCheck,
  Star, Stethoscope, Users, Video, Wifi, Siren, Sparkles, ExternalLink,
} from 'lucide-react'
import { HOSPITAL, mapsUrl } from '../../data/hospital'
import { IMG } from '../../data/images'
import { useStore } from '../../lib/store'
import { useDocumentTitle } from '../../lib/hooks'
import { fmtDateShort, isEmail } from '../../lib/utils'
import { Accordion, btn, Button, Field, Img, Input, SectionHeading, Stars, Textarea } from '../../components/ui'
import { Icon } from '../../components/Icon'
import { Carousel, Slide } from '../../components/Carousel'
import DoctorCard from '../../components/DoctorCard'
import { useToast } from '../../components/toast'

const Reveal = ({ children, className }: { children: ReactNode; className?: string }) => (
  <motion.div className={className} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.5 }}>
    {children}
  </motion.div>
)

function Hero() {
  const stats = [
    { icon: Users, value: '15+', label: 'Dokter Spesialis' },
    { icon: HeartPulse, value: '25.000+', label: 'Pasien Terlayani' },
    { icon: Hospital, value: '120+', label: 'Kamar Perawatan' },
    { icon: Star, value: '98%', label: 'Kepuasan Pasien' },
  ]
  return (
    <section className="relative bg-gradient-to-b from-soft/70 via-white to-white">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-24 pt-10 sm:px-6 lg:grid-cols-2 lg:pt-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <span className="inline-flex items-center gap-2 rounded-full bg-soft px-4 py-1.5 text-sm font-semibold text-royal"><HeartPulse className="h-4 w-4" />Kesehatan Anda, Prioritas Kami</span>
          <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl">
            Pelayanan Terbaik untuk <span className="text-royal">Kesehatan</span> Anda dan Keluarga
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-navy/70">
            Kami hadir dengan layanan medis berkualitas, dokter berpengalaman, dan fasilitas modern untuk memberikan perawatan terbaik.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/#layanan" className={btn('primary', 'lg')}>Lihat Layanan <ArrowRight className="h-4 w-4" /></Link>
            <Link to="/pasien/janji-temu/baru" className={btn('outline', 'lg')}>Buat Janji Temu <CalendarDays className="h-4 w-4" /></Link>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7 }} className="relative">
          <div className="absolute -inset-4 -z-10 rounded-[3rem] bg-gradient-to-br from-royal/15 to-transparent" />
          <Img src={IMG.hero} alt="Dokter ramah menyapa pasien anak di ruang perawatan" className="aspect-[5/4] w-full rounded-[2.5rem] shadow-pop" />
        </motion.div>
      </div>
      <div className="mx-auto -mt-12 max-w-5xl px-4 sm:px-6">
        <dl className="grid grid-cols-2 gap-4 rounded-3xl border border-royal/10 bg-white p-5 shadow-pop md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="flex items-center gap-3">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-soft text-royal"><s.icon className="h-5 w-5" /></span>
              <div><dd className="text-xl font-extrabold leading-none">{s.value}</dd><dt className="mt-1 text-xs text-navy/60">{s.label}</dt></div>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

function About() {
  const points = [
    { icon: Clock, t: 'Pelayanan 24 Jam' }, { icon: Stethoscope, t: 'Tenaga Medis Profesional' },
    { icon: Hospital, t: 'Fasilitas Modern' }, { icon: ShieldCheck, t: 'Perawatan Berkualitas' },
  ]
  return (
    <section id="tentang" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <Reveal><Img src={IMG.building} alt="Gedung Rumah Sakit Anaverse" className="aspect-[4/3] w-full rounded-[2.5rem] shadow-pop" /></Reveal>
        <Reveal>
          <span className="mb-3 inline-block rounded-full bg-soft px-3 py-1 text-xs font-semibold text-royal">Tentang Kami</span>
          <h2 className="text-3xl font-extrabold tracking-tight">Rumah Sakit <span className="text-royal">Anaverse</span> untuk Hidup yang Lebih Sehat</h2>
          <p className="mt-4 leading-relaxed text-navy/70">Rumah Sakit Anaverse berkomitmen memberikan pelayanan kesehatan profesional dengan teknologi modern dan lingkungan yang nyaman bagi pasien.</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-mist p-4"><h3 className="mb-1 font-bold">Visi</h3><p className="text-sm text-navy/70">{HOSPITAL.vision}</p></div>
            <div className="rounded-2xl bg-mist p-4"><h3 className="mb-1 font-bold">Misi</h3>
              <ul className="space-y-1 text-sm text-navy/70">{HOSPITAL.mission.map((m) => <li key={m} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-royal" />{m}</li>)}</ul>
            </div>
          </div>
          <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {points.map((p) => (
              <li key={p.t} className="flex flex-col items-center gap-2 text-center text-xs font-semibold">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-soft text-royal"><p.icon className="h-5 w-5" /></span>{p.t}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  )
}

function Services() {
  const { services } = useStore()
  return (
    <section id="layanan" className="bg-mist py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading title="Layanan Kami" action={<span className="text-sm text-navy/60">Pilih layanan untuk melihat detailnya</span>} />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {services.map((s) => (
            <Link key={s.id} to={`/layanan/${s.slug}`} className="group overflow-hidden rounded-3xl border border-royal/10 bg-white shadow-card transition hover:-translate-y-1 hover:shadow-pop">
              <div className="overflow-hidden"><Img src={s.image} alt={s.name} className="aspect-[4/3] w-full transition duration-500 group-hover:scale-105" /></div>
              <div className="relative px-3 pb-5 pt-7 text-center">
                <span className="absolute -top-5 left-1/2 grid h-10 w-10 -translate-x-1/2 place-items-center rounded-full border border-royal/10 bg-white text-royal shadow-card"><Icon name={s.icon} className="h-5 w-5" /></span>
                <p className="text-sm font-bold">{s.name}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

function FeaturedDoctors() {
  const { doctors } = useStore()
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <div className="grid gap-8 lg:grid-cols-[18rem_1fr]">
        <div>
          <span className="mb-3 inline-block rounded-full bg-soft px-3 py-1 text-xs font-semibold text-royal">Dokter Kami</span>
          <h2 className="text-3xl font-extrabold tracking-tight">Dokter Spesialis Berpengalaman</h2>
          <p className="mt-3 text-navy/70">Tim dokter kami siap memberikan perawatan terbaik untuk Anda dan keluarga.</p>
          <Link to="/dokter" className={btn('primary', 'md', 'mt-6')}>Lihat Semua Dokter <ArrowRight className="h-4 w-4" /></Link>
        </div>
        <div className="min-w-0">
          <Carousel label="Dokter unggulan">
            {doctors.map((d) => <Slide key={d.id} className="w-64"><DoctorCard doctor={d} /></Slide>)}
          </Carousel>
        </div>
      </div>
    </section>
  )
}

function OnlinePromo() {
  const feats = [
    { icon: Wifi, t: 'Konsultasi dari mana saja' }, { icon: Stethoscope, t: 'Pilih dokter yang tersedia' },
    { icon: CalendarDays, t: 'Jadwalkan konsultasi' }, { icon: MessageCircle, t: 'Sesi konsultasi online' },
    { icon: History, t: 'Lihat riwayat konsultasi' },
  ]
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6">
      <div className="grid overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-royal to-royal-700 text-white shadow-pop lg:grid-cols-2">
        <div className="p-8 sm:p-12">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold"><Video className="h-4 w-4" />Konsultasi Online</span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">Konsultasi Dokter Kini Lebih Mudah</h2>
          <p className="mt-3 max-w-md text-white/80">Dapatkan konsultasi kesehatan bersama dokter profesional tanpa harus datang langsung ke rumah sakit.</p>
          <ul className="mt-6 space-y-3">{feats.map((f) => <li key={f.t} className="flex items-center gap-3 text-sm font-medium"><span className="grid h-8 w-8 place-items-center rounded-full bg-white/15"><f.icon className="h-4 w-4" /></span>{f.t}</li>)}</ul>
          <Link to="/pasien/konsultasi" className={btn('white', 'lg', 'mt-8')}>Mulai Konsultasi <ArrowRight className="h-4 w-4" /></Link>
        </div>
        <div className="relative min-h-64"><Img src={IMG.consult} alt="Pasien berkonsultasi dengan dokter secara daring" className="absolute inset-0 h-full w-full opacity-90" /></div>
      </div>
    </section>
  )
}

function Facilities() {
  const { facilities } = useStore()
  return (
    <section id="fasilitas" className="mt-20 bg-navy py-16 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-8 max-w-xl"><h2 className="text-3xl font-extrabold tracking-tight">Fasilitas Modern untuk Perawatan Terbaik</h2><p className="mt-2 text-white/70">Lingkungan nyaman dan peralatan canggih untuk mendukung kesembuhan pasien.</p></div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {facilities.map((f) => (
            <figure key={f.id} className="group relative overflow-hidden rounded-3xl border border-white/20">
              <Img src={f.image} alt={f.name} className="aspect-[4/5] w-full transition duration-500 group-hover:scale-110" />
              <figcaption className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-navy/90 via-navy/20 to-transparent p-4">
                <p className="font-bold">{f.name}</p>
                <p className="max-h-0 overflow-hidden text-xs text-white/80 opacity-0 transition-all duration-300 group-hover:mt-1 group-hover:max-h-20 group-hover:opacity-100">{f.description}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}

function Testimonials() {
  const { testimonials } = useStore()
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <SectionHeading title="Apa Kata Pasien Kami?" />
      <Carousel label="Testimoni pasien">
        {testimonials.map((t) => (
          <Slide key={t.id} className="w-80">
            <figure className="flex h-full flex-col rounded-3xl border border-royal/10 bg-white p-6 shadow-card">
              <Quote className="mb-3 h-6 w-6 text-royal/30" aria-hidden="true" />
              <blockquote className="flex-1 text-sm leading-relaxed text-navy/80">{t.text}</blockquote>
              <figcaption className="mt-5 flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-soft font-bold text-royal" aria-hidden="true">{t.name[0]}</span>
                <span className="text-sm"><b className="block">{t.name}</b><span className="text-xs text-navy/50">{t.service}</span></span>
                <span className="ml-auto"><Stars value={t.rating} /></span>
              </figcaption>
            </figure>
          </Slide>
        ))}
      </Carousel>
    </section>
  )
}

function Articles() {
  const { articles } = useStore()
  return (
    <section className="bg-mist py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading title="Berita & Tips Kesehatan" action={<Link to="/artikel" className="inline-flex items-center gap-1 text-sm font-semibold text-royal">Lihat Semua Berita <ArrowRight className="h-4 w-4" /></Link>} />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[...articles].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4).map((a) => (
            <article key={a.id} className="group flex flex-col overflow-hidden rounded-3xl border border-royal/10 bg-white shadow-card transition hover:-translate-y-1 hover:shadow-pop">
              <div className="overflow-hidden"><Img src={a.image} alt={a.title} className="aspect-[16/10] w-full transition duration-500 group-hover:scale-105" /></div>
              <div className="flex flex-1 flex-col p-5">
                <span className="mb-2 w-fit rounded-full bg-soft px-2.5 py-1 text-xs font-semibold text-royal">{a.category}</span>
                <h3 className="font-bold leading-snug">{a.title}</h3>
                <p className="mt-2 text-sm text-navy/60">{a.excerpt}</p>
                <div className="mt-auto flex items-center justify-between pt-4 text-xs text-navy/50">
                  <time dateTime={a.date}>{fmtDateShort(a.date)}</time>
                  <Link to={`/artikel/${a.slug}`} className="inline-flex items-center gap-1 font-semibold text-royal">Baca <ArrowRight className="h-3 w-3" /></Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function Faq() {
  const { faqs } = useStore()
  return (
    <section id="faq" className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
      <div className="mb-8 text-center"><h2 className="text-3xl font-extrabold tracking-tight">Pertanyaan yang Sering Diajukan</h2><p className="mt-2 text-navy/60">Tidak menemukan jawabannya? Hubungi kami melalui formulir di bawah.</p></div>
      <Accordion items={faqs} />
    </section>
  )
}

function Contact() {
  const { addContact, user } = useStore()
  const toast = useToast()
  const [f, setF] = useState({ name: user?.name ?? '', email: user?.email ?? '', subject: '', message: '' })
  const [err, setErr] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const n: Record<string, string> = {}
    if (f.name.trim().length < 3) n.name = 'Nama minimal 3 karakter.'
    if (!isEmail(f.email)) n.email = 'Masukkan email yang valid.'
    if (!f.subject.trim()) n.subject = 'Subjek wajib diisi.'
    if (f.message.trim().length < 10) n.message = 'Pesan minimal 10 karakter.'
    setErr(n)
    if (Object.keys(n).length) return
    setBusy(true)
    await addContact(f)
    setBusy(false)
    setF({ ...f, subject: '', message: '' })
    toast.success('Pesan tersimpan di kotak masuk admin. (Prototipe: belum dikirim lewat email.)')
  }

  return (
    <section id="kontak" className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <SectionHeading eyebrow="Kontak" title="Hubungi dan Kunjungi Kami" />
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { icon: MapPin, t: 'Alamat', v: HOSPITAL.address },
              { icon: Phone, t: 'Telepon', v: HOSPITAL.phone, href: HOSPITAL.phoneHref },
              { icon: Mail, t: 'Email', v: HOSPITAL.email, href: `mailto:${HOSPITAL.email}` },
              { icon: Clock, t: 'Jam Operasional', v: HOSPITAL.hours.map((h) => `${h.label}: ${h.value}`).join('\n') },
            ].map((c) => (
              <div key={c.t} className="rounded-2xl border border-royal/10 bg-white p-4 shadow-card">
                <span className="mb-2 grid h-9 w-9 place-items-center rounded-full bg-soft text-royal"><c.icon className="h-4 w-4" /></span>
                <p className="text-sm font-bold">{c.t}</p>
                {c.href ? <a className="whitespace-pre-line text-sm text-navy/70 hover:text-royal" href={c.href}>{c.v}</a> : <p className="whitespace-pre-line text-sm text-navy/70">{c.v}</p>}
              </div>
            ))}
          </div>
          <div className="grid place-items-center rounded-3xl border border-dashed border-royal/30 bg-gradient-to-br from-soft to-white p-8 text-center">
            <MapPin className="mb-2 h-8 w-8 text-royal" />
            <p className="font-bold">Lokasi Rumah Sakit</p>
            <p className="mb-4 text-sm text-navy/60">{HOSPITAL.address}</p>
            <a href={mapsUrl} target="_blank" rel="noreferrer" className={btn('outline', 'sm')}>Buka di Google Maps <ExternalLink className="h-4 w-4" /></a>
          </div>
        </div>
        <form onSubmit={submit} noValidate className="space-y-4 rounded-3xl border border-royal/10 bg-white p-6 shadow-card">
          <h3 className="text-lg font-bold">Kirim Pesan</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nama" error={err.name}><Input value={f.name} onChange={set('name')} autoComplete="name" /></Field>
            <Field label="Email" error={err.email}><Input type="email" value={f.email} onChange={set('email')} autoComplete="email" /></Field>
          </div>
          <Field label="Subjek" error={err.subject}><Input value={f.subject} onChange={set('subject')} /></Field>
          <Field label="Pesan" error={err.message}><Textarea value={f.message} onChange={set('message')} /></Field>
          <Button type="submit" loading={busy} className="w-full">Kirim Pesan</Button>
          <p className="text-xs text-navy/50">Untuk keadaan darurat, jangan gunakan formulir ini — hubungi IGD.</p>
        </form>
      </div>
    </section>
  )
}

function FinalCta() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-6 rounded-[2.5rem] bg-gradient-to-r from-royal-700 to-royal p-8 text-white shadow-pop sm:p-12">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">Butuh Bantuan Medis?</h2>
          <p className="mt-2 text-white/80">Tim kami siap membantu kebutuhan kesehatan Anda.</p>
          <ul className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
            {[[Siren, 'IGD 24 Jam'], [Stethoscope, 'Tenaga Medis Profesional'], [Sparkles, 'Fasilitas Lengkap']].map(([I, t]) => {
              const C = I as typeof Siren
              return <li key={t as string} className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5"><C className="h-4 w-4" />{t as string}</li>
            })}
          </ul>
        </div>
        <div className="flex flex-wrap gap-3">
          <a href="#kontak" className={btn('white', 'lg')}>Hubungi Kami</a>
          <Link to="/pasien/janji-temu/baru" className={btn('outlineWhite', 'lg')}>Buat Janji Temu</Link>
        </div>
      </div>
    </section>
  )
}

export default function Home() {
  useDocumentTitle('Beranda')
  return (
    <>
      <Hero />
      <About />
      <Services />
      <FeaturedDoctors />
      <OnlinePromo />
      <Facilities />
      <Testimonials />
      <Articles />
      <Faq />
      <Contact />
      <FinalCta />
    </>
  )
}
