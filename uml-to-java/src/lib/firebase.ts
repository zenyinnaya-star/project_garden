/**
 * Firebase client — initialised once from env vars.
 *
 * Required env vars (add to .env.local):
 *   VITE_FIREBASE_API_KEY
 *   VITE_FIREBASE_AUTH_DOMAIN
 *   VITE_FIREBASE_DATABASE_URL     ← Realtime Database URL
 *   VITE_FIREBASE_PROJECT_ID
 *   VITE_FIREBASE_STORAGE_BUCKET
 *   VITE_FIREBASE_MESSAGING_SENDER_ID
 *   VITE_FIREBASE_APP_ID
 *
 * Firebase console setup:
 *   1. Authentication → Sign-in method → Email/Password → Enable
 *   2. Build → Realtime Database → Create database (start in test mode)
 *      Then update rules to:
 *      {
 *        "rules": {
 *          "collab_rooms": { ".read": true, ".write": true },
 *          "$other": { ".read": "auth != null", ".write": "auth != null" }
 *        }
 *      }
 */

import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth,     type Auth           } from 'firebase/auth';
import { getDatabase, type Database       } from 'firebase/database';

const cfg = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY            as string | undefined,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        as string | undefined,
  databaseURL:       import.meta.env.VITE_FIREBASE_DATABASE_URL       as string | undefined,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID         as string | undefined,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     as string | undefined,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID             as string | undefined,
};

export const isFirebaseConfigured = Boolean(cfg.apiKey && cfg.authDomain && cfg.projectId);

let _app:  FirebaseApp | null = null;
let _auth: Auth        | null = null;
let _db:   Database    | null = null;

if (isFirebaseConfigured) {
  try {
    _app  = initializeApp(cfg as Record<string, string>);
    _auth = getAuth(_app);
    if (cfg.databaseURL) _db = getDatabase(_app);
  } catch (err) {
    console.warn('[UML→Code] Firebase init failed — check your .env.local values:', err);
  }
}

export const firebaseApp  = _app;
export const auth         = _auth;
export const db           = _db;
