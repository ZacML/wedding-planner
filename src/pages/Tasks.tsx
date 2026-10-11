import Crud from '../components/Crud'
import { update } from '../services/crud'
import type { Field } from '../types'

const fields: Field[] = [
  { key: 'description', label: 'Descrição', required: true },
  { key: 'status', label: 'Status', type: 'select', options: ['Pendente', 'Em andamento', 'Concluída'], badge: true },
  { key: 'priority', label: 'Prioridade', type: 'select', options: ['Baixa', 'Média', 'Alta'], badge: true },
  { key: 'due_date', label: 'Prazo', type: 'date' },
]

export default function Tasks() {
  return (
    <Crud table="tasks" title="Tarefas" singular="tarefa" fields={fields} filterKey="status" filterLabel="Status"
      cardExtra={(r, reload) => (
        <button className="btn small" onClick={async () => { await update('tasks', r.id, { status: r.status === 'Concluída' ? 'Pendente' : 'Concluída' }); reload() }}>
          {r.status === 'Concluída' ? 'Reabrir' : 'Marcar como concluída'}
        </button>
      )} />
  )
}
