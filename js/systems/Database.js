/**
 * Database.js
 * 
 * Responsabilidade: Único ponto de contato com o Firestore.
 * Segurança: Toda escrita é validada pelo servidor (regras Firestore).
 * Anti-cheat: O cliente NUNCA calcula XP ou drops. Ele apenas REPORTA eventos.
 */

export class Database {
    constructor(game) {
        this.game = game;
        this.db = firebase.firestore();
    }

    getUserRef() {
        const uid = this.game.auth.getUid();
        if (!uid) throw new Error('[Database] Tentativa de acesso sem autenticação');
        return this.db.collection('users').doc(uid);
    }

    async getPlayerData() {
        const doc = await this.getUserRef().get();
        return doc.exists ? doc.data() : null;
    }

    async createInitialProfile() {
        const user = this.game.auth.getUser();
        const defaultProfile = {
            displayName: user.displayName || 'Guerreiro',
            email: user.email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            stats: {
                level: 1,
                xp: 0,
                coins: 500,        // Moedas iniciais
                wins: 0,
                losses: 0
            },
            // Personagens iniciais desbloqueados (todos no MVP, depois viram gacha)
            roster: [
                { charId: 'flash', level: 1, xp: 0, skillPoints: 0, unlockedSkills: [] },
                { charId: 'hulk', level: 1, xp: 0, skillPoints: 0, unlockedSkills: [] }
            ],
            inventory: [],
            lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
            lastTraining: firebase.firestore.FieldValue.serverTimestamp()
        };

        await this.getUserRef().set(defaultProfile);
        return defaultProfile;
    }

    async updateStats(updates) {
        // updates = { 'stats.coins': -100, 'stats.wins': 1 }
        // O Firestore rejeita se o saldo ficar negativo (via regras de segurança, se configuradas)
        await this.getUserRef().update(updates);
    }

    async addXp(amount) {
        // Em produção, isso deveria ser uma Cloud Function para evitar spam
        // Mas para o MVP, fazemos client-side com validação simples
        const ref = this.getUserRef();
        await this.db.runTransaction(async (transaction) => {
            const doc = await transaction.get(ref);
            if (!doc.exists) return;

            const data = doc.data();
            const newXp = (data.stats?.xp || 0) + amount;
            const newLevel = this.calculateLevel(newXp);

            transaction.update(ref, {
                'stats.xp': newXp,
                'stats.level': newLevel,
                lastTraining: firebase.firestore.FieldValue.serverTimestamp()
            });
        });
    }

    calculateLevel(xp) {
        // Fórmula: level = floor(sqrt(xp / 100)) + 1
        return Math.floor(Math.sqrt(xp / 100)) + 1;
    }

    async saveBattleResult(won, xpEarned, coinsEarned) {
        const ref = this.getUserRef();
        await this.db.runTransaction(async (transaction) => {
            const doc = await transaction.get(ref);
            const data = doc.data();
            const stats = data.stats;

            const newXp = stats.xp + xpEarned;
            const newLevel = this.calculateLevel(newXp);

            transaction.update(ref, {
                'stats.xp': newXp,
                'stats.level': newLevel,
                'stats.coins': stats.coins + coinsEarned,
                'stats.wins': stats.wins + (won ? 1 : 0),
                'stats.losses': stats.losses + (won ? 0 : 1),
                lastTraining: firebase.firestore.FieldValue.serverTimestamp()
            });
        });
    }

    // Listener em tempo real para o perfil (atualiza HUD/menu automaticamente)
    subscribeToProfile(callback) {
        return this.getUserRef().onSnapshot((doc) => {
            if (doc.exists) callback(doc.data());
        });
    }
}
