import admin from 'firebase-admin';
import { env } from './env.js';
import { logger } from './logger.js';

function initializeFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const options = {
    projectId: env.FIREBASE_PROJECT_ID
  };

  if (env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      const serviceAccount = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON);
      options.credential = admin.credential.cert(serviceAccount);
    } catch (error) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON');
    }
  } else {
    options.credential = admin.credential.applicationDefault();
  }

  const app = admin.initializeApp(options);
  logger.info({ projectId: env.FIREBASE_PROJECT_ID }, 'Firebase Admin initialized');

  return app;
}

export const firebaseApp = initializeFirebaseAdmin();
export const auth = admin.auth(firebaseApp);
export const firestore = admin.firestore(firebaseApp);

firestore.settings({ ignoreUndefinedProperties: true });
