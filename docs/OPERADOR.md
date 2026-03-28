# Interface Operador – operador-script.js

Documentação completa do script principal da interface do operador (~16.830 linhas).

---

## 1. Visão Geral

O `operador-script.js` implementa toda a lógica da interface do operador: login, chat de suporte, chat interno, admin, Tax Agenda, relatório de conversas, NCM e gerenciamento de vagas.

---

## 2. Funções Utilitárias (linhas 1–600)

### 2.1 Data, ID e DOM

| Função | Linha | Parâmetros | Retorno | Descrição |
|--------|-------|------------|---------|-----------|
| `generateUniqueId()` | 5 | — | string | ID único baseado em timestamp + random (base36) |
| `getCurrentTime()` | 13 | — | string | Hora atual HH:mm |
| `getRelativeDate(date)` | 25 | date | string | "Hoje", "Ontem" ou DD/MM/AAAA |
| `createDateDivider(dateText)` | 95 | string | HTMLElement | Cria divisor de data para mensagens |

### 2.2 Emojis Animados (Lottie)

| Função | Linha | Parâmetros | Retorno | Descrição |
|--------|-------|------------|---------|-----------|
| `isOnlyEmojis(text)` | 111 | string | boolean | Verifica se texto contém apenas emojis |
| `extractEmojis(text)` | 147 | string | string[] | Extrai emojis de uma string |
| `getEmojiCodepoint(emoji)` | 171 | string | string | Converte emoji em codepoint hex (ex: 1f600) |
| `getNotoEmojiLottieUrl(emoji)` | 219 | string | string | URL da animação Lottie do Google Noto Emoji |
| `showEmojiStats()` | 263 | — | void | Loga estatísticas de emojis no console |
| `loadLottieWithFallback(emoji, lottieDiv, container)` | 283 | string, HTMLElement, HTMLElement | Promise | Carrega Lottie ou usa fallback estático |
| `setupAnimationEvents(animation, container)` | 477 | object, HTMLElement | void | Hover/click para replay da animação |
| `useFallbackEmoji(emoji, lottieDiv)` | 503 | string, HTMLElement | void | Exibe emoji estático quando Lottie falha |
| `createLargeEmoji(emoji, index)` | 523 | string, number | HTMLElement | Cria elemento de emoji grande (animado ou estático) |

**Variáveis globais**: `lottieCache`, `noLottieEmojis`, `emojiStats`

### 2.3 Arquivos

| Função | Linha | Parâmetros | Retorno | Descrição |
|--------|-------|------------|---------|-----------|
| `fileToBase64(file)` | 581 | File | Promise\<string\> | Converte arquivo para Base64 |
| `formatFileSize(bytes)` | 599 | number | string | Formata tamanho (ex: "1.5 MB") |
| `getFileIcon(fileName)` | 615 | string | string | Classe Boxicons para o tipo de arquivo |
| `isImageFile(fileName)` | 637 | string | boolean | Verifica se é imagem |
| `isVideoFile(fileName)` | 647 | string | boolean | Verifica se é vídeo |

### 2.4 UI e Toast

| Função | Linha | Parâmetros | Retorno | Descrição |
|--------|-------|------------|---------|-----------|
| `showToast(message, type)` | 657 | string, 'info'\|'success'\|'error'\|'warning' | void | Exibe notificação toast |
| `getPlaceholderAvatarDataUri(size, text)` | 713 | number, string | string | Data URI de avatar placeholder SVG |
| `normalizeImagePath(imagePath)` | 720 | string | string | Normaliza caminho de imagem (avatar) |

### 2.5 Segurança e Hash

| Função | Linha | Parâmetros | Retorno | Descrição |
|--------|-------|------------|---------|-----------|
| `generateUltraSecureHash(input)` | 765 | string | string | Hash para senha (PBKDF2-like) |
| `normalizeUsername(username)` | 794 | string | string | Trim + lowercase |
| `safeJsonParse(jsonString, defaultValue)` | 798 | string, * | * | Parse seguro de JSON |

---

## 3. Usuários e Contribuintes (linhas 811–1100)

### 3.1 Usuários

