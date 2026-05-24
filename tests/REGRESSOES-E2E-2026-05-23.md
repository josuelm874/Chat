# Regressões E2E — Dossiê e Prompt de Continuação

> Data do diagnóstico: 2026-05-23
> Sessão de origem: análise + Sessão A (RLS FASE 2) — chat-ui
> Status: **18 testes falhando, 3 flaky, 37 passando** em `npm test`
> Causa raiz: regressão introduzida pelo agente no commit `b1c672a` (2026-05-16) — **não** pelos patches da Sessão A
> Este documento serve simultaneamente como dossiê técnico e prompt copiável para a próxima sessão.

---

## 1. Resumo executivo

`npm test` na worktree atual produz:

```
  37 passed
  18 failed
   3 flaky   ← (passam em retry, mas instáveis)
       Total: 58 testes em 6 specs
```

Todos os 18 falham na **mesma causa raiz**:

```
Error: page.evaluate: Execution context was destroyed,
       most likely because of a navigation
   at seedOperadorSession (tests/helpers/seed.js:37:14)
   at <spec>:N:11
```

A razão é arquitetural, **não cosmética**: o helper `seedOperadorSession` (e `seedClienteSession`) injeta dados no `localStorage` via `page.evaluate()` **depois** de `page.goto('/operador/index.html')`. Como o operador exige sessão e redireciona para `/login`, o `evaluate` cai no contexto destruído pela navegação automática.

**Prova:** o próprio spec `01-auth.spec.js:38` documenta esse comportamento intencional:

```js
test('Sem autenticação redireciona para login', async ({ page }) => {
  await page.goto('/operador/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  // ... verifica que redirecionou pra login
});
```

---

## 2. Verificação de causa: foi o agente, não os patches da Sessão A

| Evidência | Conclusão |
|-----------|-----------|
| `git log tests/helpers/seed.js` retorna **apenas** o commit `5e9b2ce` (criação inicial) | Helper nunca foi tocado |
| `git blame -L 30,55 tests/helpers/seed.js` confirma autor original em todas as linhas | Sem regressão no helper |
| Os 18 testes falham no helper, **não** em `loginAsOperador` (modificado pela Sessão A) | Patches da Sessão A não causaram |
| Commit `b1c672a "fix: correções de testes E2E e bug de setores no contribuinte"` introduziu o syntax error em `04-funcionalidades.spec.js:241` que **já consertei nesta sessão** | Agente daquela sessão claramente não rodou os testes antes de commitar |

**Hipótese:** o agente em `b1c672a` modificou os specs assumindo um helper que funcionava (talvez funcionasse em alguma config local antiga) sem rodar `npm test` para validar. Os testes podem nunca ter rodado verdes na worktree limpa com Vercel + RLS aplicado.

---

## 3. Lista completa dos 18 testes falhos

Todos compartilham a mesma causa raiz (`seed.js:37` execution context destroyed). Agrupados por spec:

### `01-auth.spec.js`
- L47 — `Logout limpa sessão`

### `02-mensagens.spec.js`
- L88  — `Botão de enviar está presente e clicável`
- L106 — `Cliente envia mensagem e aparece no localStorage do operador`
- L138 — `Operador responde e mensagem vai ao localStorage do cliente`

### `03-arquivos.spec.js`
- L150 — `Arquivo de imagem enviado pelo operador grava no localStorage`

### `04-funcionalidades.spec.js`
- L74  — `Emojis › Botão de emoji está visível no operador`
- L116 — `Busca › Busca por termo inexistente não exibe contatos da seed`
- L133 — `Busca › Campo de busca de mensagens no chat está presente`
- L162 — `Navegação entre Seções › Todos os botões de seção do sidebar clicam sem erro JS`
- L196 — `Navegação entre Seções › Badge de não lidas aparece quando há mensagem não lida`
- L212 — `Navegação entre Seções › Seção de suporte (padrão) mostra lista de contatos`

