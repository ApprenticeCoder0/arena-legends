import { Game } from './core/Game.js';
const game = new Game();
if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    window.game = game;
    console.log('[Main] Arena Legends Online M1 (modo dev)');
}