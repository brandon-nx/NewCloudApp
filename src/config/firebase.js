const admin = require("firebase-admin");

if (!admin.apps.length) {
  if (process.env.K_SERVICE) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: "cloud-habit-tracker-fc4c6",
    });
    console.log("✅ Firebase initialized on Cloud Run");
  } else {
    const serviceAccount = require("./serviceAccountKey.json");
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });
    console.log("✅ Firebase initialized locally");
  }
}

module.exports = admin;