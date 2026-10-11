-- Wedding Planner: execute inteiro no SQL Editor do Supabase.
create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create table public.settings (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  wedding_date date,
  total_budget numeric(12,2) not null default 0 check (total_budget >= 0),
  updated_at timestamptz not null default now()
);

create table public.guests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  phone text,
  group_name text,
  companions integer not null default 0 check (companions >= 0),
  invite_status text not null default 'Não enviado' check (invite_status in ('Não enviado','Enviado')),
  rsvp text not null default 'Pendente' check (rsvp in ('Pendente','Confirmado','Recusado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.venues (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  address text,
  estimated_price numeric(12,2) check (estimated_price >= 0),
  capacity integer check (capacity >= 0),
  contact text,
  notes text,
  is_favorite boolean not null default false,
  evaluation_status text not null default 'A visitar' check (evaluation_status in ('A visitar','Visitado','Em análise','Descartado','Escolhido')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Várias fotos por local; o arquivo fica no Storage, aqui só a referência.
create table public.venue_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  venue_id uuid not null references public.venues(id) on delete cascade,
  storage_path text not null unique,
  file_name text,
  created_at timestamptz not null default now()
);

create table public.vendors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  category text not null default 'Outro' check (category in ('Decoração','Fotografia','Buffet','Música','Outro')),
  phone text,
  link text,
  estimated_price numeric(12,2) check (estimated_price >= 0),
  notes text,
  negotiation_status text not null default 'Em contato' check (negotiation_status in ('Em contato','Orçamento recebido','Negociando','Fechado','Descartado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  description text not null,
  category text,
  amount numeric(12,2) not null check (amount >= 0),
  kind text not null default 'Prevista' check (kind in ('Prevista','Realizada')),
  payment_status text not null default 'Pendente' check (payment_status in ('Pendente','Pago')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  description text not null,
  due_date date,
  priority text not null default 'Média' check (priority in ('Baixa','Média','Alta')),
  status text not null default 'Pendente' check (status in ('Pendente','Em andamento','Concluída')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index on public.guests (user_id, rsvp);
create index on public.venues (user_id);
create index on public.venue_photos (venue_id);
create index on public.vendors (user_id, category);
create index on public.expenses (user_id);
create index on public.tasks (user_id, status, due_date);

do $$ declare t text; begin
  foreach t in array array['settings','guests','venues','vendors','expenses','tasks'] loop
    execute format('create trigger trg_%s_updated before update on public.%I for each row execute function public.set_updated_at()', t, t);
  end loop;
  foreach t in array array['settings','guests','venues','venue_photos','vendors','expenses','tasks'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "%s_owner" on public.%I for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())', t, t);
  end loop;
end $$;

-- Storage: bucket PRIVADO. Arquivos em <user_id>/<venue_id>/<arquivo>.
-- Fotos são exibidas por URLs assinadas (temporárias) geradas no app.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('venue-photos', 'venue-photos', false, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy "venue_photos_select" on storage.objects for select to authenticated
  using (bucket_id = 'venue-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "venue_photos_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'venue-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "venue_photos_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'venue-photos' and (storage.foldername(name))[1] = auth.uid()::text);
