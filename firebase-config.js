import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyC4RxjQ_dP1Mxur6cF7QWCZRYHFl9gobSs",
  authDomain: "quiz-38d2c.firebaseapp.com",
  projectId: "quiz-38d2c",
  storageBucket: "quiz-38d2c.firebasestorage.app",
  messagingSenderId: "749897575230",
  appId: "1:749897575230:web:e4d729f197938e71999a6f",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
