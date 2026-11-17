export const HOSPITAL = {
  name: 'Rumah Sakit Anaverse',
  shortName: 'Anaverse',
  address: 'Jl. Sehat Sentosa No. 88, Jakarta Selatan 12345',
  phone: '(021) 1234 5678',
  phoneHref: 'tel:+622112345678',
  email: 'info@anaverse.example',
  hours: [
    { label: 'IGD', value: '24 jam, 7 hari' },
    { label: 'Poli Spesialis', value: 'Senin–Sabtu, 08.00–20.00' },
    { label: 'Farmasi', value: '24 jam' },
  ],
  // Ganti dengan akun resmi rumah sakit.
  socials: [
    { label: 'Instagram', href: 'https://instagram.com/' },
    { label: 'Facebook', href: 'https://facebook.com/' },
    { label: 'YouTube', href: 'https://youtube.com/' },
  ],
  vision: 'Menjadi rumah sakit pilihan keluarga Indonesia yang menghadirkan layanan aman, hangat, dan berbasis teknologi.',
  mission: [
    'Memberikan layanan medis bermutu dengan standar keselamatan pasien.',
    'Memadukan tenaga medis berpengalaman dengan teknologi modern.',
    'Memudahkan akses layanan melalui janji temu dan konsultasi digital.',
  ],
}

export const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(HOSPITAL.address)}`
