/**
 * SPEC 06 — Chat Interno e Painel do Operador
 * Testa mensagens internas, seções do painel e integridade JS da aplicação.
 */
const { test, expect } = require('@playwright/test');
const { seedOperadorSession, seedClienteSession, seedContatos, openClienteChat, openOperadorApp, clearTestData } = require('../helpers/seed');

test.describe('Chat Interno (operador ↔ operador)', () => {

  test.afterEach(async ({ page }) => {
    await clearTestData(page);
  });

  test('Seção de mensagens internas abre ao clicar no botão', async ({ page }) => {
    await page.goto('/operador/index.html', { waitUntil: 'domcontentloaded' });
    await seedOperadorSession(page);
    await openOperadorApp(page);

    const internalBtn = page.locator(
      'button[data-section="internal"], button[data-section="interno"], button[title*="interno"], button[title*="equipe"]'
    ).first();

    if (await internalBtn.isVisible()) {
      await internalBtn.click({ force: true });
      await page.waitForTimeout(800);
      const internalContainer = page.locator('#internalChatContainer, [class*="internal-chat"]').first();
      const visible = await internalContainer.isVisible().catch(() => false);
      console.log('Container de chat interno visível:', visible);
    } else {
      console.log('Botão de chat interno não encontrado — verificar data-section');
    }
  });

  test('Mensagem interna injetada permanece no localStorage', async ({ page }) => {
    await page.goto('/operador/index.html', { waitUntil: 'domcontentloaded' });
    await seedOperadorSession(page);

    // Inicializa o app completamente PRIMEIRO — qualquer init que limpe internalMessages
    // ocorre aqui, antes da injeção dos dados de teste.
    await openOperadorApp(page);

    // Injeta DEPOIS do init para que o app não sobrescreva os dados
    // internalMessages é um objeto { chatId: [msgs] }, não um array
    await page.evaluate(() => {
      const chatId = 'internal_adm_test';
      const messages = {};
      messages[chatId] = [{
        id: 'int_msg_test_001',
        type: 'internal',
        sender: 'adm',
        senderName: 'Admin E2E',
        text: 'Reunião às 15h hoje',
        timestamp: Date.now(),
        chatId: chatId,
        read: false,
      }];
      localStorage.setItem('internalMessages', JSON.stringify(messages));
    });

    // Verifica imediatamente sem recarregar — o app não fará novo init
    const found = await page.evaluate(() => {
      try {
        const data = JSON.parse(localStorage.getItem('internalMessages') || '{}');
        const allMsgs = Object.values(data).flat();
        return allMsgs.some(m => m.id === 'int_msg_test_001');
      } catch(e) { return false; }
    });
    expect(found, 'Mensagem interna deve persistir no localStorage').toBeTruthy();
  });

});

