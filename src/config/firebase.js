const admin = require("firebase-admin");
const path = require("path");

// Use path.join to look two levels up from 'src/config' to the root
const serviceAccount = require(path.join(__dirname, "..", "..", "serviceAccountKey.json"));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log("✅ Firebase Admin SDK Initialized!");
}

module.exports = admin;