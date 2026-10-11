import { useState } from 'react'
import Crud from '../components/Crud'
import Gallery from '../components/Gallery'
import { money } from '../lib/supabase'
import { removeVenueFiles } from '../services/photos'
import type { Field } from '../types'

const fields: Field[] = [
  { key: 'name', label: 'Nome', required: true },
  { key: 'evaluation_status', label: 'Avaliação', type: 'select', options: ['A visitar', 'Visitado', 'Em análise', 'Descartado', 'Escolhido'], badge: true },
  { key: 'address', label: 'Endereço' },
  { key: 'estimated_price', label: 'Preço estimado (R$)', type: 'money' },
  { key: 'capacity', label: 'Capacidade (pessoas)', type: 'number' },
  { key: 'contact', label: 'Contato' },
  { key: 'notes', label: 'Observações', type: 'textarea' },
  { key: 'is_favorite', label: 'Favorito', type: 'checkbox' },
]

export default function Venues() {
  const [picked, setPicked] = useState<string[]>([])
  const toggle = (id: string) => setPicked(p => p.includes(id) ? p.filter(x => x !== id) : p.length < 3 ? [...p, id] : p)

  return (
    <Crud table="venues" title="Locais da festa" singular="local" fields={fields} filterKey="evaluation_status" filterLabel="Avaliação"
      beforeDelete={r => removeVenueFiles(r.id)}
      header={rows => {
        const sel = rows.filter(r => picked.includes(r.id))
        if (sel.length < 2) return <p className="muted">Marque de 2 a 3 locais em "Comparar" para ver lado a lado.</p>
        const line = (label: string, f: (r: any) => string) => (
          <tr><th scope="row">{label}</th>{sel.map(r => <td key={r.id}>{f(r) || '—'}</td>)}</tr>
        )
        return (
          <div className="compare">
            <table>
              <thead><tr><th></th>{sel.map(r => <th key={r.id}>{r.name}</th>)}</tr></thead>
              <tbody>
                {line('Preço', r => (r.estimated_price != null ? money(r.estimated_price) : ''))}
                {line('Capacidade', r => (r.capacity != null ? String(r.capacity) : ''))}
                {line('Avaliação', r => r.evaluation_status)}
                {line('Endereço', r => r.address)}
                {line('Contato', r => r.contact)}
                {line('Favorito', r => (r.is_favorite ? 'Sim' : 'Não'))}
              </tbody>
            </table>
          </div>
        )
      }}
      cardExtra={r => (
        <>
          <Gallery venueId={r.id} />
          <label className="check small"><input type="checkbox" checked={picked.includes(r.id)} onChange={() => toggle(r.id)} /><span>Comparar</span></label>
        </>
      )} />
  )
}
