importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js');

// Initialize the Firebase app in the service worker by passing in the
// messagingSenderId.
const firebaseConfig = {
  // It's recommended to populate this from a config endpoint or query param,
  // but for simplicity you can inject the sender ID here if you want.
  // Using URL search params trick to pass config to SW if needed,
  // Or just hardcode for your specific project if you prefer since these are public.
  // We'll leave it mostly empty and rely on the frontend to handle foreground.
  // Background will work if you add the sender ID below:
  messagingSenderId: '856953400730' // The user will need to update this
};

if (firebase.messaging.isSupported()) {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage(function(payload) {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    // Customize notification here
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
      body: payload.notification.body,
      icon: '/favicon.ico'
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
}