| Função | Linha | Parâmetros | Retorno | Descrição |
|--------|-------|------------|---------|-----------|
| `sanitizeUsers(rawUsers)` | 811 | array | array | Sanitiza e valida estrutura de usuários |
| `persistUsersToStorage(users)` | 896 | array | array | Salva usuários no localStorage e Supabase |
| `getUsersFromStorage()` | 903 | — | array | Obtém usuários do localStorage |
| `ensureAdminUser()` | 907 | — | void | Garante que existe usuário admin padrão |

### 3.2 Contribuintes e Contatos

| Função | Linha | Parâmetros | Retorno | Descrição |
|--------|-------|------------|---------|-----------|
| `getContributorContacts()` | 931 | — | object | Contatos por contribuinte |
| `setContributorContacts(contacts)` | 935 | object | void | Define contatos |
| `clearStaticContributorContacts()` | 942 | — | void | Limpa contatos estáticos |
| `getContributorEmployees()` | 955 | — | object | Funcionários por contribuinte |
| `getEmployeesByContributorId(contributorId)` | 959 | string | array | Lista funcionários de um contribuinte |
| `getEmployeeChatId(contributorId, employeeId)` | 965 | string, string | string | Gera ID de chat com funcionário |
| `isEmployeeChatId(chatId)` | 970 | string | boolean | Verifica se chatId é de funcionário |
| `getEmployeeIdFromChatId(chatId)` | 975 | string | string | Extrai employeeId do chatId |
| `getContributorIdFromChatId(chatId)` | 982 | string | string | Extrai contributorId do chatId |
| `getContributorsFromStorage()` | 1063 | — | array | Obtém contribuintes do localStorage |
| `persistContributors(contributors)` | 1094 | array | void | Salva contribuintes |

### 3.3 Onboarding e Input

| Função | Linha | Parâmetros | Retorno | Descrição |
|--------|-------|------------|---------|-----------|
| `setSupportInputEnabled(enabled)` | 1100 | boolean | void | Habilita/desabilita input de mensagem |
| `showContributorOnboarding(user)` | 1121 | object | void | Exibe modal de onboarding do contribuinte |
| `hideContributorOnboarding()` | 1185 | — | void | Oculta modal de onboarding |

---

## 4. Autenticação (linhas 1211–1600)

| Função | Linha | Parâmetros | Retorno | Descrição |
|--------|-------|------------|---------|-----------|
| `initializeDefaultUsers()` | 1211 | — | Promise | Inicializa usuários padrão (async) |
| `isFirebaseAvailable()` | 1241 | — | boolean | Verifica se Firebase está disponível |
| `syncUsersWithFirebase()` | 1246 | — | Promise | Sincroniza usuários (legado) |
| `hashPassword(password)` | 1279 | string | Promise\<string\> | Hash assíncrono de senha |
| `hashPasswordSync(password)` | 1309 | string | string | Hash síncrono (fallback) |
| `simpleHash(str)` | 1321 | string | string | Hash simples para comparação |
| `verifyAdminPassword(password)` | 1363 | string | Promise\<boolean\> | Verifica senha do admin |
| `checkAuthentication()` | 1405 | — | void | Verifica se usuário está autenticado |
| `loginUser(username, password)` | 1446 | string, string | Promise\<boolean\> | Realiza login |
| `logoutUser()` | 1577 | — | void | Faz logout e recarrega |

---

## 5. Funções de Arquivo (internas ao DOMContentLoaded)

| Função | Linha | Descrição |
|--------|-------|-----------|
| `createFileElement(file, fileData, caption)` | 1761 | Cria elemento HTML para arquivo (imagem, vídeo ou documento) |

---

## 6. Admin – Usuários e Contribuintes

| Função | Linha | Descrição |
|--------|-------|-----------|
| `isAdmin()` | 2275 | Verifica se usuário atual é admin |
| `addUser(...)` | 2287 | Adiciona novo usuário (valida senha admin) |
| `deleteUser(username, adminPassword)` | 2397 | Remove usuário |
| `renderUsersList(forcedUsers)` | 2464 | Renderiza lista de usuários na UI |
| `buscarCEP(cep)` | 3033 | Busca endereço via ViaCEP |
| `addContributor(...)` | 3193 | Adiciona novo contribuinte |
| `deleteContributor(contributorId)` | 3293 | Remove contribuinte |
| `renderContributorsList()` | 3331 | Renderiza lista de contribuintes |

