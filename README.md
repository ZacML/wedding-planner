# Nosso Casamento — Wedding Planner

React + TypeScript + Vite com Supabase (PostgreSQL, autenticação e Storage). Sem backend próprio.

## 1. Criar o projeto Supabase
1. Em https://supabase.com crie um projeto.
2. Abra **SQL Editor**, cole todo o conteúdo de `supabase/schema.sql` e execute. Isso cria as tabelas, índices, políticas RLS, o bucket privado `venue-photos` e as políticas do Storage.
3. Em **Authentication > Providers**, mantenha **Email** ativo. Para testar sem confirmar e-mail, desative "Confirm email" (opcional; em produção, deixe ativo).
4. Em **Project Settings > API**, copie a **Project URL** e a chave **anon public**. Nunca use a `service_role` no frontend.

## 2. Configurar variáveis
```
cp .env.example .env.local
```
Preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.

## 3. Instalar e executar
```
npm install
npm run dev      # http://localhost:5173
npm run build    # verifica tipos e gera dist/
```
Crie sua conta na tela inicial e use o app.

## Storage e segurança
- Bucket `venue-photos`: **privado**, até 5 MB por arquivo, apenas JPG/PNG/WebP.
- Arquivos ficam em `<id-do-usuário>/<id-do-local>/<arquivo>`. As políticas só permitem ler, enviar e apagar dentro da pasta do próprio usuário.
- O banco guarda só a referência (`venue_photos.storage_path`); o app gera URLs assinadas temporárias (1 h) para exibir as fotos, que continuam aparecendo após atualizar a página.
- Todas as tabelas têm RLS: cada usuário só acessa linhas com `user_id = auth.uid()`. O `user_id` é preenchido pelo próprio banco.
- Excluir um local apaga as fotos do Storage e as referências.

## Orçamento
Saldo = orçamento total − (despesas previstas + realizadas). Mude o tipo de uma despesa para "Realizada" quando ela for efetivada.

## Estrutura
`supabase/schema.sql`, `src/lib` (cliente), `src/services` (banco e upload), `src/components` (formulário/lista genéricos, galeria, login), `src/pages` (telas), `src/types`.
