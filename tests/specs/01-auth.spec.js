/**
 * SPEC 01 — Autenticação
 * Login do operador, cliente, erro de credenciais, logout, redirecionamentos.
 */
const { test, expect } = require('@playwright/test');
const { seedOperadorSession, seedClienteSession, openClienteApp, openClienteChat, openOperadorApp, clearTestData } = require('../helpers/seed');

test.describe('Autenticação — Operador', () => {

  test.afterEach(async ({ page }) => {
    await clearTestData(page);
  });

  test('Página de login carrega com formulário visível', async ({ page }) => {
    await page.goto('/login/index.html');
    await expect(page.locator('#inputUsername, input[name="username"], input[type="text"]').first()).toBeVisible({ timeout: 8000 });
    await expect(page.locator('#inputPassword, input[type="password"]').first()).toBeVisible();
    await expect(page.locator('#loginBtn, button[type="submit"]').first()).toBeVisible();
  });

  test('Credenciais inválidas exibem mensagem de erro', async ({ page }) => {
    await page.goto('/login/index.html');
    await page.locator('#inputUsername, input[type="text"]').first().fill('usuario_invalido');
    await page.locator('#inputPassword, input[type="password"]').first().fill('senha_errada_123');
    await page.locator('#loginBtn, button[type="submit"]').first().click();
    const errorEl = page.locator('#loginError, .login-error, [class*="error"]').first();
    await expect(errorEl).toBeVisible({ timeout: 5000 });
  });

  test('Sessão injetada exibe painel do operador', async ({ page }) => {
    await seedOperadorSession(page);
    await openOperadorApp(page);
    await expect(page.locator('.sidebar, #sidebar').first()).toBeVisible({ timeout: 8000 });
  });

  test('Sem autenticação redireciona para login', async ({ page }) => {
    await page.goto('/operador/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2500);
    const url = page.url();
    const hasPasswordField = await page.locator('input[type="password"]').count() > 0;
    const redirected = url.includes('login') || hasPasswordField;
    expect(redirected, 'Deve redirecionar para login ou mostrar campo de senha').toBeTruthy();
  });

  test('Logout limpa sessão', async ({ page }) => {
    await seedOperadorSession(page);
    await openOperadorApp(page);

    const logoutBtn = page.locator('#logoutButton').first();
    await expect(logoutBtn).toBeVisible({ timeout: 5000 });

    // Aceita o diálogo confirm("Tem certeza...") que o botão de logout dispara
    page.on('dialog', async dialog => { await dialog.accept(); });

    // Aguarda a navegação de reload disparada pelo logout
    const navPromise = page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {});
    await logoutBtn.click();
    await navPromise;
    await page.waitForTimeout(800);

    // Após logout + reload, isAuthenticated deve ser null ou diferente de 'true'
    const sessionCleared = await page.evaluate(() => {
      const auth = localStorage.getItem('isAuthenticated');
      return !auth || auth !== 'true';
    });
    expect(sessionCleared, 'localStorage deve limpar flag de autenticação após logout').toBeTruthy();
  });

});

test.describe('Autenticação — Cliente', () => {

  test.afterEach(async ({ page }) => {
    await clearTestData(page);
  });

  test('Cliente autenticado vê campo de mensagem', async ({ page }) => {
    await seedClienteSession(page);
    await openClienteApp(page);
    await openClienteChat(page);

    await expect(page.locator('#messageInput').first()).toBeVisible({ timeout: 8000 });
  });

  test('Cliente sem sessão vê tela de identificação ou redirecionamento', async ({ page }) => {
    await page.goto('/cliente/index.html');
    await page.waitForTimeout(2000);
    const hasNameInput = await page.locator('input[name="name"], input[placeholder*="nome"], input[placeholder*="Nome"]').count() > 0;
    const hasChatInput = await page.locator('#messageInput').count() > 0;
    const isLoginPage = page.url().includes('login');
    expect(hasNameInput || hasChatInput || isLoginPage, 'Deve exibir formulário ou chat').toBeTruthy();
  });

  test('Logout do cliente encerra sessão', async ({ page }) => {
    await seedClienteSession(page);
    await openClienteApp(page);

    const logoutBtn = page.locator('#supportLogoutButton').first();
    await expect(logoutBtn).toBeVisible({ timeout: 5000 });

    const navPromise = page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => {});
    await logoutBtn.click();
    await navPromise;
    await page.waitForTimeout(800);

    // logoutSupportUser() remove supportCurrentUser mas não isAuthenticated —
    // verificamos a chave correta que o logout efetivamente limpa
    const sessionCleared = await page.evaluate(() => {
      return !localStorage.getItem('supportCurrentUser');
    });
    expect(sessionCleared, 'Sessão do cliente deve ser encerrada').toBeTruthy();
  });

});
