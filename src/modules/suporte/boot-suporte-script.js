// ==================== SISTEMA DE BOOT DE INICIALIZAÇÃO - SUPORTE ====================

// Configurações do Boot
const BOOT_CONFIG = {
    duration: 2000, // Duração total do boot em milissegundos (tempo da animação)
    redirectUrl: 'Suporte.html' // URL para redirecionar após o boot
};

// ==================== INICIALIZAÇÃO ====================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Iniciando boot do sistema de suporte...');
    
    // Obter elemento do container
    const bootContainer = document.getElementById('bootContainer');
    
    if (!bootContainer) {
        console.error('❌ Elemento bootContainer não encontrado!');
        return;
    }
    
    // Aguardar a duração configurada (tempo para animação da logo)
    setTimeout(() => {
        completeBoot(bootContainer);
    }, BOOT_CONFIG.duration);
});

// ==================== FUNÇÕES DO BOOT ====================

/**
 * Completa o boot e redireciona
 */
function completeBoot(bootContainer) {
    console.log('✅ Boot completo! Redirecionando para Suporte...');
    
    if (!bootContainer) {
        console.error('❌ bootContainer não fornecido!');
        // Redirecionar mesmo sem animação
        if (BOOT_CONFIG.redirectUrl) {
            window.location.href = BOOT_CONFIG.redirectUrl;
        }
        return;
    }
    
    // Adicionar classe de fade out
    bootContainer.classList.add('fade-out');
    
    // Aguardar animação de fade out antes de redirecionar
    setTimeout(() => {
        if (BOOT_CONFIG.redirectUrl) {
            window.location.href = BOOT_CONFIG.redirectUrl;
        }
    }, 800);
}

// ==================== FUNÇÕES UTILITÁRIAS ====================

/**
 * Pula o boot (útil para desenvolvimento)
 */
function skipBoot() {
    console.log('⏭️ Pulando boot...');
    const bootContainer = document.getElementById('bootContainer');
    completeBoot(bootContainer);
}

// Expor função global para pular boot (útil para desenvolvimento)
window.skipBoot = skipBoot;

// Permitir pular boot com tecla ESC (apenas em desenvolvimento)
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && window.location.hostname === 'localhost') {
        skipBoot();
    }
});

