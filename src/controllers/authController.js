// exports.register = (req, res) => {
//   res.json({ message: "Register endpoint placeholder" });
// };

// exports.login = (req, res) => {
//   res.json({ message: "Login endpoint placeholder" });
// };


// const User = require('../models/User');

// exports.registerOrLogin = async (req, res) => {
//   const { firebaseUid, email } = req.body;

//   try {
//     // 1. Check if user already exists in Postgres
//     let user = await User.findByFirebaseUid(firebaseUid);

//     if (!user) {
//       // 2. If not, create them!
//       user = await User.create(firebaseUid, email);
//       console.log(`New user created in Cloud SQL: ${email}`);
//     } else {
//       console.log(`User logged in: ${email}`);
//     }

//     res.status(200).json({ message: "Success", user });
//   } catch (error) {
//     console.error("Auth Error:", error);
//     res.status(500).json({ error: "Database registration failed" });
//   }
// };

const admin = require('../config/firebase'); // Uses your serviceAccountKey.json
const pool = require('../config/db');        // Uses your Cloud SQL connection

exports.registerOrLogin = async (req, res) => {
  // We now expect an idToken from the frontend instead of just a UID
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ error: "No token provided" });
  }

  try {
    // 1. VERIFY the Token with Firebase Admin
    // This proves the user actually logged into Firebase successfully
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid, email } = decodedToken;

    // 2. SYNC with Google Cloud SQL
    // We use "ON CONFLICT" to handle both New Registration and repeat Logins
    const query = `
      INSERT INTO users (firebase_uid, email) 
      VALUES ($1, $2) 
      ON CONFLICT (firebase_uid) 
      DO UPDATE SET last_login = CURRENT_TIMESTAMP
      RETURNING *;
    `;
    
    const result = await pool.query(query, [uid, email]);
    const user = result.rows[0];

    console.log(`✅ Cloud SQL Sync Successful for: ${email}`);

    // 3. RESPOND to the frontend
    res.status(200).json({ 
      message: "Authentication successful", 
      user: {
        id: user.id,
        email: user.email
      }
    });

  } catch (error) {
    console.error("❌ Auth Controller Error:", error.message);
    res.status(401).json({ error: "Invalid or expired token" });
  }
};