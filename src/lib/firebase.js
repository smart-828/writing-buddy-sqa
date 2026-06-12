import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBNq28a1fUHwWX3bzt4OSjt6khkRFNtWZQ",
  authDomain: "writing-buddy-sqa.firebaseapp.com",
  projectId: "writing-buddy-sqa",
  storageBucket: "writing-buddy-sqa.firebasestorage.app",
  messagingSenderId: "107309487730",
  appId: "1:107309487730:web:52dd2e095440ce426254eb",
  measurementId: "G-4MZB508HRP"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
