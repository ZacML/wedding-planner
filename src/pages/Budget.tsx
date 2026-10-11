import { useEffect, useState } from 'react'
import Crud from '../components/Crud'
import { money } from '../lib/supabase'
import { getSettings, saveSettings } from '../services/crud'
import type { Field, Row } from '../types'

const fields: Field[] = [
  { key: 'description', label: 'Descrição', required: true },
  { key: 'amount', label: 'Valor (R$)', type: 'money', required: true },
  { key: 'kind', label: 'Tipo', type: 'select', options: ['Prevista', 'Realizada'], badge: true },
  { key: 'payment_status', label: 'Pagamento', type: 'select', options: ['Pendente', 'Pago'], badge: true },
  { key: 'category', label: 'Categoria' },
]

function Summary({ rows }: { rows: Row[] }) {
  const [total, setTotal] = useState(0)
  const [input, setInput] = useState('')
  const [msg, setMsg] = useState('')
  useEffect(() => { getSettings().then(s => { setTotal(s.total_budget); setInput(String(s.total_budget)) }).catch(e => setMsg(e.message)) }, [])

  const sum = (k: string) => rows.filter(r => r.kind === k).reduce((a, r) => a + Number(r.amount), 0)
  const planned = sum('Prevista'), done = sum('Realizada')

  async function save(e: React.FormEvent) {
    e.preventDefault()
    const n = Number(input)
    if (Number.isNaN(n) || n < 0) return setMsg('Informe um valor válido.')
    try { const s = await getSettings(); await saveSettings({ ...s, total_budget: n }); setTotal(n); setMsg('Orçamento salvo.') } catch (e2) { setMsg((e2 as Error).message) }
  }

  return (
    <>
      <form className="inline" onSubmit={save}>
        <label><span>Orçamento total (R$)</span><input type="number" min={0} step="0.01" value={input} onChange={e => setInput(e.target.value)} /></label>
        <button className="btn">Salvar</button>
        {msg && <span className="muted">{msg}</span>}
      </form>
      <div className="stats">
        <div><b>{money(total)}</b><span>orçamento total</span></div>
        <div><b>{money(planned)}</b><span>previsto</span></div>
        <div><b>{money(done)}</b><span>realizado</span></div>
        <div><b className={total - planned - done < 0 ? 'neg' : ''}>{money(total - planned - done)}</b><span>saldo disponível</span></div>
      </div>
    </>
  )
}

export default function Budget() {
  return <Crud table="expenses" title="Orçamento" singular="despesa" fields={fields} filterKey="kind" filterLabel="Tipo" header={rows => <Summary rows={rows} />} />
}
