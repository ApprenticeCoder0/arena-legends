/**
 * Game.js
 * 
 * Responsabilidade: State Management centralizado e orquestração de telas.
 * Princípio: Nenhum outro módulo muda de tela sozinho. Todo mundo pede ao Game.
 */

import { Auth } from '../systems/Auth.js';
import { Database } from '../systems/Database.js';
import { Menu } from '../ui/Menu.js';
import { HUD } from '../ui/HUD.js';

export const GameState = {
    AUTH: 'AUTH',
    MENU: 'MENU',
    LOBBY: 'LOBBY',
    BATTLE: 'BATTLE',
    LOADING: 'LOADING'
};

export class Game {
    constructor() {
        // Estado global (fonte da verdade)
        this.state = GameState.AUTH;
        this.user = null;
        this.playerData = null;  // Dados do Firestore
        this.selectedChars = [];

        // Subsistemas
        this.auth = new Auth(this);
        this.db = new Database(this);
        this.menu = new Menu(this);
        this.hud = new HUD(this);

        this.bindEvents();
    }

    bindEvents() {
        // Quando auth mudar, o Game reage
        window.addEventListener('game:authchange', (e) => {
            this.user = e.detail.user;
            if (this.user) {
                this.transitionTo(GameState.LOADING);
                this.loadPlayerData();
            } else {
                this.playerData = null;
                this.transitionTo(GameState.AUTH);
            }
        });

        // Botão voltar do menu de batalha
        document.getElementById('btn-back').addEventListener('click', () => {
            this.transitionTo(GameState.MENU);
        });
    }

    async loadPlayerData() {
        try {
            this.playerData = await this.db.getPlayerData();

            // Se for primeiro login, cria perfil padrão
            if (!this.playerData) {
                this.playerData = await this.db.createInitialProfile();
            }

            // Processa treino offline
            const offlineGains = this.calculateOfflineTraining();
            if (offlineGains.xp > 0) {
                await this.db.addXp(offlineGains.xp);
                console.log(`[Game] Treino offline: +${offlineGains.xp} XP`);
            }

            this.transitionTo(GameState.MENU);
        } catch (err) {
            console.error('[Game] Erro ao carregar dados:', err);
            alert('Erro ao sincronizar dados. Tente recarregar.');
        }
    }

    calculateOfflineTraining() {
        if (!this.playerData || !this.playerData.lastTraining) return { xp: 0 };

        const now = Date.now();
        const last = this.playerData.lastTraining.toMillis 
            ? this.playerData.lastTraining.toMillis() 
            : this.playerData.lastTraining;
        const hoursOffline = (now - last) / (1000 * 60 * 60);

        // CAP DE 12 HORAS (segurança econômica)
        const cappedHours = Math.min(hoursOffline, 12);
        const trainingRate = 50; // XP por hora (base)

        return { xp: Math.floor(cappedHours * trainingRate) };
    }

    transitionTo(newState) {
        console.log(`[Game] ${this.state} -> ${newState}`);
        this.state = newState;
        this.updateVisibility();

        if (newState === GameState.MENU) {
            this.menu.render();
        } else if (newState === GameState.BATTLE) {
            this.hud.initBattle();
        }
    }

    updateVisibility() {
        const layers = {
            [GameState.AUTH]: 'auth-layer',
            [GameState.MENU]: 'menu-layer',
            [GameState.BATTLE]: 'game-layer',
            [GameState.LOADING]: 'auth-layer' // mostra auth com spinner (simplificado)
        };

        Object.values(layers).forEach(id => {
            document.getElementById(id)?.classList.add('hidden');
        });

        const activeId = layers[this.state];
        if (activeId) document.getElementById(activeId).classList.remove('hidden');
    }

    // Método chamado pelo Menu quando personagens são selecionados
    async startBattle(p1Char, p2Char) {
        this.selectedChars = [p1Char, p2Char];
        this.transitionTo(GameState.BATTLE);

        // Aqui entraria a inicialização da Arena de combate
        // Por enquanto, mantemos compatibilidade com o loop antigo
        if (window.initLegacyBattle) {
            window.initLegacyBattle(p1Char, p2Char);
        }
    }
}
