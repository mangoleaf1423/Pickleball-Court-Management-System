import { initializeApp } from "firebase/app";
import { getMessaging, getToken } from "firebase/messaging";

const firebaseConfig = {
    apiKey: "AIzaSyCCJwZPMTRtm6jeTcrXJUEPQGZqPhS7VdI",
    authDomain: "pickleball-3f901.firebaseapp.com",
    projectId: "pickleball-3f901",
    storageBucket: "pickleball-3f901.firebasestorage.app",
    messagingSenderId: "677863957020",
    appId: "1:677863957020:web:f93dfcfa865dc5152435d9",
    measurementId: "G-9DRCJ7S5DJ"
  };

  const vapidKey = "BP-ols8OSh9Pa-UpdrUwX_NRdXF3yg6J2wXwxADCoioW7NqfLlTz9wZ0BLpBULSnHoBaIh9jnrrAm3Fa_DH5gLE";

  const app = initializeApp(firebaseConfig);
  const messaging = getMessaging(app);

  export const requestFCMToken = async () => {
    return Notification.requestPermission().then(async (permission) => {
        if (permission === 'granted') {

            const token = await getToken(messaging, {
                vapidKey: vapidKey
            });
            console.log(token);
            return token;
        } else {
            return null;
        }
    }).catch((err) => {
        console.log(err);
        return null;
    });
  }
