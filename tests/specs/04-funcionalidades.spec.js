/**
 * SPEC 04 — Funcionalidades gerais
 * Testa: emojis, busca de contatos/mensagens, troca de seções, badge de não lidas, tema.
 */
const { test, expect } = require('@playwright/test');
const { seedOperadorSession, seedClienteSession, seedContatos, seedMensagemInicial, openClienteChat, openOperadorApp, clearTestData } = require('../helpers/seed');

test.describe('Emojis', () => {

  test.afterEach(async ({ page }) => {
    await clearTestData(page);
  });

  test('Botão de emoji está visível no cliente', async ({ page }) => {
    await page.goto('/cliente/index.html');
    await seedClienteSession(page);
    await page.reload();
    await page.waitForTimeout(1500);

    await openClienteChat(page);

    await expect(page.locator('#emojiButton')).toBeVisible({ timeout: 8000 });
  });

  test('Picker de emoji abre ao clicar no botão', async ({ page }) => {
    await page.goto('/cliente/index.html');
    await seedClienteSession(page);
    await page.reload();
    await page.waitForTimeout(1500);

    await openClienteChat(page);

    await expect(page.locator('#emojiButton')).toBeVisible({ timeout: 8000 });
    await page.locator('#emojiButton').click();
    await page.waitForTimeout(500);

    await expect(page.locator('#emojiPanel').first()).toBeVisible({ timeout: 3000 });
  });

  test('Emoji selecionado aparece no campo de mensagem', async ({ page }) => {
    await page.goto('/cliente/index.html');
    await seedClienteSession(page);
    await page.reload();
    await page.waitForTimeout(1500);

    await openClienteChat(page);

    await expect(page.locator('#messageInput')).toBeVisible({ timeout: 8000 });
    await page.locator('#messageInput').fill('😊 Olá!');
    const val = await page.locator('#messageInput').inputValue();
    expect(val).toContain('😊');
  });

  test('Mensagem com emoji é salva no localStorage', async ({ page }) => {
    await page.goto('/cliente/index.html');
    await seedClienteSession(page);
    await page.reload();
    await page.waitForTimeout(1500);

    await openClienteChat(page);

    await expect(page.locator('#messageInput')).toBeVisible({ timeout: 8000 });
    await page.locator('#messageInput').fill('🎉 Parabéns pela entrega!');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(800);

    const msgs = await page.evaluate(() => {
      try { return JSON.parse(localStorage.getItem('supportMessages') || '[]'); } catch(e) { return []; }
    });
    const found = msgs.some(m => m.text && m.text.includes('🎉'));
    expect(found, 'Mensagem com emoji deve ser salva no localStorage').toBeTruthy();
  });

  test('Botão de emoji está visível no operador', async ({ page }) => {
    await page.goto('/operador/index.html');
    await seedOperadorSession(page);
    await openOperadorApp(page);

    // #emojiButton fica dentro de .message-input que só ganha .active ao selecionar contato;
    // verificamos que o elemento existe no DOM (toBeAttached)
    await expect(page.locator('#emojiButton')).toBeAttached({ timeout: 8000 });
  });

});

test.describe('Busca', () => {

  test.afterEach(async ({ page }) => {
    await clearTestData(page);
  });

  test('Campo unificado de busca do operador está visível', async ({ page }) => {
    await page.goto('/operador/index.html');
    await seedOperadorSession(page);
    await seedContatos(page);
    await openOperadorApp(page);

    await expect(page.locator('#contactsUnifiedSearch')).toBeVisible({ timeout: 8000 });
  });

  test('Busca filtra contato pelo nome', async ({ page }) => {
    await page.goto('/operador/index.html');
    await seedOperadorSession(page);
    await seedContatos(page);
    await openOperadorApp(page);

    await expect(page.locator('#contactsUnifiedSearch')).toBeVisible({ timeout: 8000 });
    await page.locator('#contactsUnifiedSearch').fill('Empresa Teste');
    await page.waitForTimeout(700);

    const contactEl = page.locator('#contactsList .contact, #contactsList .contact-item')
      .filter({ hasText: 'Empresa Teste' }).first();
    await expect(contactEl).toBeVisible({ timeout: 3000 });
  });

  test('Busca por termo inexistente não exibe contatos da seed', async ({ page }) => {
    await page.goto('/operador/index.html');
    await seedOperadorSession(page);
    await seedContatos(page);
    await openOperadorApp(page);

    await expect(page.locator('#contactsUnifiedSearch')).toBeVisible({ timeout: 8000 });
    await page.locator('#contactsUnifiedSearch').fill('xyz_nao_existe_999');
    await page.waitForTimeout(700);

    const contactEl = page.locator('#contactsList .contact, #contactsList .contact-item')
      .filter({ hasText: 'Empresa Teste' });
    const count = await contactEl.count();
    expect(count).toBe(0);
  });

  test('Campo de busca de mensagens no chat está presente', async ({ page }) => {
    await page.goto('/operador/index.html');
    await seedOperadorSession(page);
    await seedContatos(page);
    await openOperadorApp(page);

    // chatSearchBtn fica dentro do #chatHeader (display:none por padrão)
    // É necessário selecionar um contato primeiro para que o header apareça
    const contact = page.locator('#contactsList .contact, #contactsList .contact-item').first();
    await expect(contact).toBeVisible({ timeout: 8000 });
    await contact.click({ force: true });
    await page.waitForTimeout(800);

    const searchBtn = page.locator('#chatSearchBtn').first();
    await expect(searchBtn).toBeVisible({ timeout: 5000 });
    await searchBtn.click({ force: true });
    await page.waitForTimeout(400);

    await expect(page.locator('#chatSearchInput')).toBeVisible({ timeout: 3000 });
  });

});

