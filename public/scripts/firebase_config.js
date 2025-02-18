const firebaseConfig = {
    apiKey: "AIzaSyDJ1hiYKl1mSN5gS-z1AjbKFN2iNDWJ-sE",
    authDomain: "pymng-1f373.firebaseapp.com",
    projectId: "pymng-1f373",
    storageBucket: "pymng-1f373.appspot.com",
    messagingSenderId: "1051123271644",
    appId: "1:1051123271644:web:a10c680d8ef8afb9777119",
    measurementId: "G-99ETF7JFZ2"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();