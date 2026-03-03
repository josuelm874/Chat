# Guia: Design System no Figma (baseado nos pins)

Este guia descreve como criar no **Figma** um design system elegante alinhado ao Chat UI Sercon e às referências dos pins (sidebar minimalista, glass, profundidade, tema claro/escuro).

---

## 1. Preparar o arquivo no Figma

1. Crie um **novo arquivo** ou use um existente.
2. Crie uma **página** chamada `Design System` ou `Tokens`.
3. (Opcional) Ative o **Dev Mode** (Shift + D) para usar o MCP desktop e Code Connect depois.

---

## 2. Variáveis (tokens) no Figma

No Figma: **Design** (painel esquerdo) → **Local variables** (ou **Variables** no menu).

### 2.1 Modos de coleção (temas)

- Crie uma coleção **"Theme"** (ou "Tema").
- Adicione dois **modes**: `light` e `dark`.  
  Assim você espelha o `[data-theme="light"]` e `[data-theme="dark"]` do código.

### 2.2 Variáveis de cor

Crie grupos e variáveis com nomes que você consiga mapear para o CSS (veja `DESIGN_SYSTEM_RULES.md`):

| Grupo (Figma) | Variável | Light (valor exemplo) | Dark (valor exemplo) |
|---------------|----------|------------------------|---------------------|
| **Sidebar** | `sidebar/bg` | `#0F0F0F` | `#0A0A0A` |
| | `sidebar/text` | `#E5E5E5` | `#F3F4F6` |
| | `sidebar/text-muted` | `#9CA3AF` | `#9CA3AF` |
| | `sidebar/active-bar` | `#2563EB` | `#3B82F6` |
| **Surface** | `main-bg` | `#FFFFFF` | `#1A1A1A` |
| | `chat-app-bg` | `#F5F5F5` | `#111111` |
| | `card-border` | `#E5E7EB` | `#333333` |
| **Text** | `header-text` | `#1F2937` | `#F3F4F6` |
| | `text-secondary` | `#6B7280` | `#9CA3AF` |
| **Accent** | `accent` | `#2563EB` | `#3B82F6` |
| | `accent-hover` | `#1D4ED8` | `#2563EB` |
| | `accent-soft` | `#2563EB` 8% opacidade | `#3B82F6` 12% opacidade |
| **Status** | `status-success` | `#10B981` | `#34D399` |
| | `status-error` | `#EF4444` | `#F87171` |
| **Border** | `border-subtle` | `#E5E7EB` | Branco 12% |

Associe cada variável ao **mode** correto (light/dark) para que, ao trocar o mode na página, as cores mudem.

### 2.3 Espaçamento e radius (Figma-like)

Outra coleção, por exemplo **"Spacing"** (sem mode):

- `space-xs`: 4  
- `space-sm`: 8  
- `space-md`: 12  
- `space-lg`: 16  
- `space-xl`: 24  

**Radius:**

- `radius-sm`: 8  
- `radius-md`: 10  
- `radius-lg`: 12  
- `radius-xl`: 16  

Use **number** (Figma) para spacing e corner radius; no código isso vira `--space-*` e `--radius-*` em px.

### 2.4 Sombras (efeitos)

Crie **estilos de efeito** (ou variáveis, se sua versão do Figma suportar):

- **Shadow depth:** leve (2–4–8px blur, opacidade baixa).  
- **Shadow strong / card-hover:** mais pronunciada (8–24–32px).  

No código: `--shadow-depth` e `--card-hover-shadow`.

---

## 3. Componentes principais (estilo pin)

Crie componentes reutilizáveis que usem **só** as variáveis acima, para manter um design elegante e consistente.

### 3.1 Sidebar

- Frame estreito (~72px), fundo `sidebar/bg`.
- Ícones 44x44, radius 12, cor `sidebar/text-muted`.
- Hover: fundo `sidebar/hover-bg` (ou equivalente em variável).
- Item ativo: barra vertical à esquerda (`sidebar/active-bar`) + fundo `sidebar/active-bg` (accent com opacidade).
- Rótulo (hover): pill à direita do ícone, fundo `sidebar/bg`, texto `sidebar/text`.

### 3.2 Card (glass)

- Retângulo com cantos `radius-lg`.
- Fill: cor com opacidade (ex. branco 72%) → espelha `--glass-bg`.
- Borda sutil: 1px, `border-subtle` ou equivalente glass.
- Sombra: “depth” leve.
- Hover: sombra “strong” (card-hover).

### 3.3 Tabs (estilo pin)

- Linha de botões; cada tab é um retângulo com `radius-md` em cima.
- Inativo: texto `text-secondary`.
- Hover: fundo `accent-soft`, texto `accent`.
- Ativo: borda inferior 2–3px `accent` ou fundo `accent-soft` + texto `accent`.

### 3.4 Botões

- **Primary:** fundo `accent`, texto branco, `radius-md`. Hover: `accent-hover`.
- **Secondary:** fundo `accent-soft`, texto `accent`. Hover: `accent-soft-hover`.
- **Ghost:** transparente, texto `text-secondary`. Hover: `accent-soft`.

### 3.5 Input + área de mensagem

- Borda 1px `border-subtle`, `radius-md` (ou `radius-lg`).
- Focus: borda `accent`, “ring” com `accent-soft`.
- Placeholder: `text-secondary`.

### 3.6 Lista de contatos / tasks

- Item: padding horizontal/vertical com `space-md`/`space-lg`, `radius-md`.
- Hover: fundo `accent-soft`.
- Ativo/selecionado: fundo `accent`, texto branco.
- Online: borda esquerda `status-success`; fundo `status-success-bg` (opcional).

### 3.7 Bloco Data + Relógio

- Um único card (glass) contendo data e relógio (analógico ou digital).
- Mesmos tokens de fundo, borda e sombra do Card (glass).
- Texto: `header-text` para títulos, `text-secondary` para secundário.

---

## 4. Uso de variáveis nos componentes

- Em **fills**, **strokes** e **text**: use sempre variáveis da coleção Theme (e troque o mode para preview light/dark).
- Em **corner radius** e **spacing** (auto layout): use as variáveis numéricas (space-*, radius-*).
- Evite cores “hardcoded”; assim o sistema escala para tema claro/escuro e futuras mudanças.

---

## 5. Integração com o Cursor (MCP)

1. **Conecte o Figma MCP** no Cursor (remoto ou desktop), conforme `FIGMA-MCP-CONFIGURACAO.md`.
2. Ao pedir no chat: *“Implementar o design deste link do Figma: [URL]”*, o agente deve:
   - Usar os tokens de `DESIGN_SYSTEM_RULES.md` para mapear Figma → CSS.
   - Respeitar a estrutura de componentes (sidebar, chat-list, message-input, etc.) já existente no código.
3. Se você criar **variantes** no Figma (ex.: Light/Dark), mencione no link qual variante ou mode deseja implementar/priorizar.

---

## 6. Checklist rápido (design elegante baseado nos pins)

- [ ] Sidebar escura, ícones centralizados, indicador ativo (pill + barra).
- [ ] Tema claro e escuro definidos como modes nas variáveis.
- [ ] Cards e painéis com efeito glass (fill semitransparente + borda sutil + sombra).
- [ ] Tabs e listas com hover “soft” (accent-soft) e ativo em accent.
- [ ] Botões e inputs com radius e estados (hover/focus) consistentes.
- [ ] Tipografia: títulos em negrito, corpo 14px, secundário 12px com cor secundária.
- [ ] Nenhuma cor “solta”; tudo via variáveis e dois modos (light/dark).

Com isso, você usa as ferramentas do Figma (Variables, Modes, Components) para ter um design system elegante e alinhado ao intuito do sistema e aos pins já fornecidos.
