const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

function initializeFirebase() {
  if (admin.apps.length > 0) {
    return;
  }

  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!serviceAccountPath) {
    throw new Error('Missing GOOGLE_APPLICATION_CREDENTIALS environment variable');
  }

  // Resolve the path relative to the backend directory
  const fullPath = path.resolve(__dirname, '..', serviceAccountPath);
  const serviceAccount = JSON.parse(fs.readFileSync(fullPath, 'utf8'));

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

function getFirestore() {
  return admin.firestore();
}

function getAuth() {
  return admin.auth();
}

module.exports = {
  initializeFirebase,
  getFirestore,
  getAuth,
};
