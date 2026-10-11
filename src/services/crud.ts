import { supabase } from '../lib/supabase'
import type { Row, Settings } from '../types'

const fail = (e: { message: string } | null) => { if (e) throw new Error(e.message) }

export async function list(table: string): Promise<Row[]> {
  const { data, error } = await supabase.from(table).select('*').order('created_at', { ascending: false })
  fail(error)
  return (data ?? []) as Row[]
}
// user_id é preenchido pelo banco (default auth.uid()) e validado pela RLS.
export async function insert(table: string, values: Record<string, unknown>) {
  const { error } = await supabase.from(table).insert(values)
  fail(error)
}
export async function update(table: string, id: string, values: Record<string, unknown>) {
  const { error } = await supabase.from(table).update(values).eq('id', id)
  fail(error)
}
export async function remove(table: string, id: string) {
  const { error } = await supabase.from(table).delete().eq('id', id)
  fail(error)
}
export async function getSettings(): Promise<Settings> {
  const { data, error } = await supabase.from('settings').select('wedding_date,total_budget').maybeSingle()
  fail(error)
  return { wedding_date: data?.wedding_date ?? null, total_budget: Number(data?.total_budget ?? 0) }
}
export async function saveSettings(s: Settings) {
  const { error } = await supabase.from('settings').upsert(s, { onConflict: 'user_id' })
  fail(error)
}
