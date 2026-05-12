/**
 * Fighter.js
 * 
 * Responsabilidade: Representar uma entidade de combate.
 * Mudança arquitetural: Os stats base vêm do banco (roster do jogador).
 * O level do personagem modifica esses stats. Nada está hardcoded por ID aqui.
 */

export class Fighter {
    constructor(charTemplate, playerLevel = 1, isPlayer = true) {
        // Template vem do ROSTER global (dados estáticos do jogo)
        this.template = charTemplate;
        this.isPlayer = isPlayer;

        // Stats escaláveis (modificados pelo level do jogador)
        this.level = playerLevel;
        this.baseHp = charTemplate.hp;
        this.baseSpeed = charTemplate.speed;
        this.baseDamage = charTemplate.damage || 30;

        // Estado de combate
        this.x = isPlayer ? 100 : 900;
        this.y = 300;
        this.r = 30;
        this.vx = 0;
        this.vy = 0;

        this.maxHp = this.calculateMaxHp();
        this.hp = this.maxHp;
        this.mana = 0;
        this.state = 'idle';
        this.iframes = 0;
        this.stunTimer = 0;

        // Modificadores temporários (buffs/debuffs)
        this.buffs = [];
    }

    calculateMaxHp() {
        // Fórmula de scaling: +8% por nível
        return Math.floor(this.baseHp * (1 + (this.level - 1) * 0.08));
    }

    calculateSpeed() {
        return this.baseSpeed * (1 + (this.level - 1) * 0.02);
    }

    update(enemy, deltaTime) {
        if (this.iframes > 0) this.iframes--;
        if (this.stunTimer > 0) { this.stunTimer--; return; }

        // Regen de mana passiva
        if (this.state !== 'cast') {
            this.mana = Math.min(100, this.mana + (100 / this.template.cd) * 4);
        }

        // Movimento básico (IA simples ou input do jogador)
        if (this.state === 'idle') {
            this.basicMovement(enemy);
        }

        // Wall collision
        this.x = Math.max(this.r, Math.min(1000 - this.r, this.x));
        this.y = Math.max(this.r, Math.min(600 - this.r, this.y));
    }

    basicMovement(enemy) {
        // IA muito básica: move em direção ao inimigo com variação
        const dx = enemy.x - this.x;
        const dy = enemy.y - this.y;
        const dist = Math.hypot(dx, dy);
        const speed = this.calculateSpeed();

        if (dist > 80) {
            this.vx = (dx / dist) * speed + (Math.random() - 0.5) * 2;
            this.vy = (dy / dist) * speed + (Math.random() - 0.5) * 2;
        } else {
            // Orbita o inimigo
            this.vx = -(dy / dist) * speed;
            this.vy = (dx / dist) * speed;
        }

        this.x += this.vx;
        this.y += this.vy;
    }

    takeDamage(amount, source) {
        if (this.iframes > 0 || source === this) return;

        // Aplica buffs de defesa
        const reduction = this.buffs.reduce((acc, b) => acc + (b.defense || 0), 0);
        const finalDamage = Math.max(1, Math.floor(amount * (1 - reduction)));

        this.hp -= finalDamage;
        this.iframes = 10;

        // Evento para o sistema de partículas/HUD
        window.dispatchEvent(new CustomEvent('combat:damage', {
            detail: { target: this, amount: finalDamage, x: this.x, y: this.y }
        }));

        return finalDamage;
    }

    draw(ctx) {
        ctx.save();
        if (this.iframes > 0 && Date.now() % 100 < 50) ctx.globalAlpha = 0.5;

        const g = ctx.createRadialGradient(this.x - 5, this.y - 5, 2, this.x, this.y, this.r);
        g.addColorStop(0, '#fff');
        g.addColorStop(0.5, this.template.color);
        g.addColorStop(1, '#000');

        ctx.shadowBlur = 20;
        ctx.shadowColor = this.template.glow;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.fillStyle = '#fff';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.template.icon, this.x, this.y);

        // Indicador de level
        ctx.fillStyle = '#00ff66';
        ctx.font = 'bold 10px Arial';
        ctx.fillText(`Lv.${this.level}`, this.x, this.y + this.r + 12);

        ctx.restore();
    }
}
