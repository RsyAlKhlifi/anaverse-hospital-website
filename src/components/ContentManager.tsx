import { useState, type ReactNode } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import type { CollectionKey } from '../types'
import { useStore } from '../lib/store'
import { ICON_NAMES } from './Icon'
import { uid } from '../lib/utils'
import { Button, ConfirmDialog, EmptyState, Field, Input, Modal, Select, Textarea } from './ui'
import { useToast } from './toast'

export interface FieldDef {
  key: string
  label: string
  type: 'text' | 'textarea' | 'number' | 'select' | 'lines' | 'date' | 'icon' | 'url'
  options?: { value: string; label: string }[]
  required?: boolean
  min?: number
  max?: number
  hint?: string
}

type Row = Record<string, any>

const slugify = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

/** Pengelola konten generik (tambah / ubah / hapus) berbasis definisi kolom. */
export default function ContentManager({ collection, items, fields, noun, render, defaults, slugFrom }: {
  collection: CollectionKey
  items: Row[]
  fields: FieldDef[]
  noun: string
  render: (item: Row) => ReactNode
  defaults?: Row
  slugFrom?: string
}) {
  const { save, remove } = useStore()
  const toast = useToast()
  const [editing, setEditing] = useState<Row | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [draft, setDraft] = useState<Record<string, string>>({})
  const [err, setErr] = useState<Record<string, string>>({})
  const [del, setDel] = useState<Row | null>(null)

  const open = (item?: Row) => {
    const base = item ?? { id: uid(collection.slice(0, 2)), ...defaults }
    setIsNew(!item)
    setEditing(base)
    setErr({})
    setDraft(Object.fromEntries(fields.map((f) => [f.key, Array.isArray(base[f.key]) ? base[f.key].join('\n') : String(base[f.key] ?? '')])))
  }

  const submit = () => {
    const n: Record<string, string> = {}
    const out: Row = { ...editing }
    for (const f of fields) {
      const v = (draft[f.key] ?? '').trim()
      if (f.required && !v) n[f.key] = `${f.label} wajib diisi.`
      if (f.type === 'number' && v) {
        const num = Number(v)
        if (Number.isNaN(num) || (f.min !== undefined && num < f.min) || (f.max !== undefined && num > f.max)) n[f.key] = `${f.label} harus antara ${f.min ?? 0} dan ${f.max ?? '∞'}.`
        out[f.key] = num
      } else if (f.type === 'lines') out[f.key] = v.split('\n').map((x) => x.trim()).filter(Boolean)
      else out[f.key] = v
    }
    setErr(n)
    if (Object.keys(n).length) return
    if (slugFrom) {
      let slug = slugify(String(out[slugFrom]))
      if (items.some((i) => i.slug === slug && i.id !== out.id)) slug += `-${Math.random().toString(36).slice(2, 5)}`
      if (isNew || !out.slug) out.slug = slug
    }
    save(collection, out as { id: string })
    setEditing(null)
    toast.success(`${noun} disimpan.`)
  }

  return (
    <div>
      <div className="mb-4 flex justify-end"><Button onClick={() => open()}><Plus className="h-4 w-4" />Tambah {noun}</Button></div>
      {items.length ? (
        <ul className="divide-y divide-royal/10 rounded-3xl border border-royal/10 bg-white">
          {items.map((it) => (
            <li key={it.id} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">{render(it)}</div>
              <Button variant="ghost" size="sm" onClick={() => open(it)} aria-label={`Ubah ${noun}`}><Pencil className="h-4 w-4" /><span className="hidden sm:inline">Ubah</span></Button>
              <Button variant="ghost" size="sm" className="text-red-600" onClick={() => setDel(it)} aria-label={`Hapus ${noun}`}><Trash2 className="h-4 w-4" /><span className="hidden sm:inline">Hapus</span></Button>
            </li>
          ))}
        </ul>
      ) : <EmptyState title={`Belum ada ${noun.toLowerCase()}`} action={<Button onClick={() => open()}>Tambah {noun}</Button>} />}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={`${isNew ? 'Tambah' : 'Ubah'} ${noun}`} size="lg"
        footer={<><Button variant="ghost" onClick={() => setEditing(null)}>Batal</Button><Button onClick={submit}>Simpan</Button></>}>
        <div className="grid gap-4 sm:grid-cols-2">
          {fields.map((f) => {
            const set = (e: { target: { value: string } }) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))
            const wide = f.type === 'textarea' || f.type === 'lines' || f.type === 'url'
            return (
              <Field key={f.key} label={f.label} error={err[f.key]} hint={f.hint} className={wide ? 'sm:col-span-2' : ''}>
                {f.type === 'textarea' ? <Textarea value={draft[f.key] ?? ''} onChange={set} />
                  : f.type === 'lines' ? <Textarea value={draft[f.key] ?? ''} onChange={set} placeholder="Satu butir per baris" />
                  : f.type === 'select' ? <Select value={draft[f.key] ?? ''} onChange={set}><option value="">Pilih…</option>{f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</Select>
                  : f.type === 'icon' ? <Select value={draft[f.key] ?? ''} onChange={set}><option value="">Pilih ikon…</option>{ICON_NAMES.map((n) => <option key={n}>{n}</option>)}</Select>
                  : <Input type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'} value={draft[f.key] ?? ''} onChange={set} min={f.min} max={f.max} step={f.type === 'number' ? 'any' : undefined} />}
              </Field>
            )
          })}
        </div>
      </Modal>
      <ConfirmDialog open={!!del} tone="danger" title={`Hapus ${noun.toLowerCase()}?`} message="Data yang dihapus tidak dapat dikembalikan." confirmLabel="Hapus" onCancel={() => setDel(null)}
        onConfirm={() => { if (del) remove(collection, del.id); setDel(null); toast.success(`${noun} dihapus.`) }} />
    </div>
  )
}
