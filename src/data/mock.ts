import type { Appointment, Consultation, DB, Doctor, Message, Schedule, User } from '../types'
import { IMG } from './images'
import { addDays, parseISO, toISO } from '../lib/utils'

/* Semua konten di berkas ini adalah DATA CONTOH untuk prototipe. */

function dateFor(weekday: number, weeks: number): string {
  const t = new Date()
  t.setHours(0, 0, 0, 0)
  if (weeks >= 0) {
    let d = addDays(t, 1)
    while (d.getDay() !== weekday) d = addDays(d, 1)
    return toISO(addDays(d, 7 * weeks))
  }
  let d = addDays(t, -1)
  while (d.getDay() !== weekday) d = addDays(d, -1)
  return toISO(addDays(d, 7 * (weeks + 1)))
}
const daysAgoISO = (n: number) => addDays(new Date(), -n).toISOString()
const createdBefore = (date: string, days: number) => addDays(parseISO(date), -days).toISOString()

const specialties = [
  { id: 'sp-jantung', name: 'Jantung', icon: 'HeartPulse' },
  { id: 'sp-anak', name: 'Anak', icon: 'Baby' },
  { id: 'sp-bedah', name: 'Bedah', icon: 'Scissors' },
  { id: 'sp-dalam', name: 'Penyakit Dalam', icon: 'Stethoscope' },
  { id: 'sp-saraf', name: 'Saraf', icon: 'Brain' },
  { id: 'sp-kulit', name: 'Kulit & Kelamin', icon: 'Sparkles' },
]

const doctors: Doctor[] = [
  { id: 'd1', name: 'dr. Andika Pratama, Sp.JP', specialtyId: 'sp-jantung', experience: 12, rating: 4.9, photo: IMG.doctorM1, education: 'Spesialis Jantung dan Pembuluh Darah', bio: 'Berfokus pada pencegahan penyakit jantung, pemeriksaan EKG dan ekokardiografi, serta kontrol tekanan darah jangka panjang.' },
  { id: 'd2', name: 'dr. Salsabila Putri, Sp.A', specialtyId: 'sp-anak', experience: 9, rating: 4.9, photo: IMG.doctorF1, education: 'Spesialis Anak', bio: 'Menangani tumbuh kembang, imunisasi, dan keluhan umum anak dengan pendekatan yang ramah keluarga.' },
  { id: 'd3', name: 'dr. Budi Santoso, Sp.B', specialtyId: 'sp-bedah', experience: 15, rating: 4.8, photo: IMG.doctorM2, education: 'Spesialis Bedah Umum', bio: 'Berpengalaman dalam bedah umum dan bedah minor, termasuk evaluasi sebelum dan sesudah tindakan.' },
  { id: 'd4', name: 'dr. Meilani Putri, Sp.PD', specialtyId: 'sp-dalam', experience: 11, rating: 4.9, photo: IMG.doctorF2, education: 'Spesialis Penyakit Dalam', bio: 'Menangani diabetes, hipertensi, gangguan pencernaan, dan kontrol penyakit kronis.' },
  { id: 'd5', name: 'dr. Raka Aditya, Sp.S', specialtyId: 'sp-saraf', experience: 8, rating: 4.7, photo: IMG.doctorM3, education: 'Spesialis Saraf', bio: 'Menangani sakit kepala, gangguan tidur, saraf kejepit, dan pemulihan pascastroke.' },
  { id: 'd6', name: 'dr. Nadia Kusuma, Sp.KK', specialtyId: 'sp-kulit', experience: 7, rating: 4.8, photo: IMG.doctorF3, education: 'Spesialis Kulit dan Kelamin', bio: 'Menangani masalah kulit umum, alergi kulit, dan perawatan kulit medis.' },
]

