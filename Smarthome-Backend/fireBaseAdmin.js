const admin = require("firebase-admin");
const serviceAccount = require("./firebase-service-account.json");

// ✅ Prevent re-initialization if already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://autohomeglobal-5506f-default-rtdb.firebaseio.com"
  });
}

const db = admin.database();      // Realtime DB
const firestore = admin.firestore();  // Firestore DB

module.exports = { admin, db, firestore };
