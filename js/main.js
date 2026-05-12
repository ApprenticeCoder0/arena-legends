/**
 * main.js
 * 
 * Entry point da aplicação.
 * Inicializa o Game e expõe globalmente para debug (apenas em dev).
 */

import { Game } from './core/Game.js';

const game = new Game();

// Expor globalmente apenas para desenvolvimento (remover em produção)
if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    window.game = game;
    console.log('[Main] Arena Legends Online iniciado (modo dev)');
}

// Placeholder para integração futura do combate legado
window.initLegacyBattle = (p1Char, p2Char) => {
    console.log('[Main] Iniciando batalha legada com:', p1Char.name, 'vs', p2Char.name);
    // Aqui você vai integrar o loop de combate do código original
    // Por enquanto, mostramos apenas uma mensagem
    alert(`Batalha iniciada!\n${p1Char.name} (Lv.${p1Char.playerLevel}) vs ${p2Char.name} (Lv.${p2Char.playerLevel})\n\nIntegração com o sistema de combate será feita no próximo milestone.`);
};