const sched: Record<string, { off: number[]; offT: [string, string]; on: number[]; onT: [string, string] }> = {
  d1: { off: [1, 3, 5], offT: ['09:00', '12:00'], on: [2, 4], onT: ['19:00', '21:00'] },
  d2: { off: [1, 2, 4], offT: ['08:00', '11:00'], on: [3, 6], onT: ['10:00', '12:00'] },
  d3: { off: [2, 4, 6], offT: ['10:00', '13:00'], on: [1, 5], onT: ['19:00', '20:30'] },
  d4: { off: [1, 3, 5], offT: ['13:00', '16:00'], on: [2, 4], onT: ['20:00', '21:30'] },
  d5: { off: [2, 3, 5], offT: ['09:00', '12:00'], on: [1, 4], onT: ['19:30', '21:00'] },
  d6: { off: [1, 4, 6], offT: ['14:00', '17:00'], on: [3, 5], onT: ['19:00', '21:00'] },
}
const schedules: Schedule[] = Object.entries(sched).flatMap(([doctorId, c]) => [
  ...c.off.map((weekday) => ({ id: `s-${doctorId}-off-${weekday}`, doctorId, weekday, start: c.offT[0], end: c.offT[1], kind: 'offline' as const })),
  ...c.on.map((weekday) => ({ id: `s-${doctorId}-on-${weekday}`, doctorId, weekday, start: c.onT[0], end: c.onT[1], kind: 'online' as const })),
])

const DEMO_PASSWORD = 'Demo12345'
const mkUser = (u: Partial<User> & Pick<User, 'id' | 'name' | 'email' | 'role'>): User => ({
  phone: '081234567890', password: DEMO_PASSWORD, active: true, createdAt: daysAgoISO(200), gender: '', ...u,
})

const patientNames = ['Rina Wulandari', 'Bagas Hidayat', 'Siti Aminah', 'Yoga Permana', 'Dewi Lestari']
const patients: User[] = patientNames.map((name, i) =>
  mkUser({
    id: `p${i + 1}`,
    name,
    email: i === 0 ? 'pasien@anaverse.id' : `${name.split(' ')[0].toLowerCase()}@contoh.id`,
    role: 'patient',
    phone: `0812345678${10 + i}`,
    address: 'Jakarta',
    createdAt: daysAgoISO(160 - i * 30),
    settings: { reminders: true, newsletter: false },
  }),
)
const doctorUsers: User[] = doctors.map((d, i) =>
  mkUser({
    id: `u-${d.id}`,
    name: d.name,
    email: i === 0 ? 'dokter@anaverse.id' : `${d.name.replace(/^dr\.\s*/, '').split(',')[0].toLowerCase().replace(/\s+/g, '.')}@anaverse.id`,
    role: 'doctor',
    doctorId: d.id,
    createdAt: daysAgoISO(240),
  }),
)
const admin = mkUser({ id: 'u-admin', name: 'Admin Anaverse', email: 'admin@anaverse.id', role: 'admin', createdAt: daysAgoISO(300) })

type A = [string, string, number, number, string, Appointment['status'], string]
const apptSeed: A[] = [
  ['p1', 'd1', 1, 1, '09:00', 'Dikonfirmasi', 'Nyeri dada ringan saat berolahraga'],
  ['p1', 'd2', 2, -1, '08:30', 'Selesai', 'Imunisasi lanjutan anak'],
  ['p1', 'd4', 3, 2, '13:30', 'Menunggu Konfirmasi', 'Kontrol gula darah rutin'],
  ['p1', 'd6', 1, -2, '14:00', 'Dibatalkan', 'Ruam kulit yang gatal'],
  ['p2', 'd1', 1, 1, '09:30', 'Menunggu Konfirmasi', 'Kontrol tekanan darah'],
  ['p3', 'd1', 3, 1, '10:00', 'Dikonfirmasi', 'Berdebar saat malam hari'],
  ['p4', 'd3', 2, -1, '10:30', 'Selesai', 'Kontrol pascatindakan'],
  ['p5', 'd2', 1, 1, '08:00', 'Menunggu Konfirmasi', 'Demam berulang pada anak'],
  ['p2', 'd4', 5, -3, '14:00', 'Selesai', 'Nyeri ulu hati'],
  ['p3', 'd5', 2, 1, '09:00', 'Dikonfirmasi', 'Sakit kepala berkepanjangan'],
]
const appointments: Appointment[] = apptSeed.map(([patientId, doctorId, wd, w, time, status, complaint], i) => {
  const date = dateFor(wd, w)
  return { id: `a${i + 1}`, ref: `ANV-SEED-A${String(i + 1).padStart(2, '0')}`, patientId, doctorId, date, time, complaint, payer: i % 3 === 1 ? 'BPJS' : 'Umum', status, createdAt: createdBefore(date, 4 + i), cancelReason: status === 'Dibatalkan' ? 'Dibatalkan oleh pasien' : undefined }
})

