-- ============================================================
-- Chat UI Soft Tech — Migração 003: RLS FASE 2 (fechar leitura anônima)
-- ============================================================
-- APLICAR NO: Supabase Dashboard → SQL Editor
--
-- PRÉ-REQUISITOS (obrigatórios):
--   1. Migração 002 já aplicada (Supabase Auth + escrita autenticada)
--   2. 100% dos usuários ativos já migraram (1 login por usuário pós-deploy do auth.js)
--   3. Página pública /publico/vagas NÃO consulta Supabase
--      (validado em 2026-05-23 — vagas-script.js lê apenas localStorage)
--   4. Build do frontend em produção contém os patches que aguardam sessão antes de
--      chamar supabaseSync.load / syncAll (commit que acompanha esta migração)
--
-- Esta migração:
--   1. Remove leitura anônima de system_data (vazamento LGPD)
--   2. Mantém leitura pública de validacao_ncm (consulta NCM é por design pública)
--   3. Não toca user_profiles nem audit_log (já restritos pela 002)
--
-- ROLLBACK: ver bloco comentado no fim do arquivo.
-- ============================================================


-- ──────────────────────────────────────────────────────────
-- 1. system_data — remover leitura anônima
-- ──────────────────────────────────────────────────────────

drop policy if exists "Leitura pública — system_data" on public.system_data;

create policy "Leitura autenticada — system_data"
  on public.system_data
  for select
  to authenticated
  using (true);


-- ──────────────────────────────────────────────────────────
-- 2. validacao_ncm — mantém leitura pública intencionalmente
-- ──────────────────────────────────────────────────────────
-- Consulta NCM é referência fiscal pública. Manter `for select to anon` é correto.
-- Nenhuma ação aqui — apenas registrando a decisão explicitamente.


-- ──────────────────────────────────────────────────────────
-- 3. VERIFICAÇÃO FINAL
-- ──────────────────────────────────────────────────────────
do $$
begin
  -- Confirmar que leitura anônima foi removida
  if exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'system_data'
      and policyname = 'Leitura pública — system_data'
  ) then
    raise exception 'ERRO: política de leitura anônima ainda existe em system_data';
  end if;

  -- Confirmar que política autenticada foi criada
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'system_data'
      and policyname = 'Leitura autenticada — system_data'
  ) then
    raise exception 'ERRO: política de leitura autenticada não foi criada em system_data';
  end if;

  raise notice '✅ Migração 003 aplicada com sucesso!';
  raise notice '   - Leitura anônima removida de system_data';
  raise notice '   - Leitura agora exige sessão Supabase Auth';
  raise notice '   - validacao_ncm mantém leitura pública (intencional)';
end;
$$;


-- ──────────────────────────────────────────────────────────
-- ROLLBACK (executar apenas se a aplicação quebrar pós-deploy)
-- ──────────────────────────────────────────────────────────
-- drop policy if exists "Leitura autenticada — system_data" on public.system_data;
--
-- create policy "Leitura pública — system_data"
--   on public.system_data
--   for select
--   to anon, authenticated
--   using (true);
