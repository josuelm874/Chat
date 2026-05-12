-- ============================================================
-- Chat UI Soft Tech — Schema inicial do Supabase
-- Execute no SQL Editor do Supabase Dashboard (uma vez)
-- ============================================================

-- ──────────────────────────────────────────────────────────
-- 1. TABELA PRINCIPAL: system_data
--    Armazena todos os dados do chat (mensagens, usuários,
--    contribuintes, contatos) como pares chave→JSONB.
--    A sincronização é gerenciada pelo supabase-sync.js.
-- ──────────────────────────────────────────────────────────
create table if not exists public.system_data (
  key        text        primary key,
  value      jsonb       not null default '{}',
  updated_at timestamptz not null default now()
);

-- Índice para ordenação e filtros por data
create index if not exists idx_system_data_updated_at
  on public.system_data (updated_at desc);

-- Comentários descritivos
comment on table  public.system_data            is 'Armazenamento central de dados do Chat UI (localStorage ↔ Supabase)';
comment on column public.system_data.key        is 'Chave do localStorage (ex: supportMessages, contributors)';
comment on column public.system_data.value      is 'Valor JSONB — pode ser array, objeto ou primitivo';
comment on column public.system_data.updated_at is 'Timestamp da última atualização (usado para sync bidirecional)';

-- ──────────────────────────────────────────────────────────
-- 2. TABELA NCM: validacao_ncm
--    Resultados de validação produto×NCM gerados pelo
--    script Python correlacao_ncm.py.
-- ──────────────────────────────────────────────────────────
create table if not exists public.validacao_ncm (
  id        bigserial   primary key,
  produto   text        not null,
  ncm       text        not null,
  resultado text        not null,  -- 'sim' | 'nao' | 'inconclusivo'
  detalhe   text,
  created_at timestamptz not null default now()
);

-- Índice único para evitar duplicatas produto+ncm
create unique index if not exists idx_validacao_ncm_produto_ncm
  on public.validacao_ncm (produto, ncm);

-- Índices de busca
create index if not exists idx_validacao_ncm_produto
  on public.validacao_ncm (produto);
create index if not exists idx_validacao_ncm_ncm
  on public.validacao_ncm (ncm);
create index if not exists idx_validacao_ncm_resultado
  on public.validacao_ncm (resultado);

comment on table  public.validacao_ncm            is 'Validações produto×NCM geradas pelo script Python';
comment on column public.validacao_ncm.produto    is 'Nome do produto (campo livre, normalizado)';
comment on column public.validacao_ncm.ncm        is 'Código NCM com 8 dígitos (zero-padded)';
comment on column public.validacao_ncm.resultado  is 'sim | nao | inconclusivo';
comment on column public.validacao_ncm.detalhe    is 'Explicação detalhada do resultado';


-- ──────────────────────────────────────────────────────────
-- 3. ROW LEVEL SECURITY (RLS)
--    Política: acesso público anônimo para leitura e escrita.
--    A anon key do Supabase é pública por design; a segurança
--    real vem das políticas abaixo — qualquer pessoa com a URL
--    pode ler/escrever, mas não pode apagar dados alheios.
--    Para produção com múltiplos clientes, adicione políticas
--    baseadas em JWT (Supabase Auth) futuramente.
-- ──────────────────────────────────────────────────────────

-- Habilitar RLS nas tabelas
alter table public.system_data   enable row level security;
alter table public.validacao_ncm enable row level security;

-- ── Políticas system_data ──────────────────────────────────

-- Leitura: qualquer usuário anônimo pode ler
create policy "Leitura pública — system_data"
  on public.system_data
  for select
  to anon, authenticated
  using (true);

-- Inserção: qualquer usuário anônimo pode inserir
create policy "Inserção pública — system_data"
  on public.system_data
  for insert
  to anon, authenticated
  with check (true);

-- Atualização: qualquer usuário anônimo pode atualizar
create policy "Atualização pública — system_data"
  on public.system_data
  for update
  to anon, authenticated
  using (true)
  with check (true);

-- ── Políticas validacao_ncm ────────────────────────────────

-- Leitura: qualquer um pode consultar validações
create policy "Leitura pública — validacao_ncm"
  on public.validacao_ncm
  for select
  to anon, authenticated
  using (true);

-- Inserção/atualização: apenas usuários autenticados (script Python)
-- Para o script Python, use a SERVICE_ROLE key, nunca a anon key.
create policy "Escrita autenticada — validacao_ncm"
  on public.validacao_ncm
  for all
  to authenticated
  using (true)
  with check (true);


-- ──────────────────────────────────────────────────────────
-- 4. REALTIME
--    Habilita notificações em tempo real para a tabela
--    system_data (substitui o polling de 2s do app).
-- ──────────────────────────────────────────────────────────
alter publication supabase_realtime add table public.system_data;


-- ──────────────────────────────────────────────────────────
-- 5. FUNÇÃO HELPER: updated_at automático
--    Atualiza updated_at sempre que uma linha for modificada.
-- ──────────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_system_data_updated_at
  before update on public.system_data
  for each row execute function public.set_updated_at();