const today = toISO(new Date())
type C = [string, string, string, string, Consultation['status'], string, string?]
const consSeed: C[] = [
  ['p1', 'd1', today, '19:00', 'Aktif', 'Konsultasi hasil cek tekanan darah di rumah'],
  ['p1', 'd4', dateFor(2, -1), '20:00', 'Selesai', 'Pertanyaan pola makan untuk diabetes', 'Dianjurkan mengatur pola makan, aktivitas ringan rutin, dan kontrol gula darah terjadwal.'],
  ['p2', 'd1', dateFor(4, 1), '19:00', 'Menunggu', 'Sering pusing saat bangun tidur'],
  ['p3', 'd2', dateFor(3, 1), '10:00', 'Dijadwalkan', 'Konsultasi alergi makanan pada anak'],
  ['p4', 'd6', dateFor(5, -2), '19:30', 'Selesai', 'Jerawat meradang', 'Disarankan rutin membersihkan wajah dan kontrol bila tidak membaik.'],
  ['p5', 'd1', dateFor(2, -3), '19:30', 'Selesai', 'Konsultasi hasil EKG', 'Hasil dibahas; kontrol rutin sesuai jadwal.'],
]
const consultations: Consultation[] = consSeed.map(([patientId, doctorId, date, time, status, complaint, summary], i) => ({
  id: `c${i + 1}`, ref: `ANV-SEED-C${String(i + 1).padStart(2, '0')}`, patientId, doctorId, date, time, complaint, channel: 'chat', status, summary, createdAt: createdBefore(date, 2 + i),
}))

const at = (min: number) => new Date(Date.now() - min * 60000).toISOString()
const messages: Message[] = [
  { id: 'm1', consultationId: 'c1', senderId: 'u-d1', senderRole: 'doctor', text: 'Selamat malam, saya dr. Andika. Silakan ceritakan hasil pengukuran tekanan darah Anda.', createdAt: at(12) },
  { id: 'm2', consultationId: 'c1', senderId: 'p1', senderRole: 'patient', text: 'Malam dok. Tiga hari terakhir hasilnya sekitar 135/88 pagi hari.', createdAt: at(10) },
  { id: 'm3', consultationId: 'c1', senderId: 'u-d1', senderRole: 'doctor', text: 'Baik. Apakah ada keluhan seperti pusing atau berdebar? Dan apakah sedang rutin minum obat?', createdAt: at(8) },
]

