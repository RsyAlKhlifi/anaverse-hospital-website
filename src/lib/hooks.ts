import { useEffect, useState } from 'react'

/** Menampilkan skeleton singkat saat halaman dibuka (meniru fetch; diganti loading query saat Supabase aktif). */
export function useLoading(ms = 450) {
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), ms)
    return () => clearTimeout(t)
  }, [ms])
  return loading
}

export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = `${title} · Rumah Sakit Anaverse`
  }, [title])
}
