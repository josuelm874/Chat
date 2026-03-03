# Design System Rules – Chat UI Sercon

Documento de regras para integração de designs do Figma (Model Context Protocol) e consistência visual do projeto. O design segue referências **Pinterest (pins)**: sidebar minimalista, glassmorphism, profundidade, tema claro/escuro.

---

## 1. Design System Structure

### 1.1 Token Definitions

**Onde estão:** `src/operador/operador-style.css` (e espelhados em estilos inline em `src/operador/index.html`).

**Formato:** CSS Custom Properties em `:root` e `[data-theme="light"]` / `[data-theme="dark"]`. Sem ferramenta de transformação (tokens são usados diretamente no CSS).

**Estrutura dos tokens:**

```css
/* Tema claro (default) – operador-style.css ~linhas 297-343 */
:root, [data-theme="light"] {
  /* Sidebar */
  --sidebar-bg: #0f0f0f;
  --sidebar-text: #e5e5e5;
  --sidebar-text-muted: #9ca3af;
  --sidebar-hover-bg: rgba(255,255,255,0.06);
  --sidebar-active-bg: rgba(37,99,235,0.2);
  --sidebar-active-bar: #2563eb;
  --sidebar-label-bg: #0f0f0f;
  --sidebar-shadow: 0 2px 4px rgba(0,0,0,0.08), ...;

  /* Superfícies */
  --chat-app-bg: #f5f5f5;
  --main-bg: #ffffff;
  --card-bg: #ffffff;
  --card-border: #e5e7eb;
  --block-bg: #ffffff;

  /* Texto */
  --text-primary: #1a1a1a;
  --text-secondary: #6b7280;
  --header-text: #1f2937;
  --header-border: #2563eb;

  /* Acento (azul) */
  --accent: #2563eb;
  --accent-hover: #1d4ed8;
  --accent-soft: rgba(37,99,235,0.08);
  --accent-soft-hover: rgba(37,99,235,0.12);

  /* Bordas e sombras */
  --border-subtle: #e5e7eb;
  --shadow-depth: 0 2px 4px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.08), ...;
  --card-hover-shadow: 0 4px 8px rgba(0,0,0,0.06), ...;

  /* Figma-like tokens */
  --radius-sm: 8px;
  --radius-md: 10px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 12px;
  --space-lg: 16px;
  --space-xl: 24px;

  /* Status (validação / online) */
  --status-success: #10b981;
  --status-success-bg: #f0fdf4;
  --status-error: #ef4444;
  --status-error-bg: #fef2f2;

  /* Glass (Neo-Apple / pin) */
  --glass-bg: rgba(255,255,255,0.72);
  --glass-bg-solid: rgba(255,255,255,0.92);
  --glass-border: rgba(255,255,255,0.65);
  --glass-inset: rgba(255,255,255,0.85);
}
```

**Tema escuro:** `[data-theme="dark"]` sobrescreve as mesmas variáveis (ex.: `--main-bg: #1a1a1a`, `--accent: #3b82f6`, `--glass-*` adaptados para fundo escuro).

**Regra para novos estilos:** usar sempre variáveis (ex.: `var(--header-text)`, `var(--accent-soft)`). Evitar cores hex/rgba fixas fora de `:root` / `[data-theme="dark"]`.

---

### 1.2 Component Library

**Onde estão:** componentes são **blocos HTML** com classes CSS em `src/operador/index.html` e estilos em `src/operador/operador-style.css`. Não há React/Vue; não há Storybook.

**Arquitetura:**  
- Um único HTML principal (`index.html`) com seções mostradas/ocultas por classe `.active` e JS.  
- Componentes reutilizáveis por classe (ex.: `.sidebar`, `.chat-list`, `.message-input`, `.contact`, `.task-item`, `.ncm-*`).

**Padrão de “componente”:**
- Container: ex. `.chat-container`, `.admin-container`, `.job-management-container`.
- Filhos com nomes semânticos: `.chat-list`, `.chat-main`, `.message`, `.contact`, `.search-bar`, etc.
- Estados: `.active`, `.hover` (via CSS), `.online`, `.has-unread`, `.selected`, `.completed`.

**Documentação:** este arquivo e comentários no CSS (ex.: `/* ==================== SIDEBAR (PIN 1) ==================== */`).

---

### 1.3 Frameworks & Libraries

