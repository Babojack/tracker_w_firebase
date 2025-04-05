import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCVxynJ-_Ti-vsyWFTmO9bfJP4bpev6Z2c",
  authDomain: "my-tracker-ef8f7.firebaseapp.com",
  projectId: "my-tracker-ef8f7",
  storageBucket: "my-tracker-ef8f7.firebasestorage.app",
  messagingSenderId: "317238886538",
  appId: "1:317238886538:web:75e51fa49b9dab7e6f2d73",
  measurementId: "G-CJH0CKBKG8"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, analytics, auth, db };
