# Design System – Chat UI Sercon

Documentação do sistema de design baseado em tokens CSS e referências Pinterest (pins).

---

## 1. Tokens CSS

### 1.1 Localização

- **Arquivo**: `src/operador/operador-style.css`
- **Escopo**: `:root` e `[data-theme="light"]` / `[data-theme="dark"]`

### 1.2 Cores – Sidebar

| Token | Light | Dark |
|-------|-------|------|
| `--sidebar-bg` | #0f0f0f | #0a0a0a |
| `--sidebar-text` | #e5e5e5 | #f3f4f6 |
| `--sidebar-text-muted` | #9ca3af | #9ca3af |
| `--sidebar-hover-bg` | rgba(255,255,255,0.06) | — |
| `--sidebar-active-bg` | rgba(37,99,235,0.2) | — |
| `--sidebar-active-bar` | #2563eb | #3b82f6 |

### 1.3 Cores – Superfícies

| Token | Descrição |
|-------|-----------|
| `--chat-app-bg` | Fundo da aplicação |
| `--main-bg` | Fundo principal |
| `--card-bg` | Fundo de cards |
| `--card-border` | Borda de cards |
| `--block-bg` | Fundo de blocos |

### 1.4 Cores – Texto

| Token | Descrição |
|-------|-----------|
| `--text-primary` | Texto principal |
| `--text-secondary` | Texto secundário |
| `--header-text` | Títulos |
| `--header-border` | Borda de cabeçalhos |

### 1.5 Cores – Acento

| Token | Descrição |
|-------|-----------|
| `--accent` | Azul principal |
| `--accent-hover` | Hover |
| `--accent-soft` | Fundo suave |
| `--accent-soft-hover` | Hover suave |

### 1.6 Bordas e Sombras

| Token | Descrição |
|-------|-----------|
| `--border-subtle` | Borda sutil |
| `--shadow-depth` | Sombra padrão |
| `--card-hover-shadow` | Sombra no hover |

### 1.7 Espaçamento e Radius

| Token | Valor |
|-------|-------|
| `--space-xs` | 4px |
| `--space-sm` | 8px |
| `--space-md` | 12px |
| `--space-lg` | 16px |
| `--space-xl` | 24px |
| `--radius-sm` | 8px |
| `--radius-md` | 10px |
| `--radius-lg` | 12px |
| `--radius-xl` | 16px |

### 1.8 Status

| Token | Descrição |
|-------|-----------|
| `--status-success` | Verde |
| `--status-success-bg` | Fundo verde |
| `--status-error` | Vermelho |
| `--status-error-bg` | Fundo vermelho |

### 1.9 Glass (Glassmorphism)

| Token | Descrição |
|-------|-----------|
| `--glass-bg` | Fundo translúcido |
| `--glass-bg-solid` | Fundo mais opaco |
| `--glass-border` | Borda |
| `--glass-inset` | Sombra interna |

---

## 2. Componentes

### 2.1 Padrão

- **Container**: `.chat-container`, `.admin-container`, etc.
- **Filhos**: classes semânticas (`.chat-list`, `.chat-main`, `.message`)
- **Estados**: `.active`, `.online`, `.has-unread`, `.selected`, `.completed`

### 2.2 Sidebar

- Barra vertical (~72px)
- Ícones centralizados
- Rótulos em hover (tooltip bar estilo Arch)
- Item ativo: pill + barra à esquerda

### 2.3 Cards

- Fundo: `var(--glass-bg)` ou `var(--card-bg)`
- Borda: `var(--card-border)`
- Sombra: `var(--shadow-depth)`
- Hover: `var(--card-hover-shadow)`

### 2.4 Tabs

- Estilo "pin": pill, hover com `--accent-soft`, ativo com `--accent` ou barra inferior

### 2.5 Botões

- **Primário**: `--accent`, hover `--accent-hover`
- **Secundário**: `--accent-soft` com texto `--accent`

---

## 3. Tipografia

| Uso | Fonte | Pesos |
|-----|-------|-------|
| UI | Inter | 300, 400, 500, 600, 700 |
| Login | Poppins | — |
| Títulos | 600–700 | — |
| Corpo | 14px | — |
| Secundário | 12px | `--text-secondary` |

---

## 4. Ícones

- **Fonte**: Boxicons 2.1.4
- **CDN**: `https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css`
- **Uso**: `<i class="bx bx-*"></i>` ou `<i class="bx bxs-*"></i>`
- **Emojis**: Noto Color Emoji + Lottie (animações)

---

## 5. Responsividade

- Media queries em `operador-style.css`
- Ex.: `@media (max-width: 768px)` para layout mobile
- Chat list, painéis e fontes adaptam-se

---

## 6. Regras para Novos Estilos

1. Usar sempre `var(--*)` para cor, sombra, borda, radius
2. Usar tokens de espaçamento: `var(--space-md)`, `var(--radius-lg)`
3. Transições curtas (0.2s–0.3s) para hover/focus
4. Glass: `backdrop-filter: blur(...)` + `var(--glass-bg)` / `var(--glass-border)`

---

## 7. Integração Figma

Ver `FIGMA_DESIGN_SYSTEM_GUIDE.md` e `DESIGN_SYSTEM_RULES.md` na raiz do projeto para mapeamento Figma → tokens e intenção de design.

---

*Design System – Chat UI Sercon*