| Aspecto | Tecnologia |
|--------|------------|
| UI | HTML5, CSS3, JavaScript (vanilla) |
| Styling | CSS puro + Custom Properties; estilos inline em `<style>` em `index.html` para algumas seções (ex.: job management) |
| Build | Nenhum bundler; servir estático (ex.: `npx serve .`) |
| Fontes | Google Fonts: Inter (principal), Poppins (login/dominium) |
| Ícones | Boxicons 2.1.4 (CDN) |
| Outros | Lottie (emojis), jsPDF, html2canvas |

---

### 1.4 Asset Management

**Onde estão:** `assets/images/` (branding, avatares). Dados de runtime em `assets/data/` (ex.: `tabela-ncm.js`).

**Referência no HTML:** caminhos relativos ao HTML, ex.: `../../assets/images/branding/logo.png`, `../../assets/images/avatars/profile-1.png`.

**Otimização:** fallback inline SVG em `onerror` para imagens que falharem. Não há pipeline de otimização (minificação de imagens, etc.).  
**CDN:** fontes e Boxicons via Google Fonts e unpkg; sem CDN próprio para assets do projeto.

---

### 1.5 Icon System

**Fonte:** Boxicons – `https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css`.

**Uso no HTML:** `<i class="bx bxs-*"></i>` ou `<i class="bx bx-*"></i>`. Classe utilitária `.bxr` no CSS força `font-family: 'boxicons'` quando necessário.

**Convenção de nome:**  
- `bx` = outline; `bxs` = solid.  
- Nomes como `bx-message`, `bx-calendar`, `bx-cog`, `bx-sun`, `bx-moon`, `bx-send`, `bx-search`, `bx-user`, etc.

**Emojis:** Noto Color Emoji + Lottie para animações; não confundir com ícones da UI.

---

### 1.6 Styling Approach

**Metodologia:** CSS global + classes utilitárias/semânticas. Um arquivo principal por interface: `operador-style.css` para operador.

**Global:** reset em `* { margin: 0; padding: 0; box-sizing: border-box; }`, `body` com `font-family` e `background: var(--chat-app-bg)`. Tema aplicado em `html`/`body` via `data-theme` (claro/escuro).

**Responsivo:** media queries no final de `operador-style.css` (ex.: `@media (max-width: 768px)`, `@media (max-height: ...)`) para layout da chat-list, painéis e fontes.

**Regras para novo CSS:**
- Preferir `var(--*)` para cor, sombra, borda e radius.
- Usar tokens de espaçamento/radius: `var(--space-md)`, `var(--radius-lg)`.
- Transições curtas (0.2s–0.3s) para hover/focus.
- Glass: `backdrop-filter: blur(...)` + `var(--glass-bg)` / `var(--glass-border)`.

---

### 1.7 Project Structure

```
Chat UI/
├── assets/
│   ├── data/          # tabela-ncm.js, tabela-tipi.js
│   └── images/
│       ├── avatars/
│       └── branding/
├── data/              # tabela-ncm.json, tabela-tipi.json
├── src/
│   ├── shared/        # config.js, constants.js, utils.js, supabase-sync.js
│   ├── operador/      # index.html, operador-style.css, operador-script.js, boot*
│   ├── cliente/       # index.html, cliente-style.css, cliente-script.js, boot*
│   ├── publico/       # vagas.html
│   └── modules/ncm/   # ncm-motor.js, ncm-tabs.js
├── README.md
└── DESIGN_SYSTEM_RULES.md  (este arquivo)
```

**Padrão por feature:** cada “app” (operador, cliente, público) tem seu `index.html` + `*-style.css` + `*-script.js`. Módulos compartilhados em `shared/` e `modules/`.

---

## 2. Integração Figma (MCP)

### 2.1 Configuração MCP

O projeto está preparado para usar o **Figma MCP** no Cursor:

- **Servidor remoto (figma):** `https://mcp.figma.com/mcp` – OAuth no Cursor.  
- **Servidor desktop (figma-desktop):** `http://127.0.0.1:3845/mcp` – requer app Figma aberto, Dev Mode e “Enable desktop MCP server”.

Detalhes em: `FIGMA-MCP-CONFIGURACAO.md` (na raiz do repositório Dev).

### 2.2 Mapeamento Figma → Código (tokens)

Ao criar ou importar um design no Figma, alinhe com os tokens existentes:

