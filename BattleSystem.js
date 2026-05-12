import { Fighter } from './Fighter.js';

export class BattleSystem {
    constructor(game, p1Template, p2Template) {
        this.game = game;
        this.canvas = document.getElementById('arena');
        this.ctx = this.canvas.getContext('2d', { alpha: false });
        this.canvas.width = 1000; this.canvas.height = 600;
        this.running = false;
        this.shake = 0;
        this.objs = [];
        this.parts = [];
        this.texts = [];
        this.activeDomainOwner = null;
        this.p1_allies = [];
        this.p2_allies = [];
        this.p1 = new Fighter(p1Template, p1Template.playerLevel || 1, true);
        this.p2 = new Fighter(p2Template, p2Template.playerLevel || 1, false);
        this.p1_allies = [this.p1];
        this.p2_allies = [this.p2];
    }
    start() {
        this.running = true;
        document.getElementById('n1').textContent = this.p1.template.name;
        document.getElementById('n2').textContent = this.p2.template.name;
        this.loop();
    }
    stop() { this.running = false; }
    spawnText(x, y, text, color, size = 20) { this.texts.push({ x, y, text: text.toString(), color, life: 50, size }); }
    showFinalText(text, color) {
        const el = document.getElementById('final-text');
        el.textContent = text; el.style.color = color; el.classList.add('visible');
        setTimeout(() => el.classList.remove('visible'), 2000);
    }
    spawnLightning(x1, y1, x2, y2) { this.objs.push({ type: 'lightning', x1, y1, x2, y2, life: 10 }); }
    handleSkill(caster, enemy, isFinal, skillName) {
        setTimeout(() => {
            if (caster.template.id !== 'gojo' && caster.template.id !== 'yin') caster.state = 'idle';
            else if (!caster.mugenActive) caster.state = 'idle';
            let id = caster.template.id;
            let ang = Math.atan2(enemy.y - caster.y, enemy.x - caster.x);
            let spX = caster.x + Math.cos(ang) * 45;
            let spY = caster.y + Math.sin(ang) * 45;
            if ((id === 'gojo' && skillName === 'MUGEN') || (id === 'yin' && skillName === 'ABSORB BARRIER')) {
                caster.mugenActive = true;
                setTimeout(() => {
                    caster.mugenActive = false; caster.state = 'idle';
                    if (id === 'gojo') {
                        this.objs.forEach(o => { if (o.type === 'orbiting' && o.captor === caster) { o.type = 'tracking_proj'; o.target = enemy; o.owner = caster; o.color = '#f00'; o.life = 100; o.speed = 25; } });
                        this.spawnText(caster.x, caster.y, 'RED REVERSAL', '#f00');
                    } else {
                        this.objs.forEach(o => { if (o.type === 'orbiting' && o.captor === caster) { o.type = 'pixel_dust'; caster.yinEnergy += 20; } });
                        this.spawnText(caster.x, caster.y, 'ABSORBED', '#fff');
                    }
                    this.shake = 10;
                }, 3000); return;
            }
            if (isFinal) {
                if (id === 'flash') { caster.flashMode = true; caster.dashTimer = 300; caster.flashSpeedMult = 2; caster.vx = Math.cos(ang) * 30; caster.vy = Math.sin(ang) * 30; this.spawnText(caster.x, caster.y, 'INFINITE MASS!', '#ff0'); }
                else if (id === 'hulk') { caster.rageMode = true; caster.mana = 100; this.spawnText(caster.x, caster.y, 'WORLD BREAKER', '#0f0'); }
                else if (id === 'mahoraga') { this.shake = 50; caster.adaptationActive = true; caster.adaptationStack = 5; this.objs.push({ type: 'dharma_slash', owner: caster, x: spX, y: spY, vx: Math.cos(ang) * 25, vy: Math.sin(ang) * 25, angle: ang, life: 80, dmg: 250, ignoreDef: true, scale: 2 }); }
                else if (id === 'giorno') { document.getElementById('domain-overlay').style.background = 'rgba(255,215,0,0.3)'; document.getElementById('domain-overlay').style.opacity = 1; enemy.x = 500; enemy.y = 300; enemy.vx = 0; enemy.vy = 0; enemy.mana = 0; this.spawnText(500, 300, 'RETURN TO ZERO', '#FFD700', 60); setTimeout(() => { document.getElementById('domain-overlay').style.opacity = 0; enemy.takeDamage(200, caster, this); }, 2000); }
                else if (id === 'garou') { this.shake = 80; this.fireBeam(caster, spX, spY, enemy, '#4B0082', '#000', 150); enemy.takeDamage(250, caster, this); }
                else if (id === 'kaguya') { this.objs.push({ type: 'omega_explosion', x: enemy.x, y: enemy.y, r: 10, maxR: 400, life: 200, color: '#000', owner: caster, dmg: 300 }); }
                else if (id === 'featherine') { enemy.hp = 1; this.spawnText(enemy.x, enemy.y, 'SCRIPT REWRITTEN: HP=1', '#A020F0'); }
                else if (id === 'wukong') { for (let i = 0; i < 4; i++) { let clone = new Fighter(caster.template, caster.level, caster.isP1); clone.isClone = true; clone.hp = caster.maxHp; clone.x = caster.x + (Math.random() - 0.5) * 100; clone.y = caster.y + (Math.random() - 0.5) * 100; clone.vx = (Math.random() - 0.5) * 10; clone.vy = (Math.random() - 0.5) * 10; if (caster.isP1) this.p1_allies.push(clone); else this.p2_allies.push(clone); } }
                else if (id === 'yin') { if (skillName === 'DIVINE VOID') { document.getElementById('domain-overlay').style.background = '#000'; document.getElementById('domain-overlay').style.opacity = 1; this.shake = 100; setTimeout(() => { document.getElementById('domain-overlay').style.opacity = 0; enemy.takeDamage(999, caster, this); }, 1000); } else { this.objs.push({ type: 'omega_explosion', x: enemy.x, y: enemy.y, r: 10, maxR: 400, life: 100, color: '#000', owner: caster, dmg: 200 }); } }
                else if (id === 'antimonitor') { this.shake = 60; this.objs.push({ type: 'antimatter_wave', owner: caster, x: 0, y: 0, w: 1000, h: 600, life: 60 }); enemy.takeDamage(300, caster, this); }
                else if (id === 'sukuna') { document.getElementById('domain-overlay').style.background = 'rgba(100,0,0,0.3)'; document.getElementById('domain-overlay').style.opacity = 1; for (let i = 0; i < 40; i++) { setTimeout(() => { this.objs.push({ type: 'cleave_hd', owner: caster, x: enemy.x + (Math.random() - 0.5) * 120, y: enemy.y + (Math.random() - 0.5) * 120, vx: 0, vy: 0, angle: Math.random(), life: 15, sureHit: true, color: '#000' }); enemy.takeDamage(20, caster, this); this.shake = 5; }, i * 30); } setTimeout(() => document.getElementById('domain-overlay').style.opacity = 0, 2500); }
                else if (id === 'gojo') { document.getElementById('domain-overlay').style.background = 'rgba(255,255,255,0.8)'; document.getElementById('domain-overlay').style.opacity = 1; enemy.stunTimer = 300; enemy.stunImmunity = 0; setTimeout(() => { document.getElementById('domain-overlay').style.opacity = 0; this.objs.push({ type: 'hollow_purple', owner: caster, x: spX, y: spY, vx: Math.cos(ang) * 15, vy: Math.sin(ang) * 15, life: 100, tick: 0, scale: 5.0, dmgMult: 3.0 }); }, 1500); }
                else if (id === 'broly') { this.shake = 100; for (let i = 0; i < 6; i++) { setTimeout(() => { this.objs.push({ type: 'broly_meteor', x: Math.random() * 1000, y: Math.random() * 600, r: 10, maxR: 250, life: 100, color: '#0f0', owner: caster, dmg: 150 }); }, i * 250); } }
                else if (id === 'goku_mui') { caster.iframes = 300; this.objs.push({ type: 'kame_head', owner: caster, x: spX, y: spY, vx: Math.cos(ang) * 35, vy: Math.sin(ang) * 35, life: 80, scale: 3.0 }); }
                else if (id === 'alucard') { document.getElementById('domain-overlay').style.background = 'rgba(100,0,0,0.5)'; document.getElementById('domain-overlay').style.opacity = 1; for (let i = 0; i < 20; i++) setTimeout(() => this.objs.push({ type: 'baskerville', owner: caster, x: spX, y: spY, target: enemy, life: 100 }), i * 100); setTimeout(() => document.getElementById('domain-overlay').style.opacity = 0, 3000); }
                else if (id === 'zenitsu') { caster.state = 'dashing'; caster.dashTimer = 0; caster.bounces = 0; caster.vx = Math.cos(ang) * 70; caster.vy = Math.sin(ang) * 70; }
                else if (id === 'saitama') { this.objs.push({ type: 'serious_punch', owner: caster, x: spX, y: spY, vx: Math.cos(ang) * 60, vy: Math.sin(ang) * 60, life: 50, killMode: true }); }
                else { this.objs.push({ type: 'omega_explosion', x: enemy.x, y: enemy.y, r: 10, maxR: 350, life: 100, color: caster.template.glow, owner: caster, dmg: 150 }); }
                return;
            }
            if (id === 'hulk') {
                if (skillName === 'THUNDERCLAP') { this.shake = 20; enemy.takeDamage(50, caster, this); this.objs.push({ type: 'gamma_wave', x: caster.x, y: caster.y, r: 10, maxR: 300, life: 50, color: '#0f0', owner: caster }); }
                else { for (let i = 0; i < 5; i++) setTimeout(() => { this.objs.push({ type: 'debris', x: spX, y: spY - 300, vx: (Math.random() - 0.5) * 5, vy: 15 + Math.random() * 10, life: 60, owner: caster }); }, i * 100); }
            } else if (id === 'mahoraga') {
                if (skillName === 'DHARMA SLASH') this.objs.push({ type: 'dharma_slash', owner: caster, x: spX, y: spY, vx: Math.cos(ang) * 22, vy: Math.sin(ang) * 22, angle: ang, life: 50 });
                else { caster.adaptationActive = true; caster.adaptationStack++; this.spawnText(caster.x, caster.y, 'ADAPTATION', '#FFD700'); this.objs.push({ type: 'mahoraga_wheel', owner: caster, life: 60 }); }
            } else if (id === 'yin') {
                if (skillName === 'TAO DRAGON') {
                    this.objs.push({ type: 'yin_yang_proj', owner: caster, x: spX, y: spY, vx: Math.cos(ang) * 18, vy: Math.sin(ang) * 18, life: 80, color: '#fff' });
                    this.objs.push({ type: 'yin_yang_proj', owner: caster, x: spX, y: spY, vx: Math.cos(ang + 0.3) * 18, vy: Math.sin(ang + 0.3) * 18, life: 80, color: '#000' });
                } else this.objs.push({ type: 'yin_zone', owner: caster, x: caster.x, y: caster.y, r: 150, life: 100 });
            } else if (id === 'flash') { caster.state = 'zenitsu_dash'; caster.dashSteps = 10; }
            else if (id === 'giorno') {
                if (skillName === 'LIFE SHOT') { caster.standActive = true; setTimeout(() => caster.standActive = false, 1000); this.objs.push({ type: 'tracking_proj', owner: caster, target: enemy, x: spX, y: spY, color: '#FFD700', life: 100, speed: 15 }); }
                else for (let i = 0; i < 10; i++) setTimeout(() => enemy.takeDamage(6, caster, this), i * 40);
            } else if (id === 'garou') {
                if (skillName === 'NUCLEAR FISSION') this.objs.push({ type: 'omega_explosion', x: spX, y: spY, r: 10, maxR: 150, life: 40, color: '#4B0082', owner: caster, dmg: 90 });
                else { caster.template.s1 = 'COPIED'; this.spawnText(caster.x, caster.y, 'MODE COPY', '#fff'); }
            } else if (id === 'kaguya') {
                if (skillName === 'ASH BONES') this.proj(caster, spX, spY, enemy, 'bone');
                else { enemy.x = Math.random() * 1000; enemy.y = Math.random() * 600; this.spawnText(enemy.x, enemy.y, 'DIMENSION SHIFT', '#000'); enemy.takeDamage(40, caster, this); }
            } else if (id === 'featherine') {
                if (skillName === 'PLOT REWRITE') { enemy.hp -= 50; this.spawnText(enemy.x, enemy.y, 'HP-50', '#000'); }
                else { enemy.vx = 0; enemy.vy = 0; this.spawnText(enemy.x, enemy.y, 'PAUSE', '#000'); }
            } else if (id === 'antimonitor') {
                if (skillName === 'ANTIMATTER WAVE') this.objs.push({ type: 'cleave_hd', owner: caster, x: spX, y: spY, vx: Math.cos(ang) * 12, vy: Math.sin(ang) * 12, angle: ang, life: 100, color: '#fff', width: 20 });
                else for (let i = 0; i < 4; i++) setTimeout(() => this.objs.push({ type: 'skull', owner: caster, x: spX, y: spY, vx: Math.cos(ang + (Math.random() - 0.5)) * 12, vy: Math.sin(ang + (Math.random() - 0.5)) * 12, life: 70 }), i * 150);
            } else if (id === 'sukuna') {
                if (skillName === 'DISMANTLE NET') { for (let i = -2; i <= 2; i++) { let s = ang + i * 0.2; this.objs.push({ type: 'cleave_hd', owner: caster, x: spX, y: spY, vx: Math.cos(s) * 20, vy: Math.sin(s) * 20, angle: s, life: 60 }); } }
                else this.objs.push({ type: 'fire_arrow_charge', owner: caster, x: spX, y: spY, vx: Math.cos(ang) * 18, vy: Math.sin(ang) * 18, life: 100 });
            } else if (id === 'broly') {
                if (caster.stage === 2) {
                    if (skillName === 'PLANET CRUSHER') this.objs.push({ type: 'omega_explosion', x: spX, y: spY, r: 10, maxR: 180, life: 100, color: '#0f0', owner: caster, dmg: 120 });
                    else for (let i = 0; i < 10; i++) this.objs.push({ type: 'broly_ball', owner: caster, x: spX, y: spY, vx: Math.cos(ang + (Math.random() - 0.5)) * 25, vy: Math.sin(ang + (Math.random() - 0.5)) * 25, life: 80, grow: false });
                } else {
                    if (skillName === 'OMEGA BLASTER') this.objs.push({ type: 'broly_ball', owner: caster, x: spX, y: spY, vx: Math.cos(ang) * 15, vy: Math.sin(ang) * 15, life: 100, grow: true });
                    else for (let i = 0; i < 6; i++) setTimeout(() => this.objs.push({ type: 'broly_ball', owner: caster, x: spX, y: spY, vx: Math.cos(ang + (Math.random() - 0.5)) * 20, vy: Math.sin(ang + (Math.random() - 0.5)) * 20, life: 60 }), i * 50);
                }
            } else if (id === 'zenitsu') {
                if (skillName === 'SIXFOLD') {
                    caster.state = 'zenitsu_dash'; caster.dashSteps = 6;
                    let dashInt = setInterval(() => {
                        caster.dashSteps--; caster.x += (Math.random() - 0.5) * 300; caster.y += (Math.random() - 0.5) * 300;
                        caster.x = Math.max(50, Math.min(950, caster.x)); caster.y = Math.max(50, Math.min(550, caster.y));
                        this.spawnLightning(caster.x, caster.y, enemy.x, enemy.y);
                        if (caster.dashSteps <= 0) { clearInterval(dashInt); caster.state = 'idle'; caster.x = enemy.x - 50; caster.y = enemy.y; enemy.takeDamage(60, caster, this); }
                    }, 80);
                } else { caster.state = 'dashing'; caster.dashTimer = 100; caster.bounces = 0; caster.vx = Math.cos(ang) * 40; caster.vy = Math.sin(ang) * 40; }
            } else if (id === 'goku_mui') {
                if (skillName === 'KAMEHAMEHA') this.objs.push({ type: 'kame_head', owner: caster, x: spX, y: spY, vx: Math.cos(ang) * 30, vy: Math.sin(ang) * 30, life: 60 });
                else this.objs.push({ type: 'spirit_bomb', owner: caster, target: enemy, x: spX, y: spY - 100, life: 100 });
            } else if (id === 'wukong') {
                if (skillName === 'RUYI EXTEND') this.objs.push({ type: 'wukong_staff', owner: caster, angle: ang, len: 0, maxLen: 1200, width: 40, life: 30 });
                else { caster.state = 'cast'; this.spawnText(caster.x, caster.y, 'COUNTER STANCE', '#fff'); setTimeout(() => caster.state = 'idle', 1000); }
            } else if (id === 'alucard') {
                if (skillName === 'BASKERVILLE') this.objs.push({ type: 'baskerville', owner: caster, x: spX, y: spY, target: enemy, life: 100 });
                else for (let i = 0; i < 3; i++) setTimeout(() => this.proj(caster, spX, spY, enemy, 'bullet'), i * 100);
            } else if (id === 'saitama') {
                if (skillName === 'SERIOUS PUNCH') this.objs.push({ type: 'serious_punch', owner: caster, x: spX, y: spY, vx: Math.cos(ang) * 45, vy: Math.sin(ang) * 45, life: 40 });
                else { this.shake = 30; enemy.takeDamage(50, caster, this); this.spawnText(enemy.x, enemy.y, 'TABLE FLIP', '#fff'); }
            } else if (id === 'gojo') this.objs.push({ type: 'hollow_purple', owner: caster, x: spX, y: spY, vx: Math.cos(ang) * 15, vy: Math.sin(ang) * 15, life: 80, tick: 0 });
            else if (id === 'kratos') {
                if (skillName === 'AXE THROW') this.objs.push({ type: 'leviathan_axe', owner: caster, x: spX, y: spY, vx: Math.cos(ang) * 22, vy: Math.sin(ang) * 22, angle: 0, life: 80 });
                else { enemy.takeDamage(30, caster, this); this.shake = 10; }
            } else this.proj(caster, spX, spY, enemy, 'generic');
        }, 600);
    }
    fireBeam(o, sx, sy, t, c, g, w) {
        let a = Math.atan2(t.y - sy, t.x - sx);
        this.objs.push({ type: 'beam', sx, sy, ex: sx + Math.cos(a) * 1000, ey: sy + Math.sin(a) * 1000, c, g, w, life: 20, owner: o });
        t.takeDamage(50, o, this); this.shake = 15;
    }
    proj(o, x, y, t, type) { let a = Math.atan2(t.y - y, t.x - x); this.objs.push({ type: 'proj', k: type, x, y, vx: Math.cos(a) * 18, vy: Math.sin(a) * 18, o, life: 60 }); }
    loop() {
        if (!this.running) return;
        let tx = 0, ty = 0; if (this.shake > 0) { tx = (Math.random() - 0.5) * this.shake; ty = (Math.random() - 0.5) * this.shake; this.shake *= 0.9; }
        this.ctx.setTransform(1, 0, 0, 1, tx, ty);
        this.ctx.fillStyle = 'rgba(5,5,5,0.4)'; this.ctx.fillRect(0, 0, 1000, 600);
        [...this.p1_allies, ...this.p2_allies].forEach(a => {
            if (a.state === 'zenitsu_dash' && a.pathQueue) {
                if (a.pathQueue.length > 0) { let target = a.pathQueue[0]; a.x += (target.x - a.x) * 0.3; a.y += (target.y - a.y) * 0.3; this.spawnLightning(a.x, a.y, a.x + (Math.random() - 0.5) * 100, a.y + (Math.random() - 0.5) * 100); if (Math.hypot(a.x - target.x, a.y - target.y) < 20) a.pathQueue.shift(); }
                else { a.state = 'idle'; let enemies = this.p1_allies.includes(a) ? this.p2_allies : this.p1_allies; enemies.forEach(e => e.takeDamage(50, a, this)); this.shake = 20; }
            }
            a.update(this.p1_allies.includes(a) ? this.p2 : this.p1, this);
        });
        this.p1_allies.forEach(a1 => {
            this.p2_allies.forEach(a2 => {
                if (a1.state !== 'dashing' && a2.state !== 'dashing') {
                    let dx = a2.x - a1.x, dy = a2.y - a1.y, dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < a1.r + a2.r) { let ang = Math.atan2(dy, dx); let v = 5; a1.vx = -Math.cos(ang) * v; a1.vy = -Math.sin(ang) * v; a2.vx = Math.cos(ang) * v; a2.vy = Math.sin(ang) * v; a1.takeDamage(2, a2, this); a2.takeDamage(2, a1, this); }
                }
                if (a1.state === 'dashing' && Math.hypot(a1.x - a2.x, a1.y - a2.y) < 60) a2.takeDamage(40, a1, this);
                if (a2.state === 'dashing' && Math.hypot(a2.x - a1.x, a2.y - a1.y) < 60) a1.takeDamage(40, a2, this);
            });
        });
        this.p1_allies.forEach(a => a.draw(this.ctx)); this.p2_allies.forEach(a => a.draw(this.ctx));
        this.ctx.globalCompositeOperation = 'lighter';
        for (let i = this.objs.length - 1; i >= 0; i--) {
            let o = this.objs[i]; o.life--;
            let enemies = (this.p1_allies.includes(o.owner)) ? this.p2_allies : this.p1_allies;
            if (o.type !== 'orbiting' && o.type !== 'wukong_staff' && o.type !== 'lightning' && o.type !== 'beam_split_fx' && !o.sureHit && o.type !== 'pixel_dust' && o.type !== 'antimatter_wave') {
                enemies.forEach(e => {
                    if (e.mugenActive && Math.hypot(o.x - e.x, o.y - e.y) < 100) {
                        if (o.type === 'beam' || o.type === 'kame_head') {
                            let dx = e.x - o.x, dy = e.y - o.y, ang = Math.atan2(dy, dx); let ix = o.x || o.sx; let iy = o.y || o.sy;
                            this.ctx.strokeStyle = o.c || '#0ff'; this.ctx.lineWidth = 2; this.ctx.beginPath(); this.ctx.moveTo(ix, iy); this.ctx.quadraticCurveTo(e.x - 100, e.y - 100, e.x, e.y - 200); this.ctx.stroke();
                            this.ctx.beginPath(); this.ctx.moveTo(ix, iy); this.ctx.quadraticCurveTo(e.x + 100, e.y + 100, e.x, e.y + 200); this.ctx.stroke();
                        } else { o.type = 'orbiting'; o.captor = e; o.orbAngle = Math.random(); o.orbDist = 40 + Math.random() * 20; o.life = 999; if (e.template.id === 'yin') { o.type = 'pixel_dust'; o.life = 20; e.yinEnergy += 20; this.spawnText(e.x, e.y, '+ENERGY', '#fff'); } }
                    }
                });
            }
            if (o.type !== 'yin_zone' && o.type !== 'beam') {
                enemies.forEach(e => {
                    if (e.template.id === 'yin' && e.state === 'reflecting' && Math.hypot(o.x - e.x, o.y - e.y) < 150) { o.vx *= -2; o.vy *= -2; o.owner = e; this.spawnText(e.x, e.y, 'REDIRECT', '#fff'); }
                });
            }
            if (o.type === 'orbiting') { o.orbAngle += 0.25; o.x = o.captor.x + Math.cos(o.orbAngle) * o.orbDist; o.y = o.captor.y + Math.sin(o.orbAngle) * o.orbDist; this.ctx.fillStyle = '#fff'; this.ctx.beginPath(); this.ctx.arc(o.x, o.y, 4, 0, Math.PI * 2); this.ctx.fill(); }
            else if (o.type === 'pixel_dust') { this.ctx.fillStyle = '#f00'; this.ctx.fillRect(o.x + (Math.random() - 0.5) * 20, o.y + (Math.random() - 0.5) * 20, 2, 2); }
            else if (o.type === 'gamma_wave') { this.ctx.strokeStyle = '#0f0'; this.ctx.lineWidth = 5; this.ctx.beginPath(); this.ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2); this.ctx.stroke(); o.r += 8; if (o.r > o.maxR) o.life = 0; enemies.forEach(e => { if (Math.hypot(o.x - e.x, o.y - e.y) < o.r + 20 && Math.hypot(o.x - e.x, o.y - e.y) > o.r - 20) { e.takeDamage(8, o.owner, this); e.vx += (e.x - o.x) * 0.2; e.vy += (e.y - o.y) * 0.2; } }); }
            else if (o.type === 'debris') { o.x += o.vx; o.y += o.vy; this.ctx.fillStyle = '#555'; this.ctx.fillRect(o.x, o.y, 25, 25); enemies.forEach(e => { if (Math.hypot(o.x - e.x, o.y - e.y) < 30) { e.takeDamage(50, o.owner, this); o.life = 0; } }); }
            else if (o.type === 'dharma_slash') { o.x += o.vx; o.y += o.vy; this.ctx.strokeStyle = '#FFD700'; this.ctx.lineWidth = 4; this.ctx.shadowBlur = 10; this.ctx.shadowColor = '#fff'; this.ctx.beginPath(); this.ctx.arc(o.x, o.y, 45, o.angle - 0.6, o.angle + 0.6); this.ctx.stroke(); enemies.forEach(e => { if (Math.hypot(o.x - e.x, o.y - e.y) < 45) { let d = o.dmg || 30; if (o.ignoreDef) { d *= 1.5; this.spawnText(e.x, e.y, 'PIERCED', '#f00'); } e.takeDamage(d, o.owner, this); o.life = 0; } }); }
            else if (o.type === 'flash_vortex') { this.ctx.strokeStyle = '#ff0'; this.ctx.lineWidth = 2; this.ctx.beginPath(); this.ctx.arc(o.x, o.y, 100, 0, Math.PI * 2); this.ctx.stroke(); enemies.forEach(e => { e.x += (o.x - e.x) * 0.1; e.y += (o.y - e.y) * 0.1; if (Math.hypot(o.x - e.x, o.y - e.y) < 100) e.takeDamage(3, o.owner, this); }); }
            else if (o.type === 'antimatter_wave') { o.x += 20; this.ctx.fillStyle = 'rgba(255,255,255,0.8)'; this.ctx.fillRect(o.x, 0, 50, 600); this.ctx.fillStyle = 'rgba(0,0,0,0.5)'; this.ctx.fillRect(o.x - 20, 0, 20, 600); enemies.forEach(e => { if (Math.abs(o.x - e.x) < 50) e.takeDamage(5, o.owner, this); }); }
            else if (o.type === 'yin_yang_proj') { o.x += o.vx; o.y += o.vy; this.ctx.fillStyle = o.color; this.ctx.beginPath(); this.ctx.arc(o.x, o.y, 15, 0, Math.PI * 2); this.ctx.fill(); this.ctx.strokeStyle = o.color === '#fff' ? '#000' : '#fff'; this.ctx.stroke(); enemies.forEach(e => { if (Math.hypot(o.x - e.x, o.y - e.y) < 30) { e.takeDamage(35, o.owner, this); o.life = 0; } }); }
            else if (o.type === 'mahoraga_wheel') { o.x = o.owner.x; o.y = o.owner.y - 50; this.ctx.save(); this.ctx.translate(o.x, o.y); this.ctx.rotate(Date.now() / 100); this.ctx.strokeStyle = '#FFD700'; this.ctx.lineWidth = 3; this.ctx.beginPath(); this.ctx.arc(0, 0, 20, 0, Math.PI * 2); this.ctx.stroke(); this.ctx.restore(); }
            else if (o.type === 'fire_arrow_charge') { o.x += o.vx; o.y += o.vy; this.ctx.fillStyle = '#ff4500'; this.ctx.beginPath(); this.ctx.moveTo(o.x, o.y); this.ctx.lineTo(o.x - 30, o.y - 15); this.ctx.lineTo(o.x - 30, o.y + 15); this.ctx.fill(); enemies.forEach(e => { if (Math.hypot(o.x - e.x, o.y - e.y) < 40) { this.objs.push({ type: 'omega_explosion', x: o.x, y: o.y, r: 10, maxR: 250, life: 40, color: '#ff4500', owner: o.owner, dmg: 120 }); o.life = 0; this.shake = 30; } }); }
            else if (o.type === 'tracking_proj') { let dx = o.target.x - o.x, dy = o.target.y - o.y, d = Math.sqrt(dx * dx + dy * dy); o.x += dx / d * o.speed; o.y += dy / d * o.speed; this.ctx.fillStyle = o.color; this.ctx.beginPath(); this.ctx.arc(o.x, o.y, 8, 0, Math.PI * 2); this.ctx.fill(); if (d < 30) { o.target.takeDamage(30, o.owner, this); o.life = 0; this.objs.push({ type: 'omega_explosion', x: o.x, y: o.y, r: 10, maxR: 100, life: 20, color: o.color }); } }
            else if (o.type === 'broly_meteor') { this.ctx.fillStyle = '#0f0'; this.ctx.beginPath(); this.ctx.arc(o.x, o.y, 40, 0, Math.PI * 2); this.ctx.fill(); if (o.life < 10) { this.objs.push({ type: 'omega_explosion', x: o.x, y: o.y, r: 10, maxR: 250, life: 60, color: '#0f0', owner: o.owner, dmg: 200 }); this.shake = 40; } }
            else if (o.type === 'chains') { this.ctx.strokeStyle = '#ffd700'; this.ctx.lineWidth = 3; this.ctx.beginPath(); this.ctx.moveTo(o.owner.x, o.owner.y); this.ctx.lineTo(o.target.x, o.target.y); this.ctx.stroke(); }
            else if (o.type === 'beam') { this.ctx.strokeStyle = o.c; this.ctx.lineWidth = o.w || 30; this.ctx.beginPath(); this.ctx.moveTo(o.sx, o.sy); this.ctx.lineTo(o.ex, o.ey); this.ctx.stroke(); this.ctx.strokeStyle = '#fff'; this.ctx.lineWidth = 10; this.ctx.stroke(); }
            else if (o.type === 'kame_head') { o.x += o.vx; o.y += o.vy; let scale = o.scale || 1; let grad = this.ctx.createLinearGradient(o.x, o.y, o.x - o.vx * 3, o.y - o.vy * 3); grad.addColorStop(0, 'rgba(0, 255, 255, 0.8)'); grad.addColorStop(1, 'rgba(0, 0, 255, 0)'); this.ctx.strokeStyle = grad; this.ctx.lineWidth = 50 * scale; this.ctx.lineCap = 'round'; this.ctx.beginPath(); this.ctx.moveTo(o.x, o.y); this.ctx.lineTo(o.x - o.vx * 3, o.y - o.vy * 3); this.ctx.stroke(); this.ctx.fillStyle = '#fff'; this.ctx.beginPath(); this.ctx.arc(o.x, o.y, 25 * scale, 0, Math.PI * 2); this.ctx.fill(); this.ctx.shadowBlur = 20; this.ctx.shadowColor = '#0ff'; enemies.forEach(e => { if (Math.hypot(o.x - e.x, o.y - e.y) < 50 * scale) { e.takeDamage(85, o.owner, this); this.objs.push({ type: 'omega_explosion', x: o.x, y: o.y, r: 10, maxR: 200 * scale, life: 30, color: '#0ff' }); o.life = 0; this.shake = 30; } }); }
            else if (o.type === 'wukong_staff') { o.len += 60; if (o.len > o.maxLen) o.len = o.maxLen; let ex = o.owner.x + Math.cos(o.angle) * o.len; let ey = o.owner.y + Math.sin(o.angle) * o.len; this.ctx.shadowBlur = 20; this.ctx.shadowColor = '#ff4500'; this.ctx.strokeStyle = '#DAA520'; this.ctx.lineWidth = o.width; this.ctx.lineCap = 'round'; this.ctx.beginPath(); this.ctx.moveTo(o.owner.x, o.owner.y); this.ctx.lineTo(ex, ey); this.ctx.stroke(); this.ctx.strokeStyle = '#8B0000'; this.ctx.lineWidth = o.width / 2; this.ctx.stroke(); this.ctx.fillStyle = '#fff'; this.ctx.beginPath(); this.ctx.arc(ex, ey, 20, 0, Math.PI * 2); this.ctx.fill(); enemies.forEach(e => { if (Math.hypot(ex - e.x, ey - e.y) < 40 + e.r) { if (o.life % 5 === 0) e.takeDamage(15, o.owner, this); e.vx += Math.cos(o.angle) * 10; e.vy += Math.sin(o.angle) * 10; } }); }
            else if (o.type === 'sun_slash') { o.x += o.vx; o.y += o.vy; this.ctx.strokeStyle = o.color || '#ff4500'; this.ctx.lineWidth = 4; this.ctx.shadowBlur = 15; this.ctx.shadowColor = '#ffff00'; this.ctx.beginPath(); this.ctx.arc(o.x, o.y, 40, o.angle - 0.5, o.angle + 0.5); this.ctx.stroke(); enemies.forEach(e => { if (Math.hypot(o.x - e.x, o.y - e.y) < 40) { e.takeDamage(35, o.owner, this); o.life = 0; } }); }
            else if (o.type === 'baskerville') { let dx = o.target.x - o.x, dy = o.target.y - o.y, d = Math.sqrt(dx * dx + dy * dy); o.x += dx / d * 12; o.y += dy / d * 12; this.ctx.fillStyle = '#800'; this.ctx.beginPath(); this.ctx.arc(o.x, o.y, 30, 0, Math.PI * 2); this.ctx.fill(); this.ctx.fillStyle = '#fff'; this.ctx.beginPath(); this.ctx.arc(o.x + 10, o.y - 5, 3, 0, Math.PI * 2); this.ctx.arc(o.x + 10, o.y + 5, 3, 0, Math.PI * 2); this.ctx.fill(); if (d < 40) { o.target.takeDamage(45, o.owner, this); o.life = 0; } }
            else if (o.type === 'spirit_bomb') { let dx = o.target.x - o.x, dy = o.target.y - o.y, d = Math.sqrt(dx * dx + dy * dy); o.x += (dx / d) * 4; o.y += (dy / d) * 4; let g = this.ctx.createRadialGradient(o.x, o.y, 10, o.x, o.y, 60); g.addColorStop(0, '#fff'); g.addColorStop(0.5, '#00bfff'); g.addColorStop(1, 'rgba(0,0,255,0)'); this.ctx.fillStyle = g; this.ctx.beginPath(); this.ctx.arc(o.x, o.y, 60, 0, Math.PI * 2); this.ctx.fill(); if (d < 70) { this.objs.push({ type: 'omega_explosion', x: o.x, y: o.y, r: 10, maxR: 250, life: 40, color: '#00bfff', owner: o.owner, dmg: 90 }); o.life = 0; this.shake = 35; } }
            else if (o.type === 'getsuga') { o.x += o.vx; o.y += o.vy; this.ctx.save(); this.ctx.translate(o.x, o.y); this.ctx.rotate(o.angle); this.ctx.fillStyle = '#000'; this.ctx.shadowBlur = 15; this.ctx.shadowColor = '#f00'; this.ctx.beginPath(); this.ctx.arc(0, 0, 40, -1, 1); this.ctx.fill(); this.ctx.restore(); enemies.forEach(e => { if (Math.hypot(o.x - e.x, o.y - e.y) < 40) { e.takeDamage(20, o.owner, this); o.life = 0; } }); }
            else if (o.type === 'fire_dragon') { o.x += o.vx; o.y += o.vy; this.ctx.fillStyle = o.color || '#ff4500'; this.ctx.beginPath(); this.ctx.arc(o.x, o.y, 30, 0, Math.PI * 2); this.ctx.fill(); this.parts.push({ x: o.x, y: o.y, vx: (Math.random() - 0.5) * 5, vy: (Math.random() - 0.5) * 5, life: 15, color: '#ffff00', size: 8 }); enemies.forEach(e => { if (Math.hypot(o.x - e.x, o.y - e.y) < 45) { e.takeDamage(60, o.owner, this); o.life = 0; this.shake = 15; } }); }
            else if (o.type === 'hollow_purple') { o.x += o.vx; o.y += o.vy; o.tick++; let scale = o.scale || 1; this.ctx.shadowBlur = 30; this.ctx.shadowColor = '#a020f0'; this.ctx.fillStyle = '#fff'; this.ctx.beginPath(); this.ctx.arc(o.x, o.y, 15 * scale, 0, Math.PI * 2); this.ctx.fill(); let spin = o.tick * 0.3; this.ctx.fillStyle = 'rgba(255, 0, 0, 0.8)'; this.ctx.beginPath(); this.ctx.arc(o.x + Math.cos(spin) * 15 * scale, o.y + Math.sin(spin) * 15 * scale, 8 * scale, 0, Math.PI * 2); this.ctx.fill(); this.ctx.fillStyle = 'rgba(0, 0, 255, 0.8)'; this.ctx.beginPath(); this.ctx.arc(o.x + Math.cos(spin + Math.PI) * 15 * scale, o.y + Math.sin(spin + Math.PI) * 15 * scale, 8 * scale, 0, Math.PI * 2); this.ctx.fill(); enemies.forEach(e => { if (Math.hypot(o.x - e.x, o.y - e.y) < 45 * scale) { e.takeDamage(90 * (o.dmgMult || 1), o.owner, this); this.objs.push({ type: 'omega_explosion', x: o.x, y: o.y, r: 10, maxR: 160 * scale, life: 30, color: '#a020f0' }); o.life = 0; this.shake = 20; } }); }
            else if (o.type === 'cleave_hd') { if (!o.sureHit) { o.x += o.vx; o.y += o.vy; } this.ctx.strokeStyle = o.color || '#f00'; this.ctx.lineWidth = 3; this.ctx.shadowBlur = 5; this.ctx.shadowColor = '#000'; this.ctx.beginPath(); this.ctx.moveTo(o.x - Math.cos(o.angle) * 25, o.y - Math.sin(o.angle) * 25); this.ctx.lineTo(o.x + Math.cos(o.angle) * 25, o.y + Math.sin(o.angle) * 25); this.ctx.stroke(); this.ctx.strokeStyle = '#000'; this.ctx.lineWidth = 1; this.ctx.stroke(); if (!o.sureHit) { enemies.forEach(e => { if (Math.hypot(o.x - e.x, o.y - e.y) < 35) { e.takeDamage(12, o.owner, this); o.life = 0; } }); } }
            else if (o.type === 'serious_punch') { o.x += o.vx; o.y += o.vy; this.ctx.fillStyle = 'rgba(255, 0, 0, 0.5)'; this.ctx.beginPath(); this.ctx.arc(o.x, o.y, 15, 0, Math.PI * 2); this.ctx.fill(); this.ctx.fillStyle = '#fff'; this.ctx.font = '30px Arial'; this.ctx.fillText('拳', o.x, o.y); enemies.forEach(e => { if (Math.hypot(o.x - e.x, o.y - e.y) < 15 + e.r) { e.takeDamage(o.killMode ? e.maxHp * 0.9 : e.maxHp * 0.56, o.owner, this); this.objs.push({ type: 'omega_explosion', x: o.x, y: o.y, r: 10, maxR: 200, life: 30, color: '#f00' }); o.life = 0; this.shake = 30; this.spawnText(o.x, o.y - 50, 'DEATH', '#f00'); } }); }
            else if (o.type === 'lightning') { this.ctx.strokeStyle = '#ff0'; this.ctx.lineWidth = 4; this.ctx.shadowBlur = 10; this.ctx.shadowColor = '#fff'; this.ctx.beginPath(); this.ctx.moveTo(o.x1, o.y1); this.ctx.lineTo(o.x2, o.y2); this.ctx.stroke(); }
            else if (o.type === 'broly_ball') { o.x += o.vx; o.y += o.vy; this.ctx.fillStyle = '#0f0'; this.ctx.beginPath(); this.ctx.arc(o.x, o.y, 20, 0, Math.PI * 2); this.ctx.fill(); if (o.grow) o.r += 2; enemies.forEach(e => { if (Math.hypot(o.x - e.x, o.y - e.y) < 35 || o.x < 0 || o.x > 1000) { this.objs.push({ type: 'omega_explosion', x: o.x, y: o.y, r: 10, maxR: 150, life: 40, color: '#0f0', owner: o.owner, dmg: 80 }); o.life = 0; this.shake = 25; } }); }
            else if (o.type === 'hakai_orb') { let dx = o.target.x - o.x, dy = o.target.y - o.y, d = Math.sqrt(dx * dx + dy * dy); o.x += (dx / d) * 7; o.y += (dy / d) * 7; this.ctx.fillStyle = '#4b0082'; this.ctx.strokeStyle = '#d8bfd8'; this.ctx.beginPath(); this.ctx.arc(o.x, o.y, 18 * (o.scale || 1), 0, Math.PI * 2); this.ctx.fill(); this.ctx.stroke(); if (d < 30 * (o.scale || 1)) { this.objs.push({ type: 'omega_explosion', x: o.x, y: o.y, r: 10, maxR: 140 * (o.scale || 1), life: 30, color: '#4b0082', owner: o.owner, dmg: 65 * (o.scale || 1) }); o.life = 0; this.shake = 20; } }
            else if (o.type === 'skull') { o.x += o.vx; o.y += o.vy; this.ctx.fillStyle = '#ccc'; this.ctx.beginPath(); this.ctx.arc(o.x, o.y, 10, 0, Math.PI * 2); this.ctx.fill(); enemies.forEach(e => { if (Math.hypot(o.x - e.x, o.y - e.y) < 30) { e.takeDamage(15, o.owner, this); o.owner.hp = Math.min(o.owner.maxHp, o.owner.hp + 5); o.life = 0; } }); }
            else if (o.type === 'omega_explosion') { o.r += (o.maxR - o.r) * 0.15; this.ctx.fillStyle = o.color || '#0f0'; this.ctx.beginPath(); this.ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2); this.ctx.globalAlpha = o.life / 40; this.ctx.fill(); if (o.dmg) enemies.forEach(e => { if (Math.hypot(o.x - e.x, o.y - e.y) < o.r) e.takeDamage(2, o.owner, this); }); }
            else if (o.type === 'proj') { o.x += o.vx; o.y += o.vy; this.ctx.fillStyle = o.k === 'purple' ? '#a020f0' : (o.k === 'bullet' ? '#fff' : '#ff8c00'); this.ctx.beginPath(); this.ctx.arc(o.x, o.y, 12, 0, Math.PI * 2); this.ctx.fill(); enemies.forEach(e => { if (Math.hypot(o.x - e.x, o.y - e.y) < 30) { e.takeDamage(25, o.owner, this); o.life = 0; } }); }
            else if (o.type === 'leviathan_axe') { o.x += o.vx; o.y += o.vy; o.angle += 0.5; this.ctx.save(); this.ctx.translate(o.x, o.y); this.ctx.rotate(o.angle); this.ctx.fillStyle = '#8B4513'; this.ctx.fillRect(-3, -20, 6, 40); this.ctx.fillStyle = '#C0C0C0'; this.ctx.shadowBlur = 15; this.ctx.shadowColor = '#00ffff'; this.ctx.beginPath(); this.ctx.moveTo(0, -5); this.ctx.lineTo(20, -15); this.ctx.quadraticCurveTo(25, 0, 20, 15); this.ctx.lineTo(0, 5); this.ctx.fill(); this.ctx.beginPath(); this.ctx.moveTo(0, -5); this.ctx.lineTo(-20, -15); this.ctx.quadraticCurveTo(-25, 0, -20, 15); this.ctx.lineTo(0, 5); this.ctx.fill(); this.ctx.restore(); this.parts.push({ x: o.x, y: o.y, vx: 0, vy: 0, life: 5, color: '#00ffff', size: 3 }); enemies.forEach(e => { if (Math.hypot(o.x - e.x, o.y - e.y) < 35) { e.takeDamage(35, o.owner, this); o.life = 0; this.shake = 10; } }); }
            else if (o.type === 'bajrang_gun') { o.y += 10; this.ctx.fillStyle = '#333'; this.ctx.shadowColor = '#000'; this.ctx.beginPath(); this.ctx.arc(o.x, o.y, 80, 0, Math.PI * 2); this.ctx.fill(); if (o.y > o.target.y) { this.objs.push({ type: 'omega_explosion', x: o.x, y: o.y, r: 10, maxR: 300, life: 40, color: '#333', owner: o.owner, dmg: 100 }); o.life = 0; this.shake = 40; } }
            else if (o.type === 'black_whip') { this.ctx.strokeStyle = '#006400'; this.ctx.lineWidth = 3; this.ctx.beginPath(); this.ctx.moveTo(o.owner.x, o.owner.y); let mx = (o.owner.x + o.target.x) / 2 + (Math.random() - 0.5) * 50; let my = (o.owner.y + o.target.y) / 2 + (Math.random() - 0.5) * 50; this.ctx.lineTo(mx, my); this.ctx.lineTo(o.target.x, o.target.y); this.ctx.stroke(); if (o.life % 5 === 0) o.target.takeDamage(10, o.owner, this); }
            else if (o.type === 'clone') { let dx = o.target.x - o.x, dy = o.target.y - o.y, d = Math.hypot(dx, dy); o.x += dx / d * 8; o.y += dy / d * 8; this.ctx.fillStyle = '#ffd700'; this.ctx.globalAlpha = 0.6; this.ctx.beginPath(); this.ctx.arc(o.x, o.y, 15, 0, Math.PI * 2); this.ctx.fill(); if (d < 30) { o.target.takeDamage(20, o.owner, this); o.life = 0; } }
            else if (o.type === 'tbb') { o.x += o.vx; o.y += o.vy; this.ctx.fillStyle = '#000'; this.ctx.strokeStyle = '#800080'; this.ctx.lineWidth = 3; this.ctx.beginPath(); this.ctx.arc(o.x, o.y, 25, 0, Math.PI * 2); this.ctx.fill(); this.ctx.stroke(); enemies.forEach(e => { if (Math.hypot(o.x - e.x, o.y - e.y) < 40) { this.objs.push({ type: 'omega_explosion', x: o.x, y: o.y, r: 10, maxR: 220, life: 40, color: '#800080', owner: o.owner, dmg: 80 }); o.life = 0; this.shake = 25; } }); }
            else if (o.type === 'mugetsu_wave') { o.x += o.vx; o.y += o.vy; this.ctx.save(); this.ctx.translate(o.x, o.y); this.ctx.rotate(o.angle); this.ctx.fillStyle = '#000'; this.ctx.shadowBlur = 20; this.ctx.shadowColor = '#00f'; this.ctx.beginPath(); this.ctx.ellipse(0, 0, 70, 20, 0, 0, Math.PI * 2); this.ctx.fill(); this.ctx.strokeStyle = '#00f'; this.ctx.lineWidth = 3; this.ctx.stroke(); this.ctx.restore(); enemies.forEach(e => { if (Math.hypot(o.x - e.x, o.y - e.y) < 70) { e.takeDamage(90, o.owner, this); o.life = 0; this.shake = 30; this.objs.push({ type: 'omega_explosion', x: o.x, y: o.y, r: 10, maxR: 250, life: 40, color: '#000', owner: o.owner, dmg: 50 }); } }); }
            else if (o.type === 'slash_proj') { o.x += o.vx; o.y += o.vy; this.ctx.strokeStyle = o.color || '#f00'; this.ctx.lineWidth = 2; this.ctx.beginPath(); this.ctx.moveTo(o.x, o.y); this.ctx.lineTo(o.x - o.vx * 2, o.y - o.vy * 2); this.ctx.stroke(); enemies.forEach(e => { if (Math.hypot(o.x - e.x, o.y - e.y) < 30) { e.takeDamage(15, o.owner, this); o.life = 0; } }); }
            if (o.life <= 0) this.objs.splice(i, 1);
        }
        for (let i = this.parts.length - 1; i >= 0; i--) { let p = this.parts[i]; p.x += p.vx; p.y += p.vy; p.life--; this.ctx.fillStyle = p.color; this.ctx.beginPath(); this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); this.ctx.fill(); if (p.life <= 0) this.parts.splice(i, 1); }
        this.ctx.globalCompositeOperation = 'source-over';
        for (let i = this.texts.length - 1; i >= 0; i--) { let t = this.texts[i]; t.life--; t.y--; this.ctx.fillStyle = t.color; this.ctx.font = t.size + 'px Arial'; this.ctx.globalAlpha = t.life / 50; this.ctx.fillText(t.text, t.x, t.y); this.ctx.globalAlpha = 1; if (t.life <= 0) this.texts.splice(i, 1); }
        let h1 = Math.max(0, this.p1.hp) / this.p1.maxHp * 100;
        let h2 = Math.max(0, this.p2.hp) / this.p2.maxHp * 100;
        let m1 = this.p1.mana;
        let m2 = this.p2.mana;
        document.getElementById('h1').style.width = h1 + '%';
        document.getElementById('h2').style.width = h2 + '%';
        document.getElementById('m1').style.width = m1 + '%';
        document.getElementById('m2').style.width = m2 + '%';
        if (this.p1.hp <= 0 || this.p2.hp <= 0) {
            this.running = false;
            const winner = this.p1.hp > 0 ? this.p1 : this.p2;
            const isPlayerWin = this.p1.hp > 0;
            this.ctx.fillStyle = 'rgba(0,0,0,0.9)'; this.ctx.fillRect(0, 0, 1000, 600);
            this.ctx.fillStyle = '#fff'; this.ctx.font = '60px Orbitron'; this.ctx.textAlign = 'center';
            this.ctx.fillText(winner.template.name + ' WINS', 500, 300);
            const xpEarned = Math.floor((isPlayerWin ? this.p2.level : this.p1.level) * 50 + 100);
            const coinsEarned = isPlayerWin ? 100 : 20;
            this.game.db.saveBattleResult(isPlayerWin, xpEarned, coinsEarned).then(() => {
                console.log(`[Battle] Salvo: Win=${isPlayerWin}, XP=${xpEarned}, Coins=${coinsEarned}`);
            });
            return;
        }
        requestAnimationFrame(() => this.loop());
    }
}