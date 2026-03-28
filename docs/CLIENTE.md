# Interface Cliente – cliente-script.js

Documentação da interface do cliente (contribuinte) – painel de suporte simplificado.

---

## 1. Visão Geral

A interface do **cliente** é usada por contribuintes (empresas/clientes) para acessar o suporte. Possui:

- Login (CNPJ + senha ou username vinculado ao contribuinte)
- Chat com operadores de suporte
- Acesso ao módulo NCM (se disponível)
- Onboarding para novos contribuintes (confirmar dados e definir senha)

---

## 2. Estrutura de Arquivos

| Arquivo | Descrição |
|---------|-----------|
| `src/cliente/index.html` | HTML principal |
| `src/cliente/cliente-script.js` | Lógica (~3.500 linhas) |
| `src/cliente/cliente-style.css` | Estilos |
| `src/cliente/boot.html` | Splash screen |
| `src/cliente/boot-script.js` | Lógica do boot |
| `src/cliente/boot-style.css` | Estilos do boot |

---

## 3. Dependências

- `config.js`, `constants.js`, `utils.js`, `supabase-sync.js` (shared)
- Boxicons, Google Fonts
- Lottie (emojis animados)
- jsPDF, html2canvas (se houver relatório)

---

## 4. Funções Principais (cliente-script.js)

### 4.1 Utilitárias (compartilhadas com operador)

| Função | Descrição |
|--------|-----------|
| `generateUniqueId()` | ID único |
| `getCurrentTime()` | Hora HH:mm |
| `getRelativeDate(date)` | Data relativa |
| `createDateDivider(dateText)` | Divisor de data |
| `isOnlyEmojis(text)` | Verifica se só emojis |
| `extractEmojis(text)` | Extrai emojis |
| `getEmojiCodepoint(emoji)` | Codepoint do emoji |
| `getNotoEmojiLottieUrl(emoji)` | URL Lottie |
| `loadLottieWithFallback(...)` | Carrega Lottie ou fallback |
| `useFallbackEmoji(...)` | Fallback estático |
| `createLargeEmoji(emoji, index)` | Emoji grande animado |
| `fileToBase64(file)` | Converte arquivo para Base64 |
| `formatFileSize(bytes)` | Formata tamanho |
| `getFileIcon(fileName)` | Ícone por tipo |
| `isImageFile(fileName)` | Verifica imagem |
| `isVideoFile(fileName)` | Verifica vídeo |
| `showToast(message, type)` | Notificação toast |
| `createFileElement(file, fileData)` | Elemento de arquivo |

### 4.2 Autenticação e Dados

| Função | Descrição |
|--------|-----------|
| `normalizeUsername(username)` | Normaliza username |
| `safeJsonParse(jsonString, fallback)` | Parse seguro |
| `generateUltraSecureHash(input)` | Hash de senha |
| `simpleHash(str)` | Hash simples |
| `getUsersData()` | Usuários do localStorage |
| `setUsersData(users)` | Salva usuários |
| `getContributorsData()` | Contribuintes |
| `setContributorsData(contributors)` | Salva contribuintes |
| `getContributorContactsData()` | Contatos |
| `setContributorContactsData(contacts)` | Salva contatos |
| `getContributorEmployeesData()` | Funcionários |
| `setContributorEmployeesData(employees)` | Salva funcionários |
| `isFirebaseAvailable()` | Stub (retorna false) |

### 4.3 Validação

| Objeto | Descrição |
|--------|-----------|
| `inputValidator` | `validate(type, value)`, `sanitize(text)`, `validateFile(file)` |

---

## 5. Fluxo de Autenticação (Cliente)

1. **Login por CNPJ**: contribuinte informa CNPJ e senha
2. **Login por username**: se vinculado a usuário (contributor), usa username/senha
3. **Onboarding**: contribuinte novo com `mustResetPassword` deve confirmar dados e definir nova senha
4. **Chat**: após login, acessa chat com operadores do setor vinculado

---

## 6. Diferenças em relação ao Operador

| Aspecto | Operador | Cliente |
|---------|----------|---------|
| Admin | Sim (usuários, contribuintes) | Não |
| Tax Agenda | Sim | Não |
| Relatório de conversas | Sim | Não |
| Gerenciamento de vagas | Sim | Não |
| Chat interno | Sim | Não |
| Chat suporte | Sim (vê todos os contribuintes) | Sim (só seu chat) |
| NCM | Completo | Pode ter versão reduzida |
| Setores | Múltiplos | Geralmente um |

---

## 7. localStorage (Cliente)

- `users`, `contributors`, `contributorContacts`, `contributorEmployees`
- `supportMessages` – mensagens do chat
- `currentUser` – usuário logado
- `contributorsUpdatedAt`, `usersUpdatedAt`, etc.

---

## 8. Integração com Supabase

O cliente usa `supabaseSync` para:
- Carregar/salvar dados de contribuintes
- Sincronizar mensagens (se configurado)

---

*Interface Cliente – Chat UI Sercon*
