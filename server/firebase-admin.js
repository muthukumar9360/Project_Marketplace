const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getMessaging } = require('firebase-admin/messaging');

// Firebase Admin SDK Initialization
try {
  const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (serviceAccountStr) {
    let serviceAccount;
    // Check if it's base64 encoded or raw JSON
    try {
      serviceAccount = JSON.parse(serviceAccountStr);
    } catch (e) {
      serviceAccount = JSON.parse(Buffer.from(serviceAccountStr, 'base64').toString('utf8'));
    }

    // Fix the private key if the newlines are escaped
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }

    if (getApps().length === 0) {
      initializeApp({
        credential: cert(serviceAccount)
      });
      console.log("Firebase Admin SDK initialized successfully");
    }
  } else {
    console.warn("FIREBASE_SERVICE_ACCOUNT env variable is missing. Push notifications disabled.");
  }
} catch (err) {
  console.error("Failed to initialize Firebase Admin SDK", err);
}

module.exports = {
  isConfigured: () => getApps().length > 0,
  getMessaging: () => getApps().length > 0 ? getMessaging() : null
};