---

## 7. Perfil e Arquivos do Usuário

| Função | Linha | Descrição |
|--------|-------|-----------|
| `updateProfileInfo()` | 3762 | Atualiza nome, setor e avatar no painel direito |
| `getFileType(fileName)` | 3829 | Retorna tipo: image, video, document, other |
| `getCategoryIcon(ext)` | 3836 | Ícone por extensão |
| `isSystemFile(fileName)` | 3875 | Verifica se é arquivo de sistema |
| `isFileFromSameSector(msgSector, userSector)` | 3887 | Verifica se arquivo é do mesmo setor |
| `getUserFiles()` | 3896 | Agrupa arquivos das mensagens por categoria |
| `filterFilesByType(files, type)` | 4075 | Filtra arquivos por tipo |
| `createFileListItem(file)` | 4085 | Cria item de lista de arquivo |
| `createCategoryElement(category, files)` | 4134 | Cria bloco de categoria |
| `renderUserFiles()` | 4155 | Renderiza lista de arquivos no perfil |
| `initializeFileCategories()` | 4206 | Inicializa categorias de arquivos |
| `setupDynamicScrollGradient(element)` | 4387 | Gradiente dinâmico no scroll |

---

## 8. Tax Agenda (Calendário e Lembretes)

| Função | Linha | Descrição |
|--------|-------|-----------|
| `updateTaxAgendaDateTime()` | 4575 | Atualiza data e relógio na sidebar |
| `stopTaxAgendaClock()` | 4601 | Para o relógio |
| `startTaxAgendaClock()` | 4608 | Inicia o relógio |
| `initTaxAgendaClockToggle()` | 4615 | Alterna relógio analógico/digital |
| `closeModal()` | 6236 | Fecha modal de adicionar tarefa |
| `getTasksForDate(day, month, year)` | 6486 | Obtém tarefas de uma data |
| `generateCalendar(monthOffset, sectionIndex)` | 6530 | Gera grid do calendário |
| `getNextBusinessDay(date)` | 6729 | Próximo dia útil |
| `getNthBusinessDay(year, month, n)` | 6738 | N-ésimo dia útil do mês |
| `getLastBusinessDayOfMonth(year, month)` | 6752 | Último dia útil do mês |
| `initializeAutoTaxReminders()` | 6762 | Inicializa lembretes tributários automáticos |
| `highlightCalendarDay(day, monthAbbr)` | 7116 | Destaca dia no calendário |
| `highlightDayInCalendar(day, month)` | 7233 | Destaca dia no grid |
| `addTaskClickEvents()` | 7265 | Eventos de clique nas tarefas |
| `sortTasksByDate()` | 7389 | Ordena tarefas por data |
| `addTodayDivider()` | 7543 | Adiciona divisor "Hoje" na lista |
| `generateMiniCalendar(type)` | 7807 | Gera mini calendário (start/end) |
| `selectDate(type, date)` | 7979 | Seleciona data no mini calendário |
| `formatDateDisplay(date)` | 8073 | Formata data para exibição |
| `parseTaskDate(dateString)` | 8193 | Parse de data de tarefa |
| `filterTasksBySpecificDate(date)` | 8225 | Filtra tarefas por data específica |
| `filterTasksByDateRange()` | 8425 | Filtra por intervalo de datas |
| `updateTasksCount()` | 8675 | Atualiza badge de contagem |
| `checkTodayTasks()` | 8703 | Verifica tarefas de hoje |
| `clearAllFilters()` | 8795 | Limpa filtros |

---

## 9. Chat de Suporte

