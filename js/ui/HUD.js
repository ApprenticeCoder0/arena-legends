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
        document.getElementById('h1').style.width = '100%';
        document.getElementById('h2').style.width = '100%';
        document.getElementById('m1').style.width = '0%';
        document.getElementById('m2').style.width = '0%';
    }
}