const services = [
  { id: 'sv1', slug: 'poli-spesialis', name: 'Poli Spesialis', icon: 'Stethoscope', image: IMG.poli, summary: 'Pemeriksaan oleh dokter spesialis dengan jadwal praktik yang jelas.', description: 'Poli Spesialis melayani konsultasi dan pemeriksaan lanjutan di berbagai bidang, mulai dari jantung, anak, bedah, penyakit dalam, saraf, hingga kulit. Anda dapat memilih dokter dan jadwal langsung dari situs ini.', features: ['Jadwal praktik tersedia online', 'Janji temu tanpa antre panjang', 'Rekam riwayat kunjungan', 'Rujukan ke layanan penunjang'], hours: 'Senin–Sabtu, 08.00–20.00' },
  { id: 'sv2', slug: 'rawat-inap', name: 'Rawat Inap', icon: 'BedDouble', image: IMG.inpatient, summary: 'Kamar perawatan nyaman dengan pemantauan perawat setiap hari.', description: 'Tersedia kamar kelas standar hingga VIP dengan fasilitas penunjang kenyamanan pasien dan pendamping. Perawat dan dokter penanggung jawab memantau perkembangan pasien secara berkala.', features: ['Pilihan kelas kamar', 'Pemantauan perawat 24 jam', 'Ruang tunggu keluarga', 'Gizi sesuai kebutuhan pasien'], hours: 'Setiap hari, 24 jam' },
  { id: 'sv3', slug: 'igd-24-jam', name: 'IGD 24 Jam', icon: 'Siren', image: IMG.igd, summary: 'Penanganan gawat darurat sepanjang hari bersama tim siaga.', description: 'Instalasi Gawat Darurat siaga 24 jam dengan tim dokter dan perawat terlatih. Dalam keadaan darurat, langsung datang ke IGD atau hubungi ambulans kami.', features: ['Siaga 24 jam, 7 hari', 'Ambulans', 'Triase cepat', 'Terhubung dengan ICU dan ruang operasi'], hours: 'Setiap hari, 24 jam' },
  { id: 'sv4', slug: 'radiologi', name: 'Radiologi', icon: 'ScanLine', image: IMG.radiology, summary: 'Pemeriksaan pencitraan untuk membantu diagnosis dokter.', description: 'Layanan pencitraan medis seperti rontgen, USG, dan CT scan dilakukan oleh radiografer berpengalaman dan dibaca oleh dokter spesialis radiologi.', features: ['Rontgen', 'USG', 'CT scan', 'Hasil dibaca dokter spesialis'], hours: 'Senin–Sabtu, 07.00–21.00' },
  { id: 'sv5', slug: 'laboratorium', name: 'Laboratorium', icon: 'FlaskConical', image: IMG.lab, summary: 'Pemeriksaan laboratorium klinik yang cepat dan akurat.', description: 'Laboratorium klinik melayani pemeriksaan darah, urin, dan pemeriksaan penunjang lainnya dengan alat otomatis dan prosedur kendali mutu.', features: ['Cek darah lengkap', 'Gula darah dan kolesterol', 'Pemeriksaan urin', 'Hasil dapat diambil atau diantar sesuai kebijakan'], hours: 'Setiap hari, 06.00–22.00' },
  { id: 'sv6', slug: 'farmasi', name: 'Farmasi', icon: 'Pill', image: IMG.pharmacy, summary: 'Obat sesuai resep dengan konseling apoteker.', description: 'Instalasi farmasi menyediakan obat sesuai resep dokter dan memberikan penjelasan aturan pakai oleh apoteker.', features: ['Obat sesuai resep', 'Konseling apoteker', 'Layanan 24 jam', 'Pengecekan interaksi obat'], hours: 'Setiap hari, 24 jam' },
]

const facilities = [
  { id: 'f1', name: 'Ruang ICU', image: IMG.icu, description: 'Unit perawatan intensif dengan pemantauan pasien kritis.' },
  { id: 'f2', name: 'Kamar VIP', image: IMG.vip, description: 'Kamar privat dengan area pendamping yang nyaman.' },
  { id: 'f3', name: 'Ruang Operasi', image: IMG.or, description: 'Kamar operasi modern dengan standar sterilisasi ketat.' },
  { id: 'f4', name: 'Laboratorium', image: IMG.lab, description: 'Laboratorium klinik dengan peralatan otomatis.' },
  { id: 'f5', name: 'Ambulans 24 Jam', image: IMG.ambulance, description: 'Armada ambulans siaga untuk transportasi pasien.' },
]

