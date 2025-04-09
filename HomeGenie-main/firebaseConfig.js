import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDMrnW8tdgThXam-tnBk0dNcRwz_6wQvwI",
  authDomain: "autohomeglobal-5506f.firebaseapp.com",
  projectId: "autohomeglobal-5506f",
  storageBucket: "autohomeglobal-5506f.appspot.com",
  messagingSenderId: "929603904264",
  appId: "1:929603904264:web:d987f46a17ec057c4c82bd",
  measurementId: "G-YJ9FXSMBTY"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const database = getDatabase(app);

export { db, auth, database };
