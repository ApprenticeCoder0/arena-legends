export class Database {
    constructor(game) {
        this.game = game;
        this.db = firebase.firestore();
    }
    getUserRef() {
        const uid = this.game.auth.getUid();
        if (!uid) throw new Error('[Database] Sem autenticação');
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
            stats: { level: 1, xp: 0, coins: 500, wins: 0, losses: 0 },
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
    async addXp(amount) {
        const ref = this.getUserRef();
        await this.db.runTransaction(async (transaction) => {
            const doc = await transaction.get(ref);
            if (!doc.exists) return;
            const data = doc.data();
            const newXp = (data.stats?.xp || 0) + amount;
            const newLevel = Math.floor(Math.sqrt(newXp / 100)) + 1;
            transaction.update(ref, {
                'stats.xp': newXp,
                'stats.level': newLevel,
                lastTraining: firebase.firestore.FieldValue.serverTimestamp()
            });
        });
    }
    async saveBattleResult(won, xpEarned, coinsEarned) {
        const ref = this.getUserRef();
        await this.db.runTransaction(async (transaction) => {
            const doc = await transaction.get(ref);
            const data = doc.data();
            const stats = data.stats;
            const newXp = stats.xp + xpEarned;
            const newLevel = Math.floor(Math.sqrt(newXp / 100)) + 1;
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
    subscribeToProfile(callback) {
        return this.getUserRef().onSnapshot((doc) => {
            if (doc.exists) callback(doc.data());
        });
    }
}