| Figma (sugestão) | Token CSS no projeto |
|------------------|----------------------|
| Color / Primary | `--accent`, `--accent-hover` |
| Color / Primary / Soft | `--accent-soft`, `--accent-soft-hover` |
| Color / Background / Main | `--main-bg`, `--chat-app-bg` |
| Color / Text / Primary | `--header-text`, `--text-primary` |
| Color / Text / Secondary | `--text-secondary` |
| Color / Border | `--border-subtle`, `--card-border` |
| Color / Success, Error | `--status-success`, `--status-error` (+ bg) |
| Radius / Small, Medium, Large | `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl` |
| Spacing / 4, 8, 12, 16, 24 | `--space-xs` … `--space-xl` |
| Shadow / Soft, Strong | `--shadow-depth`, `--shadow-depth-strong`, `--card-hover-shadow` |
| Effect / Glass | `--glass-bg`, `--glass-border`, `--glass-inset` |
| Sidebar (dark bar) | `--sidebar-bg`, `--sidebar-text`, `--sidebar-active-bar`, `--sidebar-shadow` |

Use esses nomes (ou um alias claro para eles) no Figma para que a exportação ou o Dev Mode mantenha consistência com o código.

### 2.3 Intenção de design (pins)

Ao criar o design system no Figma com base nos pins:

1. **Sidebar:** barra vertical escura (~72px), ícones centralizados, rótulos em hover (pill + barra de seleção à esquerda no item ativo). Cores: `--sidebar-*`.
2. **Tema:** suporte claro/escuro; toggle na sidebar; todos os componentes devem usar variáveis para cor/fundo/borda.
3. **Containers:** cards e painéis com fundo glass (`--glass-bg`), borda sutil (`--glass-border`), sombra (`--shadow-depth`). Hover: `--card-hover-shadow`.
4. **Cabeçalhos:** borda inferior ou barra de destaque com `--header-border`; título com `--header-text`.
5. **Tabs:** estilo “pin” – pill, hover com `--accent-soft`, ativo com `--accent` ou barra inferior.
6. **Botões primários:** `--accent`, hover `--accent-hover`; secundários: `--accent-soft` com texto `--accent`.
7. **Inputs:** borda `--border-subtle`, focus com `--accent` e ring `--accent-soft`.
8. **Listas (contacts, tasks):** itens com hover `--accent-soft`, ativo `--accent`; radius `--radius-md` ou `--radius-lg`.
9. **Data/hora:** bloco unificado (data + relógio analógico/digital) com mesmo estilo glass e tokens acima.
10. **Tipografia:** Inter para UI; pesos 400, 500, 600, 700. Títulos: 600–700; corpo: 14px; secundário: 12px com `--text-secondary`.

Criar no Figma:
- **Estilos de cor** ligados semanticamente aos tokens acima.
- **Componentes:** Sidebar, ChatList, MessageBubble, Input+Send, Card (glass), Tabs (pin), Button Primary/Secondary, Toggle Theme.
- **Variantes:** light/dark onde fizer sentido (ou um único componente que use “semantic tokens” que o código mapeia para light/dark).

### 2.4 Uso no Cursor com Figma

- **Implementar a partir de um link:** “Implementar o design deste link do Figma: [URL do frame]” – o agente deve usar os tokens e componentes descritos neste documento.
- **Code Connect:** se o Figma MCP retornar mapeamentos, preferir classes/estrutura já usadas em `index.html` e `operador-style.css`.
- **Novos componentes:** ao adicionar telas ou componentes, manter nomes de classes e tokens conforme esta especificação para preservar o design elegante e alinhado aos pins.

---

## 3. Resumo para a IA

- **Tokens:** sempre em `operador-style.css` em `:root` e `[data-theme="dark"]`. Usar apenas variáveis em estilos novos.
- **Componentes:** HTML em `src/operador/index.html`, estilos em `src/operador/operador-style.css`; padrão container + filhos com classes semânticas.
- **Ícones:** Boxicons (`bx` / `bxs`); fontes: Inter (UI), Poppins (login).
- **Figma:** mapear cores/radius/spacing do Figma para os tokens desta tabela; seguir a intenção “pin” (sidebar, glass, profundidade, tema claro/escuro).
- **Assets:** `../../assets/images/...` a partir de `src/operador/`.

Ao gerar ou alterar UI, seguir este design system e, quando o usuário fornecer link ou arquivo Figma, alinhar às regras e tokens aqui definidos.