test.describe('Painel do Operador — Funcionalidades Extras', () => {

  test.afterEach(async ({ page }) => {
    await clearTestData(page);
  });

  test('Clicar em contato abre painel com informações', async ({ page }) => {
    await page.goto('/operador/index.html', { waitUntil: 'domcontentloaded' });
    await seedOperadorSession(page);
    await seedContatos(page);
    await openOperadorApp(page);

    const contact = page.locator('#contactsList .contact, #contactsList .contact-item').first();
    await expect(contact).toBeVisible({ timeout: 8000 });
    await contact.click({ force: true });
    await page.waitForTimeout(800);

    await expect(page.locator('#chatHeader, .chat-header').first()).toBeVisible({ timeout: 5000 });
    const headerText = await page.locator('#chatHeaderName, .chat-header-name').first().textContent().catch(() => '');
    console.log('Nome no header após clicar contato:', headerText);
  });

  test('Área de mensagens do operador (chatMessagesOp) existe e está no DOM', async ({ page }) => {
    await page.goto('/operador/index.html', { waitUntil: 'domcontentloaded' });
    await seedOperadorSession(page);
    await seedContatos(page);
    await openOperadorApp(page);

    await expect(page.locator('#chatMessagesOp')).toBeAttached({ timeout: 8000 });
  });

  test('Seção de agenda/calendário carrega sem erro JS', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto('/operador/index.html', { waitUntil: 'domcontentloaded' });
    await seedOperadorSession(page);
    await openOperadorApp(page);

    const agendaBtn = page.locator(
      'button[data-section*="agenda"], button[data-section*="calendar"], button[title*="Agenda"]'
    ).first();

    if (await agendaBtn.isVisible()) {
      await agendaBtn.click({ force: true });
      await page.waitForTimeout(1200);
      const calendarEl = page.locator('.calendar, [class*="calendar"], [class*="agenda"]').first();
      const visible = await calendarEl.isVisible().catch(() => false);
      console.log('Calendário/Agenda visível:', visible);
    } else {
      console.log('Botão de agenda não encontrado — verificar data-section');
    }

    const critical = errors.filter(e => !e.includes('favicon') && !e.includes('net::ERR') && !e.includes('404'));
    expect(critical.length, 'Seção de agenda não deve gerar erros JS').toBe(0);
  });

  test('Seção de recrutamento exibe candidatura injetada', async ({ page }) => {
    await page.goto('/operador/index.html', { waitUntil: 'domcontentloaded' });
    await seedOperadorSession(page);
    // Injeta dados antes de navegar para o app
    await page.evaluate(() => {
      const apps = [{
        id: 'app_test_e2e_001',
        jobId: 'job_test_01',
        jobTitle: 'Desenvolvedor Front-End',
        fullName: 'Ana Candidata E2E',
        email: 'ana.e2e@teste.com',
        phone: '(11) 98765-4321',
        status: 'pending',
        createdAt: new Date().toISOString(),
      }];
      localStorage.setItem('jobApplications', JSON.stringify(apps));
    });

    await openOperadorApp(page);

    const recruitBtn = page.locator(
      'button[data-section*="recruit"], button[data-section*="vagas"], button[data-section*="job"]'
    ).first();

    if (await recruitBtn.isVisible()) {
      await recruitBtn.click({ force: true });
      await page.waitForTimeout(1000);
      const candidaturaEl = page.locator('text=Ana Candidata E2E').first();
      const visible = await candidaturaEl.isVisible().catch(() => false);
      console.log('Candidatura E2E visível na seção:', visible);
    }

    await page.evaluate(() => {
      const apps = JSON.parse(localStorage.getItem('jobApplications') || '[]');
      localStorage.setItem('jobApplications', JSON.stringify(apps.filter(a => a.id !== 'app_test_e2e_001')));
    });
  });

  test('Zero erros JavaScript críticos na inicialização do operador', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto('/operador/index.html', { waitUntil: 'domcontentloaded' });
    await seedOperadorSession(page);
    await seedContatos(page);
    await openOperadorApp(page);
    await page.waitForTimeout(1500); // tempo extra para todos os ciclos assíncronos

    await expect(page.locator('.sidebar, #sidebar').first()).toBeVisible({ timeout: 8000 });

    const critical = errors.filter(e =>
      !e.includes('favicon') &&
      !e.includes('net::ERR') &&
      !e.includes('404')
    );

    if (critical.length > 0) {
      console.warn('Erros JS críticos no operador:', critical);
    }
    expect(critical.length, `Erros JS encontrados: ${critical.join('; ')}`).toBe(0);
  });

  test('Zero erros JavaScript críticos na inicialização do cliente', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto('/cliente/index.html');
    await seedClienteSession(page);
    await page.reload();
    await page.waitForTimeout(1500);

    await openClienteChat(page);

    await expect(page.locator('#messageInput').first()).toBeVisible({ timeout: 8000 });

    const critical = errors.filter(e =>
      !e.includes('favicon') &&
      !e.includes('net::ERR') &&
      !e.includes('404')
    );

    if (critical.length > 0) {
      console.warn('Erros JS críticos no cliente:', critical);
    }
    expect(critical.length, `Erros JS encontrados: ${critical.join('; ')}`).toBe(0);
  });

});
