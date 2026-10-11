import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const configured = Boolean(url && anon)
export const supabase = createClient(url ?? 'http://localhost', anon ?? 'missing')

export const money = (n: number | null | undefined) =>
  (n ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

// 'AAAA-MM-DD' -> 'DD/MM/AAAA' sem converter fuso horário
export const dateBR = (d?: string | null) => (d ? d.split('-').reverse().join('/') : '')
