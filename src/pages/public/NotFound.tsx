import { Link } from 'react-router-dom'
import { btn } from '../../components/ui'

export default function NotFound() {
  return (
    <div className="mx-auto grid max-w-xl place-items-center px-4 py-24 text-center">
      <p className="text-6xl font-extrabold text-royal">404</p>
      <h1 className="mt-3 text-2xl font-extrabold">Halaman tidak ditemukan</h1>
      <p className="mt-2 text-navy/60">Alamat yang Anda tuju tidak tersedia atau sudah dipindahkan.</p>
      <Link to="/" className={btn('primary', 'md', 'mt-6')}>Kembali ke Beranda</Link>
    </div>
  )
}
