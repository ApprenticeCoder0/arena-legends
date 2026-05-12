import { ROSTER } from '../data/roster.js';

export class Menu {
    constructor(game) {
        this.game = game;
        this.selected = [];
        this.gridEl = document.getElementById('char-grid');
        this.playBtn = document.getElementById('btn-play');
        this.playBtn.addEventListener('click', () => this.onPlayClick());
    }
    render() {
        const data = this.game.playerData;
        if (!data) return;
        document.getElementById('player-name').textContent = data.displayName;
        document.getElementById('profile-level').textContent = data.stats.level;
        document.getElementById('profile-coins').textContent = data.stats.coins;
        document.getElementById('profile-wins').textContent = data.stats.wins;
        document.getElementById('profile-losses').textContent = data.stats.losses;
        this.renderGrid(data.roster);
    }
    renderGrid(playerRoster) {
        this.gridEl.innerHTML = '';
        this.selected = [];
        this.updatePlayButton();
        const unlockedIds = new Set(playerRoster.map(r => r.charId));
        ROSTER.forEach(char => {
            const isUnlocked = unlockedIds.has(char.id);
            const playerChar = playerRoster.find(r => r.charId === char.id);
            const level = playerChar ? playerChar.level : 1;
            const el = document.createElement('div');
            el.className = `char-card ${!isUnlocked ? 'locked' : ''}`;
            el.innerHTML = `<span class="icon">${char.icon}</span><span class="name">${char.name}</span><div class="rarity rarity-${char.rarity || 'common'}">${(char.rarity || 'common').toUpperCase()}</div>${isUnlocked ? `<small style="color:#888">Lv.${level}</small>` : '<small style="color:#555">Bloqueado</small>'}`;
            if (isUnlocked) el.addEventListener('click', () => this.toggleSelection(char, el));
            this.gridEl.appendChild(el);
        });
    }
    toggleSelection(char, el) {
        if (this.selected.includes(char)) { this.selected = this.selected.filter(c => c !== char); el.classList.remove('selected'); }
        else if (this.selected.length < 2) { this.selected.push(char); el.classList.add('selected'); }
        this.updatePlayButton();
    }
    updatePlayButton() {
        if (this.selected.length === 2) { this.playBtn.disabled = false; this.playBtn.textContent = 'INICIAR BATALHA'; }
        else { this.playBtn.disabled = true; this.playBtn.textContent = 'SELECIONE 2'; }
    }
    onPlayClick() {
        if (this.selected.length !== 2) return;
        const roster = this.game.playerData.roster;
        const p1Data = roster.find(r => r.charId === this.selected[0].id);
        const p2Data = roster.find(r => r.charId === this.selected[1].id);
        this.game.startBattle(
            { ...this.selected[0], playerLevel: p1Data?.level || 1 },
            { ...this.selected[1], playerLevel: p2Data?.level || 1 }
        );
    }
}