const articles = [
  { id: 'ar1', slug: 'tips-menjaga-kesehatan-jantung-setiap-hari', title: 'Tips Menjaga Kesehatan Jantung Setiap Hari', category: 'Kesehatan Jantung', excerpt: 'Kebiasaan sederhana yang membantu menjaga jantung tetap sehat.', image: IMG.heart, date: '2026-05-20', content: 'Jantung bekerja tanpa henti, sehingga kebiasaan harian sangat berpengaruh pada kesehatannya.\n\nAktif bergerak secara teratur, memilih makanan yang kaya sayur dan buah, mengurangi garam, serta tidak merokok adalah langkah dasar yang direkomendasikan banyak panduan kesehatan.\n\nPeriksakan tekanan darah dan kolesterol secara berkala. Bila Anda mengalami nyeri dada, sesak napas, atau berdebar yang tidak biasa, segera periksakan diri ke dokter atau IGD.' },
  { id: 'ar2', slug: 'pentingnya-imunisasi-untuk-anak-sejak-dini', title: 'Pentingnya Imunisasi untuk Anak Sejak Dini', category: 'Anak', excerpt: 'Imunisasi melindungi anak dari penyakit yang dapat dicegah.', image: IMG.kids, date: '2026-05-18', content: 'Imunisasi membantu tubuh anak mengenali dan melawan penyakit tertentu sebelum terpapar.\n\nJadwal imunisasi mengikuti usia anak. Catat jadwal di buku kesehatan dan konsultasikan dengan dokter anak bila ada jadwal yang terlewat.\n\nKeluhan ringan seperti demam rendah setelah imunisasi dapat terjadi. Hubungi dokter bila keluhan berat atau berlangsung lama.' },
  { id: 'ar3', slug: 'makanan-sehat-untuk-gaya-hidup-seimbang', title: 'Makanan Sehat untuk Gaya Hidup Seimbang', category: 'Gaya Hidup', excerpt: 'Panduan sederhana menyusun piring makan yang seimbang.', image: IMG.food, date: '2026-05-16', content: 'Piring makan seimbang berisi sayur, buah, sumber protein, dan karbohidrat kompleks dalam porsi yang wajar.\n\nBatasi gula tambahan dan makanan olahan tinggi garam. Minum air putih yang cukup sepanjang hari.\n\nBila Anda memiliki kondisi khusus seperti diabetes atau penyakit ginjal, konsultasikan kebutuhan gizi Anda dengan dokter.' },
  { id: 'ar4', slug: 'perawatan-terbaik-untuk-orang-tersayang', title: 'Perawatan Terbaik untuk Orang Tersayang', category: 'Lansia', excerpt: 'Hal penting dalam mendampingi kesehatan orang tua di rumah.', image: IMG.elderly, date: '2026-05-14', content: 'Lansia membutuhkan pemeriksaan rutin, aktivitas fisik ringan, dan lingkungan rumah yang aman dari risiko jatuh.\n\nPastikan obat diminum sesuai anjuran dokter dan catat perubahan kondisi harian.\n\nDampingi mereka dengan sabar; dukungan keluarga berperan besar dalam kesehatan fisik dan mental.' },
  { id: 'ar5', slug: 'olahraga-ringan-untuk-pemula', title: 'Olahraga Ringan untuk Pemula', category: 'Gaya Hidup', excerpt: 'Mulai bergerak tanpa membebani tubuh.', image: IMG.run, date: '2026-05-12', content: 'Mulailah dengan jalan kaki 15–30 menit beberapa kali seminggu, lalu tingkatkan bertahap.\n\nPemanasan dan pendinginan membantu mengurangi risiko cedera. Berhentilah bila terasa nyeri dada, pusing berat, atau sesak.\n\nBila Anda memiliki penyakit kronis, bicarakan jenis olahraga yang aman dengan dokter.' },
]

