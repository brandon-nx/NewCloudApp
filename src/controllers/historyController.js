const sequelize = require("../config/db");
const { QueryTypes } = require('sequelize');

exports.getDayLogs = async (req, res) => {
    const { date } = req.params; // e.g., "2026-04-18"
    const firebase_uid = req.user.uid;

    try {
        // 1. Get the internal user_id from the firebase_uid
        const userLookup = await sequelize.query(
            'SELECT user_id FROM users WHERE firebase_uid = $1',
            { bind: [firebase_uid], type: QueryTypes.SELECT }
        );

        if (userLookup.length === 0) return res.status(404).json({ error: "User not found" });
        const realUserId = userLookup[0].user_id;

        // 2. Fetch logs for that specific day
        const logs = await sequelize.query(
            `SELECT * FROM activity_logs 
             WHERE user_id = $1 AND log_date = $2`,
            { bind: [realUserId, date], type: QueryTypes.SELECT }
        );

        res.json(logs);
    } catch (err) {
        console.error("History Controller Error:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};