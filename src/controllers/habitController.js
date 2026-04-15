const pool = require('../config/db');

// 1. Get all habits for the LOGGED-IN user
exports.getHabits = async (req, res) => {
    // The 'protect' middleware gives us req.user.uid
    const firebaseUid = req.user.uid;

    try {
        console.log(`Fetching habits for user: ${firebaseUid}`);
        
        // We filter by firebase_uid to ensure they only see their own data
        const result = await pool.query(
            'SELECT * FROM habits WHERE firebase_uid = $1 ORDER BY created_at DESC', 
            [firebaseUid]
        );

        res.status(200).json(result.rows);
    } catch (error) {
        console.error("❌ Error fetching habits:", error.message);
        res.status(500).json({ error: "Failed to retrieve habits from database." });
    }
};

// 2. Log a habit completion (Create or Update)
exports.logHabit = async (req, res) => {
    const firebaseUid = req.user.uid;
    const { habitId, status, value } = req.body; // Expecting these from frontend

    if (!habitId) {
        return res.status(400).json({ error: "Habit ID is required" });
    }

    try {
        // We include firebase_uid in the WHERE clause as a security check
        // This prevents User A from logging a habit that belongs to User B
        const query = `
            UPDATE habits 
            SET last_completed = CURRENT_TIMESTAMP, 
                current_value = $1,
                status = $2
            WHERE id = $3 AND firebase_uid = $4
            RETURNING *;
        `;
        
        const result = await pool.query(query, [value, status, habitId, firebaseUid]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Habit not found or unauthorized." });
        }

        res.status(200).json({
            message: "Habit logged successfully",
            habit: result.rows[0]
        });
    } catch (error) {
        console.error("❌ Error logging habit:", error.message);
        res.status(500).json({ error: "Failed to log habit activity." });
    }
};