### `06-chat-interno.spec.js`
- L14  — `Chat Interno › Seção de mensagens internas abre ao clicar no botão`
- L34  — `Chat Interno › Mensagem interna injetada permanece no localStorage`
- L79  — `Painel Extras › Clicar em contato abre painel com informações`
- L95  — `Painel Extras › Área de mensagens do operador (chatMessagesOp) existe e está no DOM`
- L104 — `Painel Extras › Seção de agenda/calendário carrega sem erro JS`
- L130 — `Painel Extras › Seção de recrutamento exibe candidatura injetada`
- L168 — `Painel Extras › Zero erros JavaScript críticos na inicialização do operador`

## 4. Testes flaky (passam em retry, mas instáveis)

Provavelmente mesma causa, mascarada por timing. Devem ser estabilizados pelo mesmo fix:

- `01-auth.spec.js:30` — `Sessão injetada exibe painel do operador`
- `02-mensagens.spec.js:19` — `Operador vê lista de contatos com ao menos um item`
- `03-arquivos.spec.js:141` — `Input de arquivo do operador existe no DOM`

---

## 5. Fix proposto

A correção **central** é no helper, não em cada spec. Atualmente:

```js
// tests/helpers/seed.js — ESTADO ATUAL (quebrado)
async function seedOperadorSession(page) {
  await page.evaluate((ids) => {
    // ... seta localStorage ...
  }, IDS);
}
```

E os specs fazem:

```js
// Padrão atual em todos os 18 specs falhos
await page.goto('/operador/index.html', { waitUntil: 'domcontentloaded' });
await seedOperadorSession(page);   // ← cai em contexto destruído
await page.reload();
```

### Opção 5.1 (recomendada): usar `addInitScript` no helper

`page.addInitScript` injeta JavaScript **antes** de qualquer navegação carregar. Ele persiste para todas as navegações subsequentes daquele contexto. Refatoração:

```js
// tests/helpers/seed.js
async function seedOperadorSession(page) {
  const payload = { /* mesmo conteúdo de hoje */ };

  await page.addInitScript((data) => {
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('currentUser', JSON.stringify(data.adminUser));
    localStorage.setItem('clientName', data.adminUser.fullName);
    localStorage.setItem('savedUsername', 'adm');
    localStorage.setItem('savedPassword', btoa('test_e2e_pass'));
    localStorage.setItem('_session_at', Date.now().toString());
    // ... resto do conteúdo que hoje vai no evaluate
  }, payload);
}
```

Os specs passam a chamar `seedOperadorSession` **antes** do `goto`:

```js
test('...', async ({ page }) => {
  await seedOperadorSession(page);                                    // ← antes
  await page.goto('/operador/index.html', { waitUntil: 'domcontentloaded' });
  // sem precisar de page.reload()
});
```

**Vantagens:**
- `localStorage` já populado quando o script da página roda → redirect-on-no-auth não dispara
- Elimina o `await page.reload()` redundante e o `waitForTimeout(1500)` que mascarava timing
- Funciona para ambos: `seedOperadorSession` e `seedClienteSession`

**Custo:** alterar 1 helper + grep/replace nos 18+3 specs (padrão consistente).

### Opção 5.2 (paliativa): navegar pra página neutra antes do seed

Manter o `evaluate`, mas garantir que o contexto não navegue:

```js
async function seedOperadorSession(page) {
  // Página neutra (about:blank) onde localStorage do origin ainda funciona se baseURL bater
  await page.goto('/login/index.html', { waitUntil: 'domcontentloaded' });
  await page.evaluate((ids) => { /* ... */ }, IDS);
  // Spec chama page.goto('/operador/...') depois
}
```

**Desvantagem:** os specs precisam ser revisados para não fazer `page.goto('/operador/')` antes do seed. Mais invasivo que 5.1.

### Opção 5.3 (NÃO recomendada): aumentar `waitForTimeout`

Aumentar o sleep não resolve — o contexto navega, ponto. Apenas mascara em alguns retries → produz mais flaky.

---

## 6. Smoke test após aplicar o fix

```bash
# Limpar artefatos de testes anteriores
rm -rf test-results tests/report

# Rodar apenas o spec mais simples primeiro
npx playwright test tests/specs/01-auth.spec.js --reporter=list

# Se passar, rodar a suite completa
npm test

# Resultado esperado:
#   55+ passed
#   0 failed
#   ≤2 flaky (toleráveis)
```

---

## 7. Riscos colaterais a observar durante o fix

1. **Testes que NÃO usam helper** (3 dos 37 que já passam): não mexer.
2. **Spec `01-auth.spec.js:38` `Sem autenticação redireciona`** — depende do comportamento de não ter sessão. NÃO chamar seed nesse teste. Confirmar isolamento entre testes (fullyParallel é false e retries=1, mas vale validar contexto fresh por test).
3. **Variáveis injetadas além de `currentUser`** — o helper já injeta `savedUsername`, `savedPassword`, `clientName`. Replicar 1:1 no `addInitScript` para não perder cobertura.
4. **Patches da Sessão A** — `loginAsOperador` agora aguarda `_waitForAuthMigration` por até 3s. **Não afeta os specs** (que não passam pelo login flow), mas se o seed começar a usar `page.goto('/login/')` (Opção 5.2), pode introduzir delay de 3s. Preferir Opção 5.1.

---

## 8. PROMPT COPIÁVEL para a próxima sessão Claude Code

> Cole tudo abaixo desta linha em uma nova sessão Claude no diretório do projeto chat-ui.

---

Estou retomando o projeto chat-ui (single-tenant SoftTech). Há 18 testes Playwright falhando + 3 flaky com a mesma causa raiz. O dossiê completo está em `tests/REGRESSOES-E2E-2026-05-23.md`. Leia-o primeiro.

**Objetivo desta sessão:** consertar os 18 testes e estabilizar os 3 flaky aplicando a Opção 5.1 do dossiê (refatorar `tests/helpers/seed.js` para usar `page.addInitScript` em vez de `page.evaluate`, e atualizar os 21 specs para chamar `seedOperadorSession`/`seedClienteSession` **antes** do `page.goto`).

**Restrições obrigatórias:**

1. Não toque em código de produção (`src/`). O fix é exclusivamente em `tests/`.
2. Não modifique `playwright.config.js` (`reuseExistingServer: true` já basta).
3. Preserve 100% do payload que o helper hoje injeta no localStorage (`currentUser`, `clientName`, `savedUsername`, `savedPassword`, `isAuthenticated`, `_session_at`, contribuintes seed, contatos, mensagens seed, etc.).
4. Mantenha `fullyParallel: false` e `retries: 1` da config atual.
5. Antes de modificar qualquer spec, leia `tests/helpers/seed.js` inteiro e mapeie todos os call-sites com:
   ```bash
   grep -nE "seed(Operador|Cliente)Session" tests/specs/*.spec.js
   ```

**Critério de aceitação (sem o qual a sessão não termina):**

- `npm test` → exit 0
- 18+ testes hoje falhos passam
- 3 testes hoje flaky deixam de ser flaky
- 0 novos testes quebrados
- 0 mudanças em `src/`

**Como começar:**

1. Leia `tests/REGRESSOES-E2E-2026-05-23.md` integral
2. Confirme reprodução: `npm test 2>&1 | tail -30` (deve mostrar 18 failed)
3. Aplique Opção 5.1: refatore `seedOperadorSession` e `seedClienteSession` para `addInitScript`
4. Atualize chamadas nos 6 specs (padrão: trocar ordem para `seed → goto`, remover `page.reload()` redundante onde aplicável)
5. Rode `npm test` localmente até zerar falhas
6. Commit único: `fix(tests): refactor seed helpers to use addInitScript (closes regression from b1c672a)`

**Contexto adicional disponível no vault ARCHON:**

- `05 - ARCHON Core/Auditorias/2026-05-23-chat-ui-analise-completa.md` — auditoria completa do projeto
- `05 - ARCHON Core/Decisoes.md` — decisão de manter single-tenant SoftTech (2026-05-23)
- `05 - ARCHON Core/Projetos/chat-ui.md` — frentes priorizadas; esta sessão é "Sessão A.5 — Fix dos testes E2E"

Não rode commits intermediários nem `git push` sem confirmação. Reporte os diffs antes de commitar.

---

*Relacionados (vault): [[2026-05-23-chat-ui-analise-completa]], [[chat-ui]], [[Decisoes]]*
