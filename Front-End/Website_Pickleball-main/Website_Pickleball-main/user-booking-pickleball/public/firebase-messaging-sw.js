// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here. Other Firebase libraries
// are not available in the service worker.
// Replace 10.13.2 with latest version of the Firebase JS SDK.
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// https://firebase.google.com/docs/web/setup#config-object
firebase.initializeApp({
  apiKey: 'AIzaSyCCJwZPMTRtm6jeTcrXJUEPQGZqPhS7VdI',
  authDomain: 'pickleball-3f901.firebaseapp.com',
  databaseURL: 'https://pickleball-3f901.firebaseio.com',
  projectId: 'pickleball-3f901',
  storageBucket: 'pickleball-3f901.firebasestorage.app',
  messagingSenderId: '677863957020',
  appId: '1:677863957020:web:f93dfcfa865dc5152435d9',
  measurementId: 'G-9DRCJ7S5DJ',
});

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('Received background message', payload);
});

