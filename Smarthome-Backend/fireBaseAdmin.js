const admin = require("firebase-admin");
const serviceAccount = require("./firebase-service-account.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://autohomeglobal-5506f-default-rtdb.firebaseio.com"
});

const db = admin.database();
const firestore = admin.firestore();

module.exports = { admin, db, firestore };
