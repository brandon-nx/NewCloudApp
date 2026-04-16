const db = require("../config/db");

const getDashboard = async (req, res) => {
    try {
        // req.user.uid is populated by your 'protect' middleware (verifyToken)
        const firebase_uid = req.user.uid;

        // Query the PostgreSQL users table
        const userResult = await db.query(
            "SELECT full_name, email FROM users WHERE firebase_uid = $1",
            [firebase_uid]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        const userData = userResult.rows[0];

        // Send the full_name back to the frontend
        res.json({
            full_name: userData.full_name,
            email: userData.email
        });

    } catch (error) {
        console.error("Dashboard Controller Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

module.exports = { getDashboard };