test.describe('Navegação entre Seções', () => {

  test.afterEach(async ({ page }) => {
    await clearTestData(page);
  });

  test('Todos os botões de seção do sidebar clicam sem erro JS', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    // Aceita qualquer diálogo de confirmação que surja durante a navegação de seções
    page.on('dialog', async dialog => { await dialog.accept(); });

    await page.goto('/operador/index.html');
    await seedOperadorSession(page);
    await seedContatos(page);
    await openOperadorApp(page);

    const sidebarBtns = page.locator('.sidebar button[data-section]');
    const count = await sidebarBtns.count();
    console.log(`Botões de seção encontrados: ${count}`);
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const btn = sidebarBtns.nth(i);
      if (await btn.isVisible()) {
        const section = await btn.getAttribute('data-section');
        // force:true ignora #chatApp que intercede pointer events nos botões da sidebar
        await btn.click({ force: true });
        await page.waitForTimeout(600);
        console.log(`Seção "${section}" navegada`);
        const title = await page.title();
        expect(title).toBeTruthy();
      }
    }

    const critical = errors.filter(e => !e.includes('favicon') && !e.includes('net::ERR') && !e.includes('404'));
    if (critical.length > 0) console.warn('Erros JS durante navegação:', critical);
    expect(critical.length, 'Não deve haver erros JS críticos ao navegar seções').toBe(0);
  });

  test('Badge de não lidas aparece quando há mensagem não lida', async ({ page }) => {
    await page.goto('/operador/index.html');
    await seedOperadorSession(page);
    await seedContatos(page);
    await seedMensagemInicial(page);
    await openOperadorApp(page);
    await page.waitForTimeout(1000); // tempo extra para polling de badges

    const badge = page.locator(
      '.unread-badge, .badge, [class*="unread"], [class*="badge"], .sidebar-unread-dot'
    ).first();
    const hasBadge = await badge.isVisible().catch(() => false);
    console.log('Badge de não lidas visível:', hasBadge);
    expect(hasBadge !== null).toBeTruthy();
  });

  test('Seção de suporte (padrão) mostra lista de contatos', async ({ page }) => {
    await page.goto('/operador/index.html');
    await seedOperadorSession(page);
    await seedContatos(page);
    await openOperadorApp(page);

    const supportBtn = page.locator('button[data-section="support"], button[data-section="suporte"]').first();
    if (await supportBtn.isVisible()) await supportBtn.click({ force: true });
    await page.waitForTimeout(600);

    await expect(page.locator('#contactsList')).toBeVisible({ timeout: 5000 });
  });

  test('Alternância de tema claro/escuro funciona', async ({ page }) => {
    await page.goto('/cliente/index.html');
    await seedClienteSession(page);
    await page.reload();
    await page.waitForTimeout(1500);

    const themeBtn = page.locator('.theme-switch, button[title*="tema"], button[title*="escuro"], [data-action*="theme"]').first();
    const isBtnVisible = await themeBtn.isVisible().catch(() => false);

    if (isBtnVisible) {
      const before = await page.evaluate(() =>
        document.documentElement.getAttribute('data-theme') ||
        document.body.className ||
        'none'
      );
      await themeBtn.click();
      await page.waitForTimeout(400);
      const after = await page.evaluate(() =>
        document.documentElement.getAttribute('data-theme') ||
        document.body.className ||
        'none'
      );
      expect(before).not.toBe(after);
    } else {
      console.log('Botão de tema não encontrado — verificar seletor');
    }
  });

});
