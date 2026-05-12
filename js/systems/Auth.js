import { firebaseConfig } from '../config/firebase.config.js';

export class Auth {
    constructor(game) {
        this.game = game;
        this.firebaseApp = null;
        this.currentUser = null;
        this.init();
    }
    init() {
        this.firebaseApp = firebase.initializeApp(firebaseConfig);
        firebase.auth().onAuthStateChanged((user) => {
            this.currentUser = user;
            window.dispatchEvent(new CustomEvent('game:authchange', { detail: { user } }));
        });
        this.bindUI();
    }
    bindUI() {
        document.getElementById('btn-login')?.addEventListener('click', () => this.signIn());
        document.getElementById('btn-logout')?.addEventListener('click', () => this.signOut());
    }
    async signIn() {
        const provider = new firebase.auth.GoogleAuthProvider();
        try {
            document.getElementById('auth-status').textContent = 'Conectando...';
            await firebase.auth().signInWithPopup(provider);
        } catch (err) {
            document.getElementById('auth-status').textContent = err.code === 'auth/popup-closed-by-user' ? 'Login cancelado.' : 'Erro ao conectar.';
        }
    }
    async signOut() { await firebase.auth().signOut(); }
    getUser() { return this.currentUser; }
    getUid() { return this.currentUser?.uid; }
}