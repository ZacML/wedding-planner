import { supabase } from '../lib/supabase'
import type { Photo } from '../types'

const BUCKET = 'venue-photos'

export async function listPhotos(venueId: string): Promise<Photo[]> {
  const { data, error } = await supabase.from('venue_photos').select('id,storage_path,file_name')
    .eq('venue_id', venueId).order('created_at')
  if (error) throw new Error(error.message)
  if (!data?.length) return []
  const signed = await supabase.storage.from(BUCKET).createSignedUrls(data.map(p => p.storage_path), 3600)
  if (signed.error) throw new Error(signed.error.message)
  return data.map((p, i) => ({ id: p.id, path: p.storage_path, name: p.file_name ?? '', url: signed.data[i]?.signedUrl ?? '' }))
}

export async function uploadPhotos(venueId: string, files: File[]) {
  const { data: u } = await supabase.auth.getUser()
  if (!u.user) throw new Error('Sessão expirada. Entre novamente.')
  for (const f of files) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) throw new Error(`${f.name}: use JPG, PNG ou WebP.`)
    if (f.size > 5 * 1024 * 1024) throw new Error(`${f.name}: máximo de 5 MB por foto.`)
    const ext = f.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const path = `${u.user.id}/${venueId}/${crypto.randomUUID()}.${ext}`
    const up = await supabase.storage.from(BUCKET).upload(path, f, { contentType: f.type })
    if (up.error) throw new Error(up.error.message)
    const ins = await supabase.from('venue_photos').insert({ venue_id: venueId, storage_path: path, file_name: f.name })
    if (ins.error) {
      await supabase.storage.from(BUCKET).remove([path])
      throw new Error(ins.error.message)
    }
  }
}

export async function removePhoto(p: Photo) {
  const st = await supabase.storage.from(BUCKET).remove([p.path])
  if (st.error) throw new Error(st.error.message)
  const { error } = await supabase.from('venue_photos').delete().eq('id', p.id)
  if (error) throw new Error(error.message)
}

// Chamado antes de excluir um local: apaga os arquivos (as linhas caem em cascata).
export async function removeVenueFiles(venueId: string) {
  const { data } = await supabase.from('venue_photos').select('storage_path').eq('venue_id', venueId)
  if (data?.length) await supabase.storage.from(BUCKET).remove(data.map(p => p.storage_path))
}
