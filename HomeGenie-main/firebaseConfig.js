import { initializeApp } from "firebase/app";
import { getDatabase, ref, get } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCiGVqIj_Q5DcWXn8Te4QBc59-HYpwqiKg",
  authDomain: "smart-home-system-9565d.firebaseapp.com",
  databaseURL: "https://smart-home-system-9565d-default-rtdb.firebaseio.com",
  projectId: "smart-home-system-9565d",
  storageBucket: "smart-home-system-9565d.firebasestorage.app",
  messagingSenderId: "988759018762",
  appId: "1:988759018762:web:c3cd47c91e796741fffef3",
  measurementId: "G-Z0GV4314X8",
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database };
