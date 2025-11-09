// Firebase Admin SDK Configuration
// Initializes Firebase Admin for backend operations (Firestore, Auth)

const admin = require('firebase-admin');
require('dotenv').config();

// Initialize Firebase Admin with service account credentials
const hasEnv = Boolean(
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_CLIENT_EMAIL &&
  process.env.FIREBASE_PRIVATE_KEY
);

const serviceAccount = hasEnv
  ? {
      type: 'service_account',
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
    }
  : null;

// Initialize the app only if not already initialized
let db = null;
let auth = null;

try {
  if (hasEnv && !admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
  }
  if (admin.apps.length) {
    db = admin.firestore();
    auth = admin.auth();
  } else {
    console.warn('[firebase] Firebase Admin not configured. Auth routes will be disabled.');
  }
} catch (e) {
  console.error('[firebase] Failed to initialize Firebase Admin:', e.message);
}

// Export Firestore and Auth instances
module.exports = { admin, db, auth };
