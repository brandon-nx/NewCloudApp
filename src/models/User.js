const pool = require('../config/db');

const User = {
  // Find a user by their Firebase UID
  findByFirebaseUid: async (firebaseUid) => {
    const result = await pool.query('SELECT * FROM users WHERE firebase_uid = $1', [firebaseUid]);
    return result.rows[0];
  },

  // Create a new user if they don't exist yet
  create: async (firebaseUid, email) => {
    const result = await pool.query(
      'INSERT INTO users (firebase_uid, email) VALUES ($1, $2) ON CONFLICT (firebase_uid) DO UPDATE SET email = EXCLUDED.email RETURNING *',
      [firebaseUid, email]
    );
    return result.rows[0];
  }
};

module.exports = User;