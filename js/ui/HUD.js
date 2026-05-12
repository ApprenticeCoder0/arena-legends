/**
 * HUD.js
 * 
 * Responsabilidade: Interface durante a batalha.
 */

export class HUD {
    constructor(game) {
        this.game = game;
        this.battleActive = false;
    }

    initBattle() {
        this.battleActive = true;
        const [p1, p2] = this.game.selectedChars;

        document.getElementById('n1').textContent = `${p1.name} Lv.${p1.playerLevel}`;
        document.getElementById('n2').textContent = `${p2.name} Lv.${p2.playerLevel}`;

        this.updateBars(100, 0, 100, 0);
    }

    updateBars(hp1, mana1, hp2, mana2) {
        document.getElementById('h1').style.width = `${Math.max(0, hp1)}%`;
        document.getElementById('m1').style.width = `${Math.max(0, mana1)}%`;
        document.getElementById('h2').style.width = `${Math.max(0, hp2)}%`;
        document.getElementById('m2').style.width = `${Math.max(0, mana2)}%`;
    }

    showFinalText(text, color = '#fff') {
        const el = document.getElementById('final-text');
        el.textContent = text;
        el.style.color = color;
        el.classList.add('visible');
        setTimeout(() => el.classList.remove('visible'), 3000);
    }
}
