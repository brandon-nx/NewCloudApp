const db = require("../config/db"); // This is your Sequelize instance
const { QueryTypes } = require("sequelize");

const getDashboard = async (req, res) => {
    try {
        const firebase_uid = req.user.uid;

        // Correct Sequelize raw query syntax
        const userResult = await db.query(
            "SELECT username, email FROM users WHERE firebase_uid = $1",
            {
                bind: [firebase_uid],
                type: QueryTypes.SELECT
            }
        );

        // Sequelize SELECT queries return an array directly
        if (userResult.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        const userData = userResult[0];

        res.json({
            username: userData.username,
            email: userData.email
        });

    } catch (error) {
        console.error("Dashboard Controller Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

module.exports = { getDashboard };