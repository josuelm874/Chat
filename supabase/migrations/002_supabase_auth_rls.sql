-- ============================================================
-- Chat UI Soft Tech — Migração 002: Supabase Auth + RLS
-- ============================================================
-- APLIQUE ESTE SCRIPT NO: Supabase Dashboard → SQL Editor
--
-- PRÉ-REQUISITO OBRIGATÓRIO (fazer antes de aplicar):
--   Supabase Dashboard → Authentication → Settings
--   → Desmarcar "Enable email confirmations"   (Auto-confirm users)
--   Isso permite que o sistema crie contas automaticamente
--   sem precisar que o usuário confirme e-mail.
--
-- Esta migração:
--   1. Cria tabela user_profiles (perfis vinculados ao Auth)
--   2. Cria tabela audit_log    (conformidade LGPD)
--   3. Remove escrita anônima do system_data (FASE 1)
--   4. Mantém leitura anônima temporariamente (remover na FASE 2)
--
-- Após aplicar, o sistema continua funcionando normalmente.
-- Os usuários são migrados automaticamente para o Supabase Auth
-- no primeiro login após o deploy do novo código.
-- ============================================================


-- ──────────────────────────────────────────────────────────
-- 1. TABELA: user_profiles
--    Vincula auth.users ao perfil do sistema.
--    Criada automaticamente pelo trigger após signUp.
-- ──────────────────────────────────────────────────────────
create table if not exists public.user_profiles (
  id             uuid        primary key references auth.users(id) on delete cascade,
  username       text        not null,
  full_name      text,
  role           text        not null default 'operador'
                             check (role in ('admin', 'operador', 'contribuinte')),
  contributor_id text,        -- preenchido apenas quando role = 'contribuinte'
  company        text        not null default 'softtech',
  is_active      boolean     not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

comment on table  public.user_profiles                is 'Perfis de usuário vinculados ao Supabase Auth';
comment on column public.user_profiles.role           is 'admin | operador | contribuinte';
comment on column public.user_profiles.contributor_id is 'ID do contribuinte (somente quando role = contribuinte)';
comment on column public.user_profiles.company        is 'Identificador da empresa (default: softtech)';

-- Índice para busca por username
create index if not exists idx_user_profiles_username
  on public.user_profiles (username);

-- Trigger updated_at (reutiliza função criada na migração 001)
create trigger trg_user_profiles_updated_at
  before update on public.user_profiles
  for each row execute function public.set_updated_at();

-- RLS em user_profiles
alter table public.user_profiles enable row level security;

-- Cada usuário lê seu próprio perfil; operadores e admins leem todos
create policy "Lê próprio perfil ou é operador — user_profiles"
  on public.user_profiles
  for select
  to authenticated
  using (
    auth.uid() = id
    or exists (
      select 1 from public.user_profiles p
      where p.id = auth.uid()
        and p.role in ('admin', 'operador')
        and p.is_active = true
    )
  );

-- Inserção: qualquer autenticado insere seu próprio perfil
-- (usado pela migração automática do sistema)
create policy "Insere próprio perfil — user_profiles"
  on public.user_profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

-- Atualização: somente admins alteram perfis
create policy "Admin atualiza perfis — user_profiles"
  on public.user_profiles
  for update
  to authenticated
  using (
    exists (
      select 1 from public.user_profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.user_profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );


-- ──────────────────────────────────────────────────────────
-- 2. TABELA: audit_log
--    Registra ações críticas para conformidade LGPD.
--    Imutável por design: somente INSERT, sem UPDATE/DELETE.
-- ──────────────────────────────────────────────────────────
create table if not exists public.audit_log (
  id          bigserial   primary key,
  user_id     uuid        references auth.users(id) on delete set null,
  username    text,
  action      text        not null,   -- 'login' | 'logout' | 'data_write' | 'password_change'
  resource    text,                   -- chave afetada (ex: 'supportMessages')
  details     jsonb       default '{}',
  ip_addr     text,                   -- opcional: preenchível por edge function futura
  created_at  timestamptz not null default now()
);

comment on table  public.audit_log           is 'Log de auditoria imutável (conformidade LGPD)';
comment on column public.audit_log.action    is 'login | logout | data_write | data_read | password_change';
comment on column public.audit_log.resource  is 'Chave do system_data ou recurso afetado';

-- Índices para consulta
create index if not exists idx_audit_log_user_id   on public.audit_log (user_id);
create index if not exists idx_audit_log_created_at on public.audit_log (created_at desc);
create index if not exists idx_audit_log_action     on public.audit_log (action);

alter table public.audit_log enable row level security;

-- Operadores e admins consultam logs
create policy "Operadores leem audit_log"
  on public.audit_log
  for select
  to authenticated
  using (
    exists (
      select 1 from public.user_profiles p
      where p.id = auth.uid()
        and p.role in ('admin', 'operador')
        and p.is_active = true
    )
  );

-- Qualquer autenticado pode inserir seu próprio log
create policy "Usuários inserem próprio log"
  on public.audit_log
  for insert
  to authenticated
  with check (user_id = auth.uid() or user_id is null);


-- ──────────────────────────────────────────────────────────
-- 3. RLS: system_data — FASE 1
--    Remove escrita anônima. Somente autenticados escrevem.
--    Leitura anônima mantida temporariamente (compatibilidade).
-- ──────────────────────────────────────────────────────────

-- Remover políticas de escrita pública (criadas em 001)
drop policy if exists "Inserção pública — system_data"  on public.system_data;
drop policy if exists "Atualização pública — system_data" on public.system_data;

-- Nova política: escrita somente para usuários autenticados
create policy "Escrita autenticada — system_data"
  on public.system_data
  for all
  to authenticated
  using (true)
  with check (true);

-- NOTA: A política "Leitura pública — system_data" foi mantida intencionalmente.
-- Ela será removida na FASE 2, após confirmar que 100% dos usuários
-- foram migrados para o Supabase Auth.
--
-- FASE 2 — executar quando todos os usuários estiverem no Supabase Auth:
-- ─────────────────────────────────────────────────────────────────────
-- drop policy if exists "Leitura pública — system_data" on public.system_data;
--
-- create policy "Leitura autenticada — system_data"
--   on public.system_data
--   for select
--   to authenticated
--   using (true);
-- ─────────────────────────────────────────────────────────────────────


-- ──────────────────────────────────────────────────────────
-- 4. FUNÇÃO AUXILIAR: registrar_acao
--    Insere entrada no audit_log de forma conveniente.
--    Chamável pelo frontend autenticado.
-- ──────────────────────────────────────────────────────────
create or replace function public.registrar_acao(
  p_action    text,
  p_resource  text    default null,
  p_details   jsonb   default '{}'
)
returns void
language plpgsql
security invoker   -- usa as permissões do chamador (respeita RLS)
as $$
begin
  insert into public.audit_log (user_id, action, resource, details)
  values (auth.uid(), p_action, p_resource, p_details);
end;
$$;

comment on function public.registrar_acao is
  'Registra uma ação no audit_log. Chamável pelo frontend autenticado.';


-- ──────────────────────────────────────────────────────────
-- 5. VERIFICAÇÃO FINAL
--    Confirmação de que as tabelas foram criadas corretamente.
-- ──────────────────────────────────────────────────────────
do $$
begin
  -- Verificar user_profiles
  if not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'user_profiles'
  ) then
    raise exception 'ERRO: tabela user_profiles não foi criada!';
  end if;

  -- Verificar audit_log
  if not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'audit_log'
  ) then
    raise exception 'ERRO: tabela audit_log não foi criada!';
  end if;

  -- Verificar que escrita anônima foi removida
  if exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'system_data'
      and policyname in ('Inserção pública — system_data', 'Atualização pública — system_data')
  ) then
    raise exception 'ERRO: políticas de escrita anônima ainda existem!';
  end if;

  raise notice '✅ Migração 002 aplicada com sucesso!';
  raise notice '   - Tabela user_profiles criada';
  raise notice '   - Tabela audit_log criada';
  raise notice '   - Escrita anônima removida do system_data';
  raise notice '   - FASE 1 completa. Para FASE 2, veja os comentários no script.';
end;
$$;
