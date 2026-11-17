import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** true bila variabel lingkungan Supabase terisi. */
export const isBackendConfigured = Boolean(url && key)

export const supabase = isBackendConfigured ? createClient(url as string, key as string) : null
