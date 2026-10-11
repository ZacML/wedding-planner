import { useCallback, useEffect, useRef, useState } from 'react'
import { listPhotos, removePhoto, uploadPhotos } from '../services/photos'
import type { Photo } from '../types'

export default function Gallery({ venueId }: { venueId: string }) {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [open, setOpen] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const input = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    try { setPhotos(await listPhotos(venueId)) } catch (e) { setErr((e as Error).message) }
  }, [venueId])
  useEffect(() => { load() }, [load])

  async function onFiles(files: FileList | null) {
    if (!files?.length) return
    setBusy(true); setErr('')
    try { await uploadPhotos(venueId, Array.from(files)) } catch (e) { setErr((e as Error).message) }
    if (input.current) input.current.value = ''
    await load(); setBusy(false)
  }

  async function del(p: Photo) {
    if (!window.confirm('Remover esta foto?')) return
    try { await removePhoto(p); setOpen(null); await load() } catch (e) { setErr((e as Error).message) }
  }

  const cur = open !== null ? photos[open] : null
  return (
    <div className="gallery">
      <div className="thumbs">
        {photos.map((p, i) => (
          <button key={p.id} className="thumb" onClick={() => setOpen(i)} aria-label={`Ampliar foto ${i + 1}`}>
            <img src={p.url} alt={p.name || `Foto ${i + 1}`} loading="lazy" />
          </button>
        ))}
      </div>
      <label className="btn small">
        {busy ? 'Enviando…' : 'Adicionar fotos'}
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden disabled={busy} onChange={e => onFiles(e.target.files)} />
      </label>
      {err && <p className="alert" role="alert">{err}</p>}
      {cur && (
        <div className="overlay dark" role="dialog" aria-modal="true" aria-label="Galeria de fotos" onMouseDown={e => e.target === e.currentTarget && setOpen(null)}>
          <div className="lightbox">
            <img src={cur.url} alt={cur.name} />
            <div className="actions">
              <button className="btn" disabled={open === 0} onClick={() => setOpen(open! - 1)}>Anterior</button>
              <span>{open! + 1} de {photos.length}</span>
              <button className="btn" disabled={open === photos.length - 1} onClick={() => setOpen(open! + 1)}>Próxima</button>
              <button className="btn danger" onClick={() => del(cur)}>Remover</button>
              <button className="btn" onClick={() => setOpen(null)}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
