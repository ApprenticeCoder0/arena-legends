/**
 * Auth.js
 * 
 * Responsabilidade: Abstrair toda a lógica de autenticação do Firebase.
 * Regra de Ouro: Nenhum outro arquivo importa firebase-auth diretamente.
 */

import { firebaseConfig } from '../config/firebase.config.js';

export class Auth {
    constructor(game) {
        this.game = game;
        this.firebaseApp = null;
        this.currentUser = null;
        this.init();
    }

    init() {
        // Inicializa Firebase (compat mode)
        this.firebaseApp = firebase.initializeApp(firebaseConfig);

        // Observer de estado de auth
        firebase.auth().onAuthStateChanged((user) => {
            this.currentUser = user;
            window.dispatchEvent(new CustomEvent('game:authchange', { detail: { user } }));

            if (user) {
                console.log('[Auth] Logado como:', user.displayName);
            } else {
                console.log('[Auth] Deslogado');
            }
        });

        this.bindUI();
    }

    bindUI() {
        const btnLogin = document.getElementById('btn-login');
        const btnLogout = document.getElementById('btn-logout');

        btnLogin?.addEventListener('click', () => this.signIn());
        btnLogout?.addEventListener('click', () => this.signOut());
    }

    async signIn() {
        const provider = new firebase.auth.GoogleAuthProvider();
        try {
            document.getElementById('auth-status').textContent = 'Conectando...';
            await firebase.auth().signInWithPopup(provider);
        } catch (err) {
            console.error('[Auth] Erro no login:', err);
            document.getElementById('auth-status').textContent = 
                err.code === 'auth/popup-closed-by-user' 
                    ? 'Login cancelado.' 
                    : 'Erro ao conectar. Tente novamente.';
        }
    }

    async signOut() {
        await firebase.auth().signOut();
    }

    getUser() {
        return this.currentUser;
    }

    getUid() {
        return this.currentUser?.uid;
    }
}