| Função | Linha | Descrição |
|--------|-------|-----------|
| `updateChat(contactId)` | 4670 | Troca de contato/chat ativo |
| `enableMessageInput()` | 5295 | Habilita input de mensagem |
| `disableMessageInput()` | 5323 | Desabilita input |
| `sendMessage()` | 5736 | Envia mensagem de texto |
| `getSupportChats()` | 9198 | Obtém lista de chats de suporte |
| `createSupportContactElement(chatData)` | 9397 | Cria elemento de contato na lista |
| `updateSupportContactsList()` | 9621 | Atualiza lista de contatos |
| `addSupportMessageToChat(msg)` | 9857 | Adiciona mensagem ao chat (DOM) |
| `loadSupportChat(chatId)` | 10178 | Carrega mensagens do chat |
| `loadEmployeeChatMessages(...)` | 10834 | Carrega mensagens de chat com funcionário |
| `loadAdminChatMessages(...)` | 11058 | Carrega mensagens de chat admin |
| `handleEmployeeClick(event)` | 11191 | Clique em funcionário na lista |
| `updateActiveContributorEmployeesList()` | 11287 | Atualiza lista de funcionários |
| `getTotalSupportUnreadCount()` | 11318 | Total de não lidas (suporte) |
| `getTotalInternalUnreadCount()` | 11346 | Total de não lidas (interno) |
| `updateSidebarBadges()` | 11369 | Atualiza badges na sidebar |
| `renderEmployeesList(contributorId)` | 11414 | Renderiza lista de funcionários |
| `getAdminUnreadCount(contributorId)` | 11639 | Não lidas do admin |
| `getEmployeesUnreadCount(contributorId)` | 11658 | Não lidas dos funcionários |
| `markSupportMessagesAsRead(chatId)` | 11672 | Marca mensagens como lidas |
| `showFilePreviewInline(file, fileData)` | 11795 | Exibe preview de arquivo |
| `closeFilePreviewInline()` | 11917 | Fecha preview |
| `sendFileWithCaption()` | 11949 | Envia arquivo com legenda |
| `renderEmojis(category)` | 12363 | Renderiza emojis por categoria |
| `createEmojiParticles(button, emoji)` | 12477 | Partículas ao inserir emoji |
| `insertEmoji(emoji)` | 12561 | Insere emoji no input |
| `cleanupListeners()` | 12761 | Remove listeners |
| `cleanupAllIntervals()` | 12778 | Limpa intervals |
| `cleanupAll()` | 12785 | Limpeza geral |
| `startRealtimeChatListener(chatId)` | 12800 | Inicia listener de novas mensagens |
| `checkForNewSupportMessages()` | 12809 | Verifica novas mensagens |

---

## 10. Relatório de Conversas (Scheduled Message)

| Função | Linha | Descrição |
|--------|-------|-----------|
| `loadContactsSelector()` | 13025 | Carrega seletor de contatos |
| `createContactSelectorItem(...)` | 13092 | Cria item do seletor |
| `selectContact(id, name, type)` | 13167 | Seleciona contato |
| `loadEmployeesSelector(contributorId)` | 13246 | Carrega seletor de funcionários |
| `createEmployeeSelectorItem(employee)` | 13292 | Cria item de funcionário |
| `selectEmployee(id, name, type)` | 13324 | Seleciona funcionário |
| `generateReportCalendar(type)` | 13594 | Gera calendário do relatório |
| `selectReportDate(type, date)` | 13772 | Seleciona data no relatório |
| `generateChatReport(contact, startDate, endDate, employee)` | 14125 | Gera dados do relatório |
| `renderReportPreview(data)` | 14404 | Renderiza preview do relatório |
| `renderPDFContent(data)` | 14604 | Prepara conteúdo para PDF |
| `generatePDF(data)` | 14764 | Gera e baixa PDF (jsPDF + html2canvas) |

---

## 11. Chat Interno

| Função | Linha | Descrição |
|--------|-------|-----------|
| `getInternalChatId(user1, user2)` | 15054 | Gera ID canônico do chat interno |
| `getInternalMessages()` | 15060 | Obtém mensagens internas |
| `saveInternalMessages(messages)` | 15065 | Salva mensagens internas |
| `updateInternalContactsList()` | 15070 | Atualiza lista de contatos internos |
| `createInternalContactElement(...)` | 15169 | Cria elemento de contato interno |
| `loadInternalChat(chatId, user)` | 15253 | Carrega chat interno |
| `markInternalMessagesAsRead(chatId)` | 15310 | Marca como lidas |
| `addInternalMessageToChat(msg, scroll)` | 15335 | Adiciona mensagem ao DOM |
| `sendInternalMessage()` | 15439 | Envia mensagem interna |
| `enableInternalMessageInput()` | 15519 | Habilita input interno |
| `disableInternalMessageInput()` | 15548 | Desabilita input interno |

