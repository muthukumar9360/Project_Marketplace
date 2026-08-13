import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

console.log('--- FIREBASE ENV DEBUG ---');
console.log('ALL ENV:', JSON.stringify(import.meta.env, null, 2));
console.log('API KEY:', import.meta.env.VITE_FIREBASE_API_KEY ? 'EXISTS' : 'MISSING');
console.log('Raw API KEY:', import.meta.env.VITE_FIREBASE_API_KEY);
console.log('--------------------------');

let app;
let messaging;

try {
  if (firebaseConfig.apiKey) {
    app = initializeApp(firebaseConfig);
    messaging = getMessaging(app);
  } else {
    console.warn("Firebase config is missing. FCM is disabled.");
  }
} catch (error) {
  console.error("Firebase initialization error", error);
}

export const requestFirebaseToken = async () => {
  if (!messaging) return null;
  try {
    const currentToken = await getToken(messaging, { 
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY 
    });
    if (currentToken) {
      return currentToken;
    } else {
      console.log('No registration token available. Request permission to generate one.');
      return null;
    }
  } catch (err) {
    console.log('An error occurred while retrieving token. ', err);
    return null;
  }
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    if (messaging) {
      onMessage(messaging, (payload) => {
        resolve(payload);
      });
    }
  });

export { messaging };
