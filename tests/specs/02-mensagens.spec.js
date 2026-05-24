/**
 * SPEC 02 — Mensagens
 * Testa envio e recebimento de mensagens de texto entre cliente e operador.
 */
const { test, expect } = require('@playwright/test');
const { IDS, seedOperadorSession, seedClienteSession, seedContatos, seedMensagemInicial, openClienteApp, openClienteChat, openOperadorApp, clearTestData } = require('../helpers/seed');

const BASE_URL = 'http://localhost:9876';
const POLL_WAIT = 2800;

test.describe('Mensagens – Cliente ↔ Operador', () => {

  test.afterEach(async ({ page }) => {
    await clearTestData(page);
  });

  // ── Testes de página única (usam fixture { page } com baseURL configurado) ──

  test('Operador vê lista de contatos com ao menos um item', async ({ page }) => {
    await seedOperadorSession(page);
    await seedContatos(page);
    await openOperadorApp(page);

    await expect(page.locator('#contactsList').first()).toBeVisible({ timeout: 8000 });
    await expect(page.locator('#contactsList .contact, #contactsList .contact-item').first()).toBeVisible({ timeout: 5000 });
  });

  test('Campo de mensagem do operador está visível e editável', async ({ page }) => {
    await seedOperadorSession(page);
    await seedContatos(page);
    await openOperadorApp(page);

    const contact = page.locator('#contactsList .contact, #contactsList .contact-item').first();
    await expect(contact).toBeVisible({ timeout: 8000 });
    await contact.click({ force: true });
    await page.waitForTimeout(800);

    await expect(page.locator('#messageInput')).toBeVisible({ timeout: 5000 });
    await page.locator('#messageInput').fill('Teste de digitação');
    const val = await page.locator('#messageInput').inputValue();
    expect(val).toBe('Teste de digitação');
  });

  test('Mensagem enviada pelo cliente aparece na área de chat (UI)', async ({ page }) => {
    await seedClienteSession(page);
    await openClienteApp(page);
    await openClienteChat(page);

    const msgTexto = 'Teste de exibição na UI';
    await expect(page.locator('#messageInput')).toBeVisible({ timeout: 8000 });
    await page.locator('#messageInput').fill(msgTexto);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1200);

    const chatArea = page.locator('#chatMessages, .messages').first();
    await expect(chatArea).toBeVisible({ timeout: 5000 });
    await expect(chatArea.locator(`text=${msgTexto}`).first()).toBeVisible({ timeout: 3000 });
  });

  test('Mensagem vazia não é salva', async ({ page }) => {
    await seedClienteSession(page);
    await openClienteApp(page);
    await openClienteChat(page);

    const countBefore = await page.evaluate(() => {
      try { return JSON.parse(localStorage.getItem('supportMessages') || '[]').length; } catch(e) { return 0; }
    });

    await expect(page.locator('#messageInput')).toBeVisible({ timeout: 8000 });
    await page.locator('#messageInput').fill('');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(600);

    const countAfter = await page.evaluate(() => {
      try { return JSON.parse(localStorage.getItem('supportMessages') || '[]').length; } catch(e) { return 0; }
    });
    expect(countAfter).toBe(countBefore);
  });

  test('Botão de enviar está presente e clicável', async ({ page }) => {
    await seedOperadorSession(page);
    await seedContatos(page);
    await seedMensagemInicial(page);
    await openOperadorApp(page);

    const contact = page.locator('#contactsList .contact, #contactsList .contact-item').first();
    await expect(contact).toBeVisible({ timeout: 8000 });
    await contact.click({ force: true });
    await page.waitForTimeout(800);

    await expect(page.locator('#sendButton')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#sendButton')).toBeEnabled();
  });

  // ── Testes de duas páginas (precisam de contexto compartilhado) ──

  test('Cliente envia mensagem e aparece no localStorage do operador', async ({ browser }) => {
    const context = await browser.newContext({ baseURL: BASE_URL });
    const opPage = await context.newPage();
    const clPage = await context.newPage();

    await seedOperadorSession(opPage);
    await seedContatos(opPage);
    await openOperadorApp(opPage);

    await seedClienteSession(clPage);
    await openClienteApp(clPage);
    await openClienteChat(clPage);

    const msgTexto = 'Olá, preciso de ajuda com minha fatura!';
    await expect(clPage.locator('#messageInput')).toBeVisible({ timeout: 8000 });
    await clPage.locator('#messageInput').fill(msgTexto);
    await clPage.keyboard.press('Enter');

    await opPage.waitForTimeout(POLL_WAIT);

    const msgs = await opPage.evaluate(() => {
      try { return JSON.parse(localStorage.getItem('supportMessages') || '[]'); } catch(e) { return []; }
    });
    const found = msgs.some(m => m.text && m.text.includes('fatura'));
    expect(found, 'Mensagem do cliente deve estar no localStorage').toBeTruthy();

    await context.close();
  });

  test('Operador responde e mensagem vai ao localStorage do cliente', async ({ browser }) => {
    const context = await browser.newContext({ baseURL: BASE_URL });
    const opPage = await context.newPage();
    const clPage = await context.newPage();

    await seedOperadorSession(opPage);
    await seedContatos(opPage);
    await seedMensagemInicial(opPage);
    await openOperadorApp(opPage);

    await seedClienteSession(clPage);
    await openClienteApp(clPage);
    await openClienteChat(clPage);

    const contact = opPage.locator('#contactsList .contact, #contactsList .contact-item').first();
    await expect(contact).toBeVisible({ timeout: 8000 });
    await contact.click({ force: true });
    await opPage.waitForTimeout(800);

    const respostaTxt = 'Olá! Vou verificar sua fatura agora mesmo.';
    await expect(opPage.locator('#messageInput')).toBeVisible({ timeout: 5000 });
    await opPage.locator('#messageInput').fill(respostaTxt);
    await opPage.keyboard.press('Enter');

    await clPage.waitForTimeout(POLL_WAIT);

    const msgs = await clPage.evaluate(() => {
      try { return JSON.parse(localStorage.getItem('supportMessages') || '[]'); } catch(e) { return []; }
    });
    const found = msgs.some(m => m.text && m.text.includes('fatura agora'));
    expect(found, 'Resposta do operador deve estar no localStorage').toBeTruthy();

    await context.close();
  });

});