---

## 12. Gerenciamento de Vagas (Job Management)

| Função | Linha | Descrição |
|--------|-------|-----------|
| `getLocationText(locationPreference)` | 15736 | Texto de localização |
| `getEducationText(level)` | 15938 | Texto de escolaridade |
| `getExperienceText(exp)` | 15949 | Texto de experiência |
| `getStatusText(status)` | 15961 | Texto do status |
| `getStatusClass(status)` | 15971 | Classe CSS do status |
| `getCurrentUser()` | 15995 | Usuário logado |
| `loadJobManagementData()` | 16008 | Carrega dados de vagas |
| `updateJobBadges(pending, published, rejected, applications)` | 16041 | Atualiza badges das tabs |
| `renderJobList(containerId, jobs, status)` | 16059 | Renderiza lista de vagas |
| `renderApplicationsList(containerId, applications)` | 16106 | Renderiza candidaturas |
| `createApplicationCard(application)` | 16144 | Cria card de candidatura |
| `getApplicationStatusBadge(status)` | 16203 | Badge de status da candidatura |
| `openApplicationDetailModal(applicationId)` | 16217 | Abre modal de candidatura |
| `downloadResume(applicationId)` | 16322 | Baixa currículo |
| `updateApplicationStatus(...)` | 16341 | Atualiza status da candidatura |
| `createJobCard(job, status)` | 16375 | Cria card de vaga |
| `getStatusBadge(status)` | 16442 | Badge de status da vaga |
| `formatLocationPreference(preference)` | 16453 | Formata preferência de local |
| `openJobDetailModal(jobId, status)` | 16467 | Abre modal de detalhes da vaga |
| `closeJobDetailModal()` | 16572 | Fecha modal |
| `approveJob(jobId)` | 16583 | Aprova solicitação |
| `rejectJob(jobId)` | 16615 | Rejeita solicitação |
| `publishJob(jobId)` | 16660 | Publica vaga |
| `unpublishJob(jobId)` | 16718 | Despublica vaga |
| `formatEducationLevel(level)` | 16762 | Formata nível de educação |
| `formatExperience(experience)` | 16773 | Formata experiência |

---

## 13. Utilitários Auxiliares

| Função | Linha | Descrição |
|--------|-------|-----------|
| `createManagedInterval(callback, delay)` | 8910 | Cria interval gerenciado |
| `cleanupIntervals()` | 8917 | Limpa intervals |
| `getColorFromName(name)` | 8961 | Cor hex a partir do nome |
| `createAvatarElement(name, size)` | 9035 | Cria elemento de avatar |
| `isClientOnline(chatId)` | 9107 | Verifica se cliente está online |
| `parseTimestampValue(value)` | 9121 | Parse de timestamp |
| `getMessageTimestamp(message)` | 9138 | Timestamp formatado da mensagem |
| `assignComputedTimestamp(message)` | 9163 | Atribui timestamp computado |
| `getMessageTimestampValue(message)` | 9187 | Valor numérico do timestamp |

---

## 14. Seções da Interface (data-section)

| Seção | ID/Classe | Descrição |
|-------|-----------|-----------|
| chat | `.chat-container` | Chat com contribuintes |
| internal-chat | `#internalChatContainer` | Chat interno |
| admin | `.admin-container` | Painel admin |
| tax-agenda | `.tax-agenda-container` | Agenda fiscal |
| scheduled-message | `.scheduled-message-container` | Relatório |
| ncm | `#ncmSection` | Consulta NCM |
| job-management | `#jobManagementSection` | Gerenciamento de vagas |

---

## 15. Variáveis Globais Importantes

- `supportChats` – objeto de chats de suporte
- `currentSupportChatId` – ID do chat ativo
- `selectedEmployeeId` – funcionário selecionado
- `contributorOnboardingModal`, `contributorOnboardingForm` – elementos do onboarding
- `pendingContributorContext` – contexto do contribuinte em onboarding

---

*Interface Operador – Chat UI Sercon*
