import Crud from '../components/Crud'
import type { Field } from '../types'

const fields: Field[] = [
  { key: 'name', label: 'Nome', required: true },
  { key: 'phone', label: 'Telefone', type: 'tel' },
  { key: 'group_name', label: 'Grupo/família' },
  { key: 'companions', label: 'Acompanhantes', type: 'number' },
  { key: 'invite_status', label: 'Convite', type: 'select', options: ['Não enviado', 'Enviado'], badge: true },
  { key: 'rsvp', label: 'Presença', type: 'select', options: ['Pendente', 'Confirmado', 'Recusado'], badge: true },
]

export default function Guests() {
  return (
    <Crud table="guests" title="Convidados" singular="convidado" fields={fields} filterKey="rsvp" filterLabel="Presença"
      header={rows => {
        const n = (s: string) => rows.filter(r => r.rsvp === s).reduce((a, r) => a + 1 + (r.companions ?? 0), 0)
        return (
          <div className="stats">
            <div><b>{rows.reduce((a, r) => a + 1 + (r.companions ?? 0), 0)}</b><span>pessoas convidadas</span></div>
            <div><b>{n('Confirmado')}</b><span>confirmadas</span></div>
            <div><b>{n('Pendente')}</b><span>pendentes</span></div>
            <div><b>{n('Recusado')}</b><span>recusadas</span></div>
          </div>
        )
      }} />
  )
}
