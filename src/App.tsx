import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { configured, supabase } from './lib/supabase'
import Login from './components/Login'
import Dashboard, { NAMES } from './pages/Dashboard'
import Guests from './pages/Guests'
import Venues from './pages/Venues'
import Vendors from './pages/Vendors'
import Budget from './pages/Budget'
import Tasks from './pages/Tasks'

const pages: Record<string, () => JSX.Element> = {
  convidados: Guests, locais: Venues, fornecedores: Vendors, orcamento: Budget, tarefas: Tasks,
}
const current = () => location.hash.replace('#/', '') || 'inicio'

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [ready, setReady] = useState(false)
  const [page, setPage] = useState(current())

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true) })
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    const onHash = () => setPage(current())
    window.addEventListener('hashchange', onHash)
    return () => { data.subscription.unsubscribe(); window.removeEventListener('hashchange', onHash) }
  }, [])

  const go = (p: string) => { location.hash = `#/${p}` }

  if (!configured) return <main className="login"><div className="modal"><h1>Configuração pendente</h1>
    <p>Crie o arquivo <code>.env.local</code> com <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_ANON_KEY</code> (veja o README) e reinicie o servidor.</p></div></main>
  if (!ready) return <p className="muted center">Carregando…</p>
  if (!session) return <Login />

  const Page = pages[page]
  return (
    <>
      <header className="top">
        <button className="brand" onClick={() => go('inicio')}>Nosso Casamento</button>
        <nav aria-label="Principal">
          <button className={page === 'inicio' || !Page ? 'on' : ''} onClick={() => go('inicio')}>Início</button>
          {Object.keys(pages).map(p => <button key={p} className={page === p ? 'on' : ''} onClick={() => go(p)}>{NAMES[p]}</button>)}
        </nav>
        <button className="link" onClick={() => supabase.auth.signOut()}>Sair</button>
      </header>
      <main className="wrap">{Page ? <Page /> : <Dashboard go={go} />}</main>
    </>
  )
}
