/**
 * Helpers de seed para os testes do Chat UI.
 * Todas as funções recebem um Playwright Page e injetam
 * o estado correto no localStorage sem passar pela tela de login.
 *
 * FLUXO DE AUTH OPERADOR:
 *   checkAuthentication() exige: isAuthenticated === 'true' E savedUsername && savedPassword
 *
 * FLUXO DE AUTH CLIENTE:
 *   supportCurrentUser.contributorId + contributor em contributors com mustResetPassword:false
 *   + savedRazaoSocial + savedUsername + savedPassword
 *
 * FLUXO DE ABERTURA DO CHAT CLIENTE:
 *   Clicar em #supportButton (botão flutuante) -> selecionar setor na modal -> chat abre
 *   sectors devem estar no localStorage para aparecerem na modal
 *
 * PADRÃO RECOMENDADO para testes de operador com contatos:
 *   await page.goto('/operador/index.html');
 *   await seedOperadorSession(page);
 *   await seedContatos(page);
 *   await openOperadorApp(page);   ← navega fresh + força renderização dos contatos
 */

const { expect } = require('@playwright/test');

// ─── IDs fixos usados em todos os testes ───────────────────────────────────
const IDS = {
  adminUser: 'user_admin_test',
  clientContributor: 'contributor_test_01',
  chatId: 'chat_contributor_test_01',
  testEmployee: 'employee_test_01',
  testJob: 'job_test_01',
};

// ─── Seed: sessão do Operador (admin) ─────────────────────────────────────
async function seedOperadorSession(page) {
  await page.evaluate((ids) => {
    const adminUser = {
      id: ids.adminUser,
      username: 'adm',
      fullName: 'Administrador Teste',
      role: 'admin',
      status: 'active',
      sector: 'TI',
      email: 'admin@softtech.com',
      profileImage: null,
    };
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('currentUser', JSON.stringify(adminUser));
    localStorage.setItem('clientName', adminUser.fullName);

    // Simula "Lembrar de mim" — obrigatório para passar no checkAuthentication()
    localStorage.setItem('savedUsername', 'adm');
    localStorage.setItem('savedPassword', btoa('test_e2e_pass'));

    // Setores disponíveis para o operador (evitar undefined em seções que os leem)
    if (!localStorage.getItem('sectors')) {
      localStorage.setItem('sectors', JSON.stringify(['TI', 'Contabilidade', 'Fiscal']));
    }
  }, IDS);
}

// ─── Seed: sessão do Cliente (contribuinte) ────────────────────────────────
async function seedClienteSession(page) {
  await page.evaluate((ids) => {
    const contributor = {
      id: ids.clientContributor,
      razaoSocial: 'Empresa Teste LTDA',
      cnpj: '00.000.000/0001-00',
      email: 'cliente@teste.com',
      chatId: ids.chatId,
      status: 'active',
      mustResetPassword: false,
      contactName: 'João Teste',
    };
    const existing = (() => {
      try { return JSON.parse(localStorage.getItem('contributors') || '[]'); } catch(e) { return []; }
    })();
    localStorage.setItem('contributors', JSON.stringify([...existing.filter(c => c.id !== ids.clientContributor), contributor]));

    const supportUser = {
      username: 'adm',
      fullName: 'Empresa Teste LTDA',
      role: 'contributor',
      contributorId: ids.clientContributor,
      mustResetPassword: false,
      status: 'active',
    };
    localStorage.setItem('supportCurrentUser', JSON.stringify(supportUser));
    localStorage.setItem('chatId', ids.chatId);
    localStorage.setItem('clientName', 'Empresa Teste LTDA');
    localStorage.setItem('supportLastRazaoSocial', 'Empresa Teste LTDA');
    localStorage.setItem('isAuthenticated', 'true');

    // Simula "Lembrar de mim" — obrigatório
    localStorage.setItem('savedRazaoSocial', 'Empresa Teste LTDA');
    localStorage.setItem('savedUsername', 'adm');
    localStorage.setItem('savedPassword', btoa('test_e2e_pass'));

    // Setores disponíveis — obrigatório para o modal de seleção de setor funcionar
    localStorage.setItem('sectors', JSON.stringify(['TI', 'Contabilidade', 'Fiscal']));
  }, IDS);
}

