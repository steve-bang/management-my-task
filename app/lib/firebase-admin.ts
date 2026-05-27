import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

function getFirebaseAdmin() {
  if (getApps().length > 0) return getApps()[0];

  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const projectId = process.env.FIREBASE_PROJECT_ID;

  if (!privateKey || !clientEmail || !projectId) {
    throw new Error(
      'Missing Firebase env vars. Check FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY'
    );
  }

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      // Vercel lưu \n literal, cần replace thành newline thật
      privateKey: privateKey.replace(/\\n/g, '\n'),
    }),
  });
}

getFirebaseAdmin();

export const db = getFirestore();