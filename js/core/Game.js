import { Auth } from '../systems/Auth.js';
import { Database } from '../systems/Database.js';
import { Menu } from '../ui/Menu.js';
import { HUD } from '../ui/HUD.js';

export const GameState = {
    AUTH: 'AUTH', MENU: 'MENU', LOBBY: 'LOBBY', BATTLE: 'BATTLE', LOADING: 'LOADING'
};

export class Game {
    constructor() {
        this.state = GameState.AUTH;
        this.user = null;
        this.playerData = null;
        this.selectedChars = [];
        this.auth = new Auth(this);
        this.db = new Database(this);
        this.menu = new Menu(this);
        this.hud = new HUD(this);
        this.unsubProfile = null;
        this.battleSystem = null;
        this.bindEvents();
    }
    bindEvents() {
        window.addEventListener('game:authchange', (e) => {
            this.user = e.detail.user;
            if (this.user) {
                this.transitionTo(GameState.LOADING);
                this.loadPlayerData();
            } else {
                this.playerData = null;
                if (this.unsubProfile) { this.unsubProfile(); this.unsubProfile = null; }
                this.transitionTo(GameState.AUTH);
            }
        });
        document.getElementById('btn-back')?.addEventListener('click', () => {
            if (this.battleSystem) { this.battleSystem.stop(); this.battleSystem = null; }
            this.transitionTo(GameState.MENU);
        });
    }
    async loadPlayerData() {
        try {
            this.playerData = await this.db.getPlayerData();
            if (!this.playerData) this.playerData = await this.db.createInitialProfile();
            const offlineGains = this.calculateOfflineTraining();
            if (offlineGains.xp > 0) {
                await this.db.addXp(offlineGains.xp);
                console.log(`[Game] Treino offline: +${offlineGains.xp} XP`);
            }
            this.unsubProfile = this.db.subscribeToProfile((data) => {
                this.playerData = data;
                if (this.state === GameState.MENU) this.menu.render();
            });
            this.transitionTo(GameState.MENU);
        } catch (err) {
            console.error('[Game] Erro ao carregar dados:', err);
            alert('Erro ao sincronizar dados. Recarregue a página.');
        }
    }
    calculateOfflineTraining() {
        if (!this.playerData || !this.playerData.lastTraining) return { xp: 0 };
        const now = Date.now();
        const last = this.playerData.lastTraining.toMillis ? this.playerData.lastTraining.toMillis() : this.playerData.lastTraining;
        const hoursOffline = (now - last) / (1000 * 60 * 60);
        const cappedHours = Math.min(hoursOffline, 12);
        return { xp: Math.floor(cappedHours * 50) };
    }
    transitionTo(newState) {
        console.log(`[Game] ${this.state} -> ${newState}`);
        this.state = newState;
        this.updateVisibility();
        if (newState === GameState.MENU) this.menu.render();
        else if (newState === GameState.BATTLE) this.hud.initBattle();
    }
    updateVisibility() {
        const layers = {
            [GameState.AUTH]: 'auth-layer',
            [GameState.MENU]: 'menu-layer',
            [GameState.BATTLE]: 'game-layer',
            [GameState.LOADING]: 'auth-layer'
        };
        Object.values(layers).forEach(id => document.getElementById(id)?.classList.add('hidden'));
        const activeId = layers[this.state];
        if (activeId) document.getElementById(activeId).classList.remove('hidden');
    }
    async startBattle(p1Char, p2Char) {
        this.selectedChars = [p1Char, p2Char];
        this.transitionTo(GameState.BATTLE);
        const { BattleSystem } = await import('./BattleSystem.js');
        this.battleSystem = new BattleSystem(this, p1Char, p2Char);
        this.battleSystem.start();
    }
}