// ─── Helper: navega ao app do operador e força renderização dos contatos ──
// Deve ser chamado APÓS seedOperadorSession (e seedContatos se precisar de contatos).
// Substitui o padrão antigo: page.reload() + waitForTimeout(1500)
async function openOperadorApp(page) {
  // waitUntil:'domcontentloaded' evita que page.goto aguarde recursos externos
  // (fontes, CDN) que podem nunca carregar, causando timeout de 30s.
  await page.goto('/operador/index.html', { waitUntil: 'domcontentloaded' });

  // Aguarda a sidebar aparecer (prova que a auth passou)
  await page.locator('.sidebar, #sidebar').first().waitFor({ state: 'visible', timeout: 10000 });

  // Dispara updateSupportContactsList() via JS direto no DOM para evitar que
  // #chatApp (overlay) intercepte o clique no botão da sidebar.
  await page.evaluate(() => {
    const chatBtn = document.querySelector('button[data-section="chat"]');
    if (chatBtn) chatBtn.click();
  });

  // Aguarda ciclo async de renderização: tenta detectar contatos no DOM,
  // senão aguarda 3s para dar tempo ao setTimeout de 500ms + renderização.
  await page.waitForFunction(
    () => document.querySelectorAll('#contactsList .contact').length > 0,
    { timeout: 3000 }
  ).catch(() => {});

  // Buffer extra para ciclos adicionais (badges, polling, etc.)
  await page.waitForTimeout(800);
}

// ─── Helper: navega ao app do cliente ─────────────────────────────────────
// Deve ser chamado APÓS seedClienteSession.
async function openClienteApp(page) {
  await page.goto('/cliente/index.html');
  await page.waitForTimeout(1500);
}

// ─── Helper: abre o chat do cliente clicando no botão flutuante + setor ───
// Uso: await openClienteChat(page)  — chame após openClienteApp()
async function openClienteChat(page) {
  // Clica no botão flutuante "Suporte"
  const supportBtn = page.locator('#supportButton');
  if (await supportBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await supportBtn.click();
    await page.waitForTimeout(400);

    // Seleciona o primeiro setor disponível na modal
    const sectorOption = page.locator('.sector-option').first();
    if (await sectorOption.isVisible({ timeout: 3000 }).catch(() => false)) {
      await sectorOption.click();
      await page.waitForTimeout(400);
    } else {
      // Fallback: fecha modal e tenta acessar via section button
      const closeModal = page.locator('#closeSectorModal, .sector-modal-close').first();
      if (await closeModal.isVisible().catch(() => false)) await closeModal.click();
    }
  }
}

