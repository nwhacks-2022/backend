var admin = require('firebase-admin');

var serviceAccount = require("./firebase-thing.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const auth = admin.auth();

const db = admin.firestore();

module.exports = { db, auth };
