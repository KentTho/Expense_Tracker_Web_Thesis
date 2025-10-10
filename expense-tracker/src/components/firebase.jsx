// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDkN4OX0vKrf-s_7q4XjUFC3yVljpbnVtQ",
  authDomain: "expense-tracker-2200006616.firebaseapp.com",
  projectId: "expense-tracker-2200006616",
  storageBucket: "expense-tracker-2200006616.firebasestorage.app",
  messagingSenderId: "447906792019",
  appId: "1:447906792019:web:7a878308d5ad1e0b837ca6",
  measurementId: "G-2PHLHD4P6Z"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth()
export default app;