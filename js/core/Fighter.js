export class Fighter {
    constructor(charTemplate, playerLevel = 1, isPlayer = true) {
        this.template = charTemplate;
        this.isPlayer = isPlayer;
        this.level = playerLevel;
        this.baseHp = charTemplate.hp;
        this.baseSpeed = charTemplate.speed;
        this.baseDamage = charTemplate.damage || 30;
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
        this.buffs = [];
        this.usedFinal = false;
        this.isClone = false;
        this.adaptationActive = false;
        this.adaptationStack = 0;
        this.mugenActive = false;
        this.flashMode = false;
        this.flashSpeedMult = 1;
        this.yinEnergy = 0;
        this.yinFinalUses = 0;
        this.rageMode = false;
        this.stage = 1;
        this.bounces = 0;
        this.dashTimer = 0;
        this.dashSteps = 0;
        this.pathQueue = null;
    }
    calculateMaxHp() { return Math.floor(this.baseHp * (1 + (this.level - 1) * 0.08)); }
    calculateSpeed() { return this.baseSpeed * (1 + (this.level - 1) * 0.02); }
    calculateDamage() { return this.baseDamage * (1 + (this.level - 1) * 0.05); }
    calculateManaRegen() { return (100 / this.template.cd) * 4 * (1 + (this.level - 1) * 0.03); }
    update(enemy, deltaTime) {
        if (this.iframes > 0) this.iframes--;
        if (this.stunTimer > 0) { this.stunTimer--; return; }
        if (this.template.id === 'hulk') this.hp = Math.min(this.maxHp, this.hp + 0.3);
        if (this.template.id === 'flash') {
            if (this.flashSpeedMult >= 5 && !this.usedFinal && this.hp < this.maxHp * 0.5) {
                this.mana = 100; this.cast(enemy, true); this.flashSpeedMult = 1;
            }
        }
        if (this.template.id === 'broly' && this.stage === 1 && this.hp <= this.maxHp * 0.35) {
            this.stage = 2; this.hp += 200; this.mana = 100;
            this.template.icon = '🔥'; this.template.color = '#ADFF2F'; this.template.glow = '#00FF00';
            this.template.speed += 3;
            this.template.s1 = 'PLANET CRUSHER'; this.template.s2 = 'BLASTER SHELL'; this.template.final = 'CATASTROPHE';
            this.usedFinal = false;
        }
        if (this.state === 'zenitsu_dash') { if (this.dashTimer > 0) this.dashTimer--; else this.state = 'idle'; return; }
        if (this.state === 'vortex') { this.x = 500; this.y = 300; this.vx = 0; this.vy = 0; this.dashTimer--; if (this.dashTimer <= 0) this.state = 'idle'; return; }
        if (this.state !== 'cast' && !this.isClone) {
            this.mana = Math.min(100, this.mana + this.calculateManaRegen());
            let triggerThreshold = (this.template.id === 'broly' && this.stage === 2) ? 0.9 : 0.5;
            let canUseFinal = (this.template.id === 'yin' && this.yinFinalUses < 2) || (this.template.id !== 'yin' && !this.usedFinal);
            if (this.hp <= this.maxHp * triggerThreshold && canUseFinal && this.mana >= 100) this.cast(enemy, true);
            else if (this.mana >= 100 && this.state === 'idle') this.cast(enemy, false);
        }
        if (this.state !== 'cast') {
            let spd = this.calculateSpeed() * (this.template.id === 'flash' ? this.flashSpeedMult : 1);
            this.x += this.vx * spd / this.baseSpeed;
            this.y += this.vy * spd / this.baseSpeed;
            let wallHit = false;
            if (this.x < this.r) { this.x = this.r; this.vx = Math.abs(this.vx); wallHit = true; }
            if (this.x > 1000 - this.r) { this.x = 1000 - this.r; this.vx = -Math.abs(this.vx); wallHit = true; }
            if (this.y < this.r) { this.y = this.r; this.vy = Math.abs(this.vy); wallHit = true; }
            if (this.y > 600 - this.r) { this.y = 600 - this.r; this.vy = -Math.abs(this.vy); wallHit = true; }
            if (wallHit && this.template.id === 'flash') {
                this.flashSpeedMult += 0.5;
                window.dispatchEvent(new CustomEvent('fx:text', { detail: { x: this.x, y: this.y, text: 'SPEED UP!', color: '#ff0' } }));
                window.dispatchEvent(new CustomEvent('fx:lightning', { detail: { x1: this.x, y1: this.y, x2: this.x - this.vx * 10, y2: this.y - this.vy * 10 } }));
            }
            if (this.state === 'dashing' && this.template.id === 'zenitsu' && wallHit) {
                if (this.bounces < 4) {
                    this.bounces++; window.dispatchEvent(new CustomEvent('fx:shake', { detail: 5 }));
                    let a = Math.atan2(enemy.y - this.y, enemy.x - this.x);
                    let s = 40 + (this.bounces * 5); this.vx = Math.cos(a) * s; this.vy = Math.sin(a) * s;
                    window.dispatchEvent(new CustomEvent('fx:lightning', { detail: { x1: this.x, y1: this.y, x2: this.x - this.vx, y2: this.y - this.vy } }));
                } else { this.state = 'idle'; this.vx *= 0.1; this.vy *= 0.1; }
            }
        }
        if (this.flashMode) {
            this.dashTimer--; if (this.dashTimer <= 0) { this.flashMode = false; this.state = 'idle'; }
            window.dispatchEvent(new CustomEvent('fx:particle', { detail: { x: this.x, y: this.y, vx: 0, vy: 0, life: 10, color: '#ff0', size: 8 } }));
        }
        if (Math.random() > 0.8) {
            window.dispatchEvent(new CustomEvent('fx:particle', { detail: { x: this.x, y: this.y, vx: 0, vy: 0, life: 15, color: this.template.glow, size: 4 } }));
        }
    }
    cast(enemy, isFinal) {
        this.mana = 0; this.state = 'cast';
        if (isFinal) {
            if (this.template.id === 'yin') { this.yinFinalUses++; if (this.yinEnergy >= 100) { this.template.final = "DIVINE VOID"; this.hp += 150; } else this.template.final = "REALITY SHIFT"; }
            else { this.usedFinal = true; this.hp += 50; }
            window.dispatchEvent(new CustomEvent('fx:finalText', { detail: { text: this.template.final, color: this.template.color } }));
            window.dispatchEvent(new CustomEvent('fx:shake', { detail: 30 }));
        }
        let skillName = isFinal ? this.template.final : (Math.random() > 0.5 ? this.template.s1 : this.template.s2);
        if (this.template.id === 'flash' && !isFinal) skillName = "SPEEDFORCE RUSH";
        if (!isFinal) window.dispatchEvent(new CustomEvent('fx:text', { detail: { x: this.x, y: this.y - 40, text: skillName, color: this.template.glow } }));
        window.dispatchEvent(new CustomEvent('battle:cast', { detail: { caster: this, enemy, isFinal, skillName } }));
    }
    takeDamage(amount, source) {
        if (this.iframes > 0 || source === this) return;
        if (this.template.id === 'mahoraga' && this.adaptationActive) {
            let heal = amount * 0.33; this.hp = Math.min(this.maxHp, this.hp + heal); amount *= 0.5;
            window.dispatchEvent(new CustomEvent('fx:text', { detail: { x: this.x, y: this.y - 30, text: 'ADAPTED', color: '#FFD700' } }));
        }
        if (this.template.id === 'wukong' && this.state === 'cast' && Math.random() < 0.5) {
            if (source) source.takeDamage(amount * 2, this);
            window.dispatchEvent(new CustomEvent('fx:text', { detail: { x: this.x, y: this.y - 30, text: 'COUNTER!', color: '#ffd700' } }));
            return;
        }
        if (this.template.id === 'goku_mui' && Math.random() < 0.4) {
            this.x = Math.max(25, Math.min(975, this.x + (Math.random() - 0.5) * 150));
            this.y = Math.max(25, Math.min(575, this.y + (Math.random() - 0.5) * 150));
            window.dispatchEvent(new CustomEvent('fx:text', { detail: { x: this.x, y: this.y - 20, text: 'DODGE', color: '#ccc' } }));
            return;
        }
        this.hp -= amount; this.iframes = 10;
        window.dispatchEvent(new CustomEvent('fx:damage', { detail: { target: this, amount, x: this.x, y: this.y } }));
    }
    draw(ctx) {
        ctx.save();
        if (this.iframes > 0 && Date.now() % 100 < 50) ctx.globalAlpha = 0.5;
        if (this.mugenActive) {
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(this.x, this.y, 80, 0, Math.PI * 2); ctx.stroke();
            ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fill();
        }
        let g = ctx.createRadialGradient(this.x - 5, this.y - 5, 2, this.x, this.y, this.r);
        g.addColorStop(0, '#fff'); g.addColorStop(0.5, this.template.color); g.addColorStop(1, '#000');
        ctx.shadowBlur = 20; ctx.shadowColor = this.template.glow;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
        if (this.template.id === 'mahoraga') {
            ctx.save(); ctx.translate(this.x, this.y - 40); ctx.rotate(Date.now() / 500);
            ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI * 2); ctx.stroke();
            for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(15, 0); ctx.stroke(); ctx.rotate(Math.PI / 4); }
            ctx.restore();
        }
        ctx.shadowBlur = 0; ctx.fillStyle = '#fff'; ctx.font = '20px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(this.template.icon, this.x, this.y);
        if (this.isClone) ctx.fillText("C", this.x + 10, this.y + 10);
        ctx.fillStyle = '#00ff66'; ctx.font = 'bold 10px Arial';
        ctx.fillText(`Lv.${this.level}`, this.x, this.y + this.r + 12);
        if (this.state === 'cast') { ctx.strokeStyle = this.template.glow; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(this.x, this.y, this.r + 8, 0, Math.PI * 2); ctx.stroke(); }
        ctx.restore();
    }
}