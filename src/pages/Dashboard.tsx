import { useEffect, useState } from 'react'
import { dateBR, money } from '../lib/supabase'
import { getSettings, list, saveSettings } from '../services/crud'
import type { Row, Settings } from '../types'

const days = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  const t = new Date(); t.setHours(0, 0, 0, 0)
  return Math.round((new Date(y, m - 1, d).getTime() - t.getTime()) / 86400000)
}

export default function Dashboard({ go }: { go: (p: string) => void }) {
  const [s, setS] = useState<Settings>({ wedding_date: null, total_budget: 0 })
  const [guests, setGuests] = useState<Row[]>([])
  const [expenses, setExpenses] = useState<Row[]>([])
  const [tasks, setTasks] = useState<Row[]>([])
  const [date, setDate] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getSettings(), list('guests'), list('expenses'), list('tasks')])
      .then(([st, g, e, t]) => { setS(st); setDate(st.wedding_date ?? ''); setGuests(g); setExpenses(e); setTasks(t) })
      .catch(e => setErr(e.message)).finally(() => setLoading(false))
  }, [])

  async function saveDate(e: React.FormEvent) {
    e.preventDefault()
    if (!date) return setErr('Escolha a data do casamento.')
    try { await saveSettings({ ...s, wedding_date: date }); setS({ ...s, wedding_date: date }); setErr('') } catch (e2) { setErr((e2 as Error).message) }
  }

  if (loading) return <p className="muted">Carregando…</p>
  const people = (st: string) => guests.filter(g => g.rsvp === st).reduce((a, g) => a + 1 + (g.companions ?? 0), 0)
  const spent = expenses.reduce((a, x) => a + Number(x.amount), 0)
  const open = tasks.filter(t => t.status !== 'Concluída')
  const soon = open.filter(t => t.due_date && days(t.due_date) <= 14).sort((a, b) => a.due_date.localeCompare(b.due_date)).slice(0, 5)
  const left = s.wedding_date ? days(s.wedding_date) : null

  return (
    <section>
      <div className="hero">
        {left === null ? <h1>Defina a data do casamento</h1>
          : left > 0 ? <h1>Faltam {left} {left === 1 ? 'dia' : 'dias'}</h1>
          : left === 0 ? <h1>É hoje!</h1> : <h1>Casamento realizado há {-left} dias</h1>}
        {s.wedding_date && <p className="muted">{dateBR(s.wedding_date)}</p>}
        <form className="inline" onSubmit={saveDate}>
          <label><span>Data do casamento</span><input type="date" value={date} onChange={e => setDate(e.target.value)} /></label>
          <button className="btn">Salvar data</button>
        </form>
      </div>
      {err && <p className="alert" role="alert">{err}</p>}
      <div className="stats">
        <button onClick={() => go('convidados')}><b>{people('Confirmado')}</b><span>confirmados · {people('Pendente')} pendentes · {people('Recusado')} recusados</span></button>
        <button onClick={() => go('orcamento')}><b>{money(s.total_budget - spent)}</b><span>saldo de {money(s.total_budget)}</span></button>
        <button onClick={() => go('tarefas')}><b>{open.length}</b><span>tarefas pendentes</span></button>
      </div>
      <h2>Próximos prazos</h2>
      {soon.length === 0 ? <p className="empty">Nenhuma tarefa com prazo nos próximos 14 dias.</p> : (
        <ul className="list">
          {soon.map(t => (
            <li key={t.id}><span>{t.description}</span><span className={days(t.due_date) < 0 ? 'neg' : 'muted'}>{dateBR(t.due_date)}{days(t.due_date) < 0 && ' · atrasada'}</span></li>
          ))}
        </ul>
      )}
      <h2>Ir para</h2>
      <div className="quick">
        {['convidados', 'locais', 'fornecedores', 'orcamento', 'tarefas'].map(p => <button key={p} className="btn" onClick={() => go(p)}>{NAMES[p]}</button>)}
      </div>
    </section>
  )
}
export const NAMES: Record<string, string> = { convidados: 'Convidados', locais: 'Locais da festa', fornecedores: 'Fornecedores', orcamento: 'Orçamento', tarefas: 'Tarefas' }