const testimonials = [
  { id: 't1', name: 'Rina W.', service: 'Poli Spesialis', rating: 5, text: 'Membuat janji lewat situs sangat mudah, dan jadwal dokter jelas. Tidak perlu antre lama.' },
  { id: 't2', name: 'Bagas H.', service: 'Konsultasi Online', rating: 5, text: 'Konsultasi malam hari lewat chat membantu sekali. Dokternya sabar menjelaskan.' },
  { id: 't3', name: 'Siti A.', service: 'Rawat Inap', rating: 4, text: 'Kamarnya bersih dan perawatnya ramah. Keluarga kami merasa tenang.' },
  { id: 't4', name: 'Yoga P.', service: 'Laboratorium', rating: 5, text: 'Pemeriksaan cepat dan hasilnya mudah dipahami.' },
  { id: 't5', name: 'Dewi L.', service: 'IGD 24 Jam', rating: 5, text: 'Penanganan cepat saat anak saya demam tinggi tengah malam. Terima kasih tim IGD.' },
]

const faqs = [
  { id: 'q1', q: 'Bagaimana cara membuat janji temu dengan dokter?', a: 'Masuk ke akun pasien, pilih menu Buat Janji Offline, lalu pilih spesialis, dokter, tanggal, dan jam. Setelah dikonfirmasi, Anda mendapat nomor referensi janji.' },
  { id: 'q2', q: 'Apakah saya bisa melakukan konsultasi secara online?', a: 'Bisa. Pilih menu Konsultasi Online, tentukan dokter dan jadwal. Setelah dokter menyetujui, sesi chat dibuka pada jadwalnya.' },
  { id: 'q3', q: 'Bagaimana cara membatalkan jadwal konsultasi?', a: 'Buka Riwayat Janji Temu lalu pilih Batalkan. Pembatalan dapat dilakukan paling lambat 24 jam sebelum jadwal.' },
  { id: 'q4', q: 'Apakah saya harus mendaftar sebelum menggunakan layanan?', a: 'Untuk membuat janji dan konsultasi online, Anda perlu mendaftar akun pasien agar data dan riwayat Anda aman. Informasi umum dapat dilihat tanpa akun.' },
  { id: 'q5', q: 'Bagaimana cara mengetahui jadwal dokter?', a: 'Buka halaman Dokter, lalu pilih profil dokter. Jadwal praktik offline dan online ditampilkan per hari.' },
  { id: 'q6', q: 'Apakah rumah sakit melayani pasien BPJS?', a: 'Pilih jenis pembayaran BPJS saat membuat janji. Ketentuan rujukan dan layanan yang ditanggung dapat berbeda; hubungi kami untuk memastikan sebelum datang.' },
  { id: 'q7', q: 'Bagaimana cara melihat riwayat konsultasi?', a: 'Buka menu Riwayat Konsultasi di portal pasien. Percakapan dan ringkasan dokter tersimpan di sana.' },
  { id: 'q8', q: 'Bagaimana cara menghubungi rumah sakit?', a: 'Hubungi telepon (021) 1234 5678, kirim email, atau gunakan formulir di bagian Kontak. Untuk keadaan darurat, langsung ke IGD.' },
]

export function seed(): DB {
  return {
    users: [admin, ...doctorUsers, ...patients],
    specialties,
    doctors,
    schedules,
    appointments,
    consultations,
    messages,
    services,
    facilities,
    articles,
    testimonials,
    faqs,
    contacts: [],
    resets: [],
    sessionUserId: null,
  }
}

export const DEMO_ACCOUNTS = [
  { label: 'Pasien', email: 'pasien@anaverse.id', password: DEMO_PASSWORD },
  { label: 'Dokter', email: 'dokter@anaverse.id', password: DEMO_PASSWORD },
  { label: 'Admin', email: 'admin@anaverse.id', password: DEMO_PASSWORD },
]
