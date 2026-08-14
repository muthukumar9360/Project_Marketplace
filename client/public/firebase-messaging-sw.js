importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js');

// Initialize the Firebase app in the service worker by passing in the
// messagingSenderId.
const firebaseConfig = {
  apiKey: "AIzaSyDz8lepW8tDnWf6L70gWHiBas1gIZIJPUo",
  authDomain: "marketplace-21f80.firebaseapp.com",
  projectId: "marketplace-21f80",
  storageBucket: "marketplace-21f80.firebasestorage.app",
  messagingSenderId: "856953400730",
  appId: "1:856953400730:web:fe24b9be48046c319c9e23"
};

if (firebase.messaging.isSupported()) {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();
}
