export type Row = Record<string, any> & { id: string }

export interface Settings { wedding_date: string | null; total_budget: number }
export interface Photo { id: string; path: string; url: string; name: string }

export type FieldType = 'text' | 'tel' | 'number' | 'money' | 'date' | 'select' | 'checkbox' | 'textarea'
export interface Field {
  key: string; label: string; type?: FieldType; options?: string[]
  required?: boolean; badge?: boolean
}