// ─── Seed: lista de contatos (operador) ───────────────────────────────────
// Popula contributors E contributorContacts para que a lista carregue sem
// depender do ciclo assíncrono de updateSupportContactsList.
async function seedContatos(page) {
  await page.evaluate((ids) => {
    const contributor = {
      id: ids.clientContributor,
      razaoSocial: 'Empresa Teste LTDA',
      cnpj: '00.000.000/0001-00',
      email: 'cliente@teste.com',
      chatId: ids.chatId,
      status: 'active',
      mustResetPassword: false,
      contactName: 'João Teste',
    };

    // Atualiza contributors
    const existingContributors = (() => {
      try { return JSON.parse(localStorage.getItem('contributors') || '[]'); } catch(e) { return []; }
    })();
    localStorage.setItem('contributors', JSON.stringify([
      ...existingContributors.filter(c => c.id !== ids.clientContributor),
      contributor,
    ]));
    localStorage.setItem('contributorsUpdatedAt', Date.now().toString());

    // Também popula contributorContacts — usado diretamente por updateSupportContactsList
    const existingContacts = (() => {
      try { return JSON.parse(localStorage.getItem('contributorContacts') || '[]'); } catch(e) { return []; }
    })();
    const contactEntry = {
      contributorId: ids.clientContributor,
      fullName: 'Empresa Teste LTDA',
      cnpj: '00.000.000/0001-00',
      chatId: ids.chatId,
      status: 'active',
      sector: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    localStorage.setItem('contributorContacts', JSON.stringify([
      ...existingContacts.filter(c => c.contributorId !== ids.clientContributor),
      contactEntry,
    ]));
    localStorage.setItem('contributorContactsUpdatedAt', Date.now().toString());
  }, IDS);
}

// ─── Seed: mensagem inicial (cliente → operador) ───────────────────────────
async function seedMensagemInicial(page) {
  await page.evaluate((ids) => {
    const messages = (() => {
      try { return JSON.parse(localStorage.getItem('supportMessages') || '[]'); } catch(e) { return []; }
    })();
    const msg = {
      id: 'msg_seed_001',
      chatId: ids.chatId,
      contributorId: ids.clientContributor,
      sender: 'Empresa Teste LTDA',
      senderRole: 'contributor',
      text: 'Olá! Preciso de suporte com minha conta.',
      type: 'text',
      timestamp: Date.now() - 60000,
      read: false,
      delivered: true,
    };
    const already = messages.some(m => m.id === 'msg_seed_001');
    if (!already) messages.push(msg);
    localStorage.setItem('supportMessages', JSON.stringify(messages));
    localStorage.setItem('supportMessagesUpdatedAt', Date.now().toString());
  }, IDS);
}

// ─── Seed: vaga publicada ─────────────────────────────────────────────────
async function seedVaga(page) {
  await page.evaluate((ids) => {
    const jobs = (() => {
      try { return JSON.parse(localStorage.getItem('publishedJobs') || '[]'); } catch(e) { return []; }
    })();
    const job = {
      id: ids.testJob,
      jobTitle: 'Desenvolvedor Front-End',
      contributorName: 'Soft Tech',
      vacancyQuantity: 2,
      salary: 'R$ 5.000 – R$ 8.000',
      workSchedule: 'CLT',
      locationPreference: 'hibrido',
      jobDescription: 'Vaga de teste automatizado para desenvolvedor front-end.',
      requiredSkills: 'HTML, CSS, JavaScript, React',
      benefits: 'VR, VT, Plano de Saúde',
      isPublished: true,
      status: 'published',
      publishedAt: new Date().toISOString(),
    };
    const existing = jobs.filter(j => j.id !== ids.testJob);
    localStorage.setItem('publishedJobs', JSON.stringify([...existing, job]));
  }, IDS);
}

// ─── Limpa estado de teste ────────────────────────────────────────────────
// Limpa TODOS os dados de teste — incluindo chaves de auth — para evitar
// que o estado de um teste vaze para o próximo.
async function clearTestData(page) {
  try {
    const url = page.url();
    if (!url.startsWith('http')) {
      await page.goto('/operador/index.html').catch(() => {});
    }
    await page.evaluate((ids) => {
      // ── Auth: limpar completamente para evitar vazamento entre testes ──
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('currentUser');
      localStorage.removeItem('savedUsername');
      localStorage.removeItem('savedPassword');
      localStorage.removeItem('supportCurrentUser');
      localStorage.removeItem('chatId');
      localStorage.removeItem('clientName');
      localStorage.removeItem('supportLastRazaoSocial');
      localStorage.removeItem('savedRazaoSocial');

      // ── Mensagens de suporte de teste ──
      const msgs = (() => {
        try { return JSON.parse(localStorage.getItem('supportMessages') || '[]'); } catch(e) { return []; }
      })();
      localStorage.setItem('supportMessages', JSON.stringify(
        msgs.filter(m => !m.id?.startsWith('msg_seed') && m.chatId !== ids.chatId)
      ));

      // ── Vagas de teste ──
      const jobs = (() => {
        try { return JSON.parse(localStorage.getItem('publishedJobs') || '[]'); } catch(e) { return []; }
      })();
      localStorage.setItem('publishedJobs', JSON.stringify(jobs.filter(j => j.id !== ids.testJob)));

      // ── Candidaturas de teste ──
      const apps = (() => {
        try { return JSON.parse(localStorage.getItem('jobApplications') || '[]'); } catch(e) { return []; }
      })();
      localStorage.setItem('jobApplications', JSON.stringify(apps.filter(a => a.jobId !== ids.testJob)));

      // ── Mensagens internas de teste — formato objeto {chatId: [msgs]} ──
      const intRaw = localStorage.getItem('internalMessages');
      if (intRaw) {
        try {
          const intData = JSON.parse(intRaw);
          if (typeof intData === 'object' && !Array.isArray(intData)) {
            Object.keys(intData).forEach(chatId => {
              if (Array.isArray(intData[chatId])) {
                intData[chatId] = intData[chatId].filter(m => m.id !== 'int_msg_test_001');
                if (intData[chatId].length === 0) delete intData[chatId];
              }
            });
            localStorage.setItem('internalMessages', JSON.stringify(intData));
          }
        } catch(e) {}
      }

      // ── Contatos e contributors de teste ──
      const contacts = (() => {
        try { return JSON.parse(localStorage.getItem('contributorContacts') || '[]'); } catch(e) { return []; }
      })();
      localStorage.setItem('contributorContacts', JSON.stringify(
        contacts.filter(c => c.contributorId !== ids.clientContributor)
      ));

      const contributors = (() => {
        try { return JSON.parse(localStorage.getItem('contributors') || '[]'); } catch(e) { return []; }
      })();
      localStorage.setItem('contributors', JSON.stringify(
        contributors.filter(c => c.id !== ids.clientContributor)
      ));
    }, IDS);
  } catch(e) {
    console.warn('[clearTestData] Aviso:', e.message);
  }
}

module.exports = {
  IDS,
  seedOperadorSession,
  seedClienteSession,
  seedContatos,
  seedMensagemInicial,
  seedVaga,
  openClienteChat,
  openClienteApp,
  openOperadorApp,
  clearTestData,
};
