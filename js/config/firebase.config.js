/**
 * CONFIGURAÇÃO DO FIREBASE
 * 
 * INSTRUÇÕES:
 * 1. Vá em https://console.firebase.google.com
 * 2. Crie um projeto novo
 * 3. Ative Authentication (Google Provider) e Firestore Database
 * 4. Em "Configuração do Projeto" > "Seus aplicativos", copie o firebaseConfig
 * 5. Cole os valores abaixo
 * 
 * SEGURANÇA: Este arquivo contém chaves públicas do Firebase. Isso é NORMAL e seguro.
 * As chaves secretas ficam no servidor (Cloud Functions), nunca aqui.
 */

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBoex-PgM0AVp5S9Y-GDweqVqe6fOb5xoA",
  authDomain: "arena-legends-online.firebaseapp.com",
  projectId: "arena-legends-online",
  storageBucket: "arena-legends-online.firebasestorage.app",
  messagingSenderId: "70367261564",
  appId: "1:70367261564:web:94d7cbee882589d49baaf9",
  measurementId: "G-6YK66PPRT1"
};

/**
 * SCHEMA DO FIRESTORE (coleções):
 * 
 * users/{uid} -> {
 *   displayName: string,
 *   email: string,
 *   createdAt: timestamp,
 *   stats: {
 *     level: number,
 *     xp: number,
 *     coins: number,
 *     wins: number,
 *     losses: number
 *   },
 *   roster: [  // personagens desbloqueados
 *     { charId: string, level: number, xp: number, skillPoints: number, unlockedSkills: [] }
 *   ],
 *   inventory: [],
 *   lastLogin: timestamp,
 *   lastTraining: timestamp
 * }
 * 
 * REGRAS DE SEGURANÇA DO FIRESTORE (cole em Regras):
 * 
 * rules_version = '2';
 * service cloud.firestore {
 *   match /databases/{database}/documents {
 *     match /users/{userId} {
 *       allow read, write: if request.auth != null && request.auth.uid == userId;
 *     }
 *   }
 * }
 */
