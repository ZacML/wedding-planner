import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { dateBR, money } from '../lib/supabase'
import { insert, list, remove, update } from '../services/crud'
import type { Field, Row } from '../types'

interface Props {
  table: string
  title: string
  singular: string
  fields: Field[]
  filterKey?: string
  filterLabel?: string
  searchKeys?: string[]
  header?: (rows: Row[]) => ReactNode
  cardExtra?: (row: Row, reload: () => void) => ReactNode
  beforeDelete?: (row: Row) => Promise<void>
}

const show = (f: Field, v: unknown) => {
  if (v === null || v === undefined || v === '') return ''
  if (f.type === 'money') return money(Number(v))
  if (f.type === 'date') return dateBR(String(v))
  if (f.type === 'checkbox') return v ? 'Sim' : 'Não'
  return String(v)
}

export default function Crud({ table, title, singular, fields, filterKey, filterLabel, searchKeys, header, cardExtra, beforeDelete }: Props) {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('')
  const [editing, setEditing] = useState<Row | 'new' | null>(null)

  const load = useCallback(async () => {
    try { setRows(await list(table)); setError('') } catch (e) { setError((e as Error).message) }
    setLoading(false)
  }, [table])
  useEffect(() => { load() }, [load])

  const keys = searchKeys ?? fields.filter(f => !f.type || f.type === 'text' || f.type === 'textarea').map(f => f.key)
  const filterField = fields.find(f => f.key === filterKey)
  const visible = rows.filter(r =>
    (!filter || r[filterKey!] === filter) &&
    (!q || keys.some(k => String(r[k] ?? '').toLowerCase().includes(q.toLowerCase()))))

  async function del(r: Row) {
    if (!window.confirm(`Excluir "${r[fields[0].key]}"? Essa ação não pode ser desfeita.`)) return
    try { await beforeDelete?.(r); await remove(table, r.id); await load() } catch (e) { setError((e as Error).message) }
  }

  return (
    <section>
      <div className="page-head">
        <h1>{title}</h1>
        <button className="btn primary" onClick={() => setEditing('new')}>Adicionar {singular}</button>
      </div>
      {header?.(rows)}
      <div className="toolbar">
        <input type="search" placeholder="Pesquisar" aria-label="Pesquisar" value={q} onChange={e => setQ(e.target.value)} />
        {filterField && (
          <select aria-label={filterLabel} value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="">{filterLabel ?? 'Todos'}: todos</option>
            {filterField.options!.map(o => <option key={o}>{o}</option>)}
          </select>
        )}
      </div>
      {error && <p className="alert" role="alert">{error}</p>}
      {loading ? <p className="muted">Carregando…</p> : visible.length === 0 ? (
        <p className="empty">{rows.length === 0 ? `Nenhum registro ainda. Use "Adicionar ${singular}" para começar.` : 'Nada encontrado com esses filtros.'}</p>
      ) : (
        <div className="grid">
          {visible.map(r => (
            <article className="card" key={r.id}>
              <h3>{r[fields[0].key]}{r.is_favorite && <span title="Favorito"> ♥</span>}</h3>
              <div className="badges">
                {fields.filter(f => f.badge && r[f.key]).map(f => <span className="badge" key={f.key}>{show(f, r[f.key])}</span>)}
              </div>
              <dl>
                {fields.slice(1).filter(f => !f.badge && f.type !== 'checkbox' && show(f, r[f.key])).map(f => (
                  <div key={f.key}><dt>{f.label}</dt><dd>{show(f, r[f.key])}</dd></div>
                ))}
              </dl>
              {cardExtra?.(r, load)}
              <div className="actions">
                <button className="btn" onClick={() => setEditing(r)}>Editar</button>
                <button className="btn danger" onClick={() => del(r)}>Excluir</button>
              </div>
            </article>
          ))}
        </div>
      )}
      {editing && (
        <FormModal title={editing === 'new' ? `Novo ${singular}` : `Editar ${singular}`} fields={fields}
          initial={editing === 'new' ? null : editing} onClose={() => setEditing(null)}
          onSave={async v => {
            if (editing === 'new') await insert(table, v); else await update(table, editing.id, v)
            setEditing(null); await load()
          }} />
      )}
    </section>
  )
}

function FormModal({ title, fields, initial, onClose, onSave }: {
  title: string; fields: Field[]; initial: Row | null; onClose: () => void; onSave: (v: Record<string, unknown>) => Promise<void>
}) {
  const [vals, setVals] = useState<Record<string, any>>(() => {
    const o: Record<string, any> = {}
    fields.forEach(f => { o[f.key] = initial?.[f.key] ?? (f.type === 'checkbox' ? false : f.type === 'select' ? f.options![0] : '') })
    return o
  })
  const [err, setErr] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const out: Record<string, unknown> = {}
    for (const f of fields) {
      const v = vals[f.key]
      if (f.required && String(v).trim() === '') return setErr(`Preencha o campo "${f.label}".`)
      if ((f.type === 'number' || f.type === 'money') && v !== '') {
        const n = Number(v)
        if (Number.isNaN(n) || n < 0) return setErr(`"${f.label}" deve ser um número maior ou igual a zero.`)
        out[f.key] = n
      } else out[f.key] = v === '' ? null : typeof v === 'string' ? v.trim() : v
    }
    setSaving(true)
    try { await onSave(out) } catch (e2) { setErr((e2 as Error).message); setSaving(false) }
  }

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label={title} onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <form className="modal" onSubmit={submit} noValidate>
        <h2>{title}</h2>
        {fields.map(f => (
          <label key={f.key} className={f.type === 'checkbox' ? 'check' : ''}>
            <span>{f.label}{f.required && ' *'}</span>
            {f.type === 'select' ? (
              <select value={vals[f.key]} onChange={e => setVals({ ...vals, [f.key]: e.target.value })}>
                {f.options!.map(o => <option key={o}>{o}</option>)}
              </select>
            ) : f.type === 'textarea' ? (
              <textarea rows={3} value={vals[f.key]} onChange={e => setVals({ ...vals, [f.key]: e.target.value })} />
            ) : f.type === 'checkbox' ? (
              <input type="checkbox" checked={vals[f.key]} onChange={e => setVals({ ...vals, [f.key]: e.target.checked })} />
            ) : (
              <input type={f.type === 'money' || f.type === 'number' ? 'number' : f.type ?? 'text'}
                step={f.type === 'money' ? '0.01' : undefined} min={f.type === 'money' || f.type === 'number' ? 0 : undefined}
                value={vals[f.key]} onChange={e => setVals({ ...vals, [f.key]: e.target.value })} />
            )}
          </label>
        ))}
        {err && <p className="alert" role="alert">{err}</p>}
        <div className="actions end">
          <button type="button" className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn primary" disabled={saving}>{saving ? 'Salvando…' : 'Salvar'}</button>
        </div>
      </form>
    </div>
  )
}
