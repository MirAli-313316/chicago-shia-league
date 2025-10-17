// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyCXam65M0owQtgUbP_qpWszTyFA3Sbj4rk",
  authDomain: "chicago-shia-league.firebaseapp.com",
  projectId: "chicago-shia-league",
  storageBucket: "chicago-shia-league.firebasestorage.app",
  messagingSenderId: "749697548659",
  appId: "1:749697548659:web:c863d85d2278d2da79c506"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

window.db = db;
window.auth = auth;
