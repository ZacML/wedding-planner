import Crud from '../components/Crud'
import type { Field } from '../types'

const fields: Field[] = [
  { key: 'name', label: 'Nome', required: true },
  { key: 'category', label: 'Categoria', type: 'select', options: ['Decoração', 'Fotografia', 'Buffet', 'Música', 'Outro'], badge: true },
  { key: 'negotiation_status', label: 'Negociação', type: 'select', options: ['Em contato', 'Orçamento recebido', 'Negociando', 'Fechado', 'Descartado'], badge: true },
  { key: 'phone', label: 'Telefone', type: 'tel' },
  { key: 'link', label: 'Instagram/site' },
  { key: 'estimated_price', label: 'Preço estimado (R$)', type: 'money' },
  { key: 'notes', label: 'Observações', type: 'textarea' },
]

export default function Vendors() {
  return <Crud table="vendors" title="Fornecedores" singular="fornecedor" fields={fields} filterKey="category" filterLabel="Categoria" />
}
