import { initializeApp } from 'firebase/app'
import { getAuth, onAuthStateChanged as _onAuthStateChanged, signInWithEmailAndPassword as _signIn, createUserWithEmailAndPassword as _signup, signOut as _signOut } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const cfg = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const hasFirebase = !!cfg.apiKey

let auth
let onAuthStateChanged
let signInWithEmailAndPassword
let createUserWithEmailAndPassword
let signOut
let db

if (hasFirebase) {
  const app = initializeApp(cfg)
  auth = getAuth(app)
  onAuthStateChanged = _onAuthStateChanged
  signInWithEmailAndPassword = _signIn
  createUserWithEmailAndPassword = _signup
  signOut = _signOut
  db = getFirestore(app)
} else {
  // Fallback stubs so the app runs without Firebase config
  auth = { currentUser: null }
  onAuthStateChanged = (authObj, cb) => { cb(null); return () => {} }
  const notConfigured = () => Promise.reject(new Error('Auth not configured. Set VITE_FIREBASE_* envs.'))
  signInWithEmailAndPassword = notConfigured
  createUserWithEmailAndPassword = notConfigured
  signOut = () => Promise.resolve()
  db = null
}

export { auth, db, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut }
