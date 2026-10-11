import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [signup, setSignup] = useState(false)
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 6) return setMsg('A senha precisa ter pelo menos 6 caracteres.')
    setBusy(true); setMsg('')
    const { data, error } = signup ? await supabase.auth.signUp({ email, password }) : await supabase.auth.signInWithPassword({ email, password })
    if (error) setMsg(error.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : error.message)
    else if (signup && !data.session) setMsg('Conta criada. Confirme o e-mail que enviamos e depois entre.')
    setBusy(false)
  }

  return (
    <main className="login">
      <form className="modal" onSubmit={submit}>
        <h1>Nosso Casamento</h1>
        <p className="muted">{signup ? 'Crie sua conta para começar a planejar.' : 'Entre para continuar o planejamento.'}</p>
        <label><span>E-mail</span><input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} /></label>
        <label><span>Senha</span><input type="password" required autoComplete={signup ? 'new-password' : 'current-password'} value={password} onChange={e => setPassword(e.target.value)} /></label>
        {msg && <p className="alert" role="alert">{msg}</p>}
        <button className="btn primary" disabled={busy}>{busy ? 'Aguarde…' : signup ? 'Criar conta' : 'Entrar'}</button>
        <button type="button" className="link" onClick={() => { setSignup(!signup); setMsg('') }}>
          {signup ? 'Já tenho conta' : 'Criar uma conta'}
        </button>
      </form>
    </main>
  )
}
