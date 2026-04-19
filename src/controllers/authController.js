const admin = require("../config/firebase");
// pool or sequelize instance
const sequelize = require("../config/db");

exports.registerOrLogin = async (req, res) => {
  const { idToken, fullName } = req.body;

  if (!idToken) {
    return res.status(400).json({ error: "No token provided" });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid, email } = decodedToken;

    /*const query = `
    //  INSERT INTO users (firebase_uid, email, full_name) 
    //  VALUES ($1, $2, $3) 
    //  ON CONFLICT (firebase_uid) 
    //  DO UPDATE SET 
    //    last_login = CURRENT_TIMESTAMP,
    //    full_name = COALESCE(users.full_name, EXCLUDED.full_name) 
    //  RETURNING *;
    //`;
    
    const result = await pool.query(query, [uid, email, fullName]);
    const user = result.rows[0];*/

    
    const query = `
      INSERT INTO users (firebase_uid, email, full_name, last_login)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      ON CONFLICT (firebase_uid)
      DO UPDATE SET
        email = EXCLUDED.email,
        full_name = CASE 
            WHEN users.full_name IS NOT NULL AND users.full_name != 'User' AND users.full_name != ''
            THEN users.full_name 
            ELSE COALESCE(EXCLUDED.full_name, users.full_name)
        END,
        last_login = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      RETURNING user_id, firebase_uid, email, full_name, last_login;
    `;

    const [rows] = await sequelize.query(query, {
      bind: [uid, email, fullName || null],
    });

    const user = Array.isArray(rows) ? rows[0] : rows;

    console.log(`✅ Cloud SQL Sync Successful for: ${email}`);

    return res.status(200).json({
      message: "Authentication successful",
      user: {
        user_id: user.user_id,
        firebase_uid: user.firebase_uid,
        email: user.email,
        full_name: user.full_name,
        last_login: user.last_login,
      },
    });
  } catch (error) {
    console.error("❌ Auth Controller Error:", error);

    return res.status(500).json({
      error: "Database registration failed",
      details: error.message,
    });
  }
};