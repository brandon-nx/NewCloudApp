const sequelize = require("../config/db");
const { QueryTypes } = require('sequelize');

// src/controllers/historyController.js

exports.getDayLogs = async (req, res) => {
    const { date } = req.params;
    const firebase_uid = req.user.uid;

    try {
        const userLookup = await sequelize.query(
            'SELECT user_id FROM users WHERE firebase_uid = $1',
            { bind: [firebase_uid], type: QueryTypes.SELECT }
        );

        if (userLookup.length === 0) return res.status(404).json({ error: "User not found" });
        const realUserId = userLookup[0].user_id;

        // NEW QUERY: Individual logs + Window totals
        const logs = await sequelize.query(
            `SELECT 
                l.activity_log_id,
                l.habit_type_id, 
                l.duration_min,
                l.intake_ml,
                l.log_date,
                l.updated_at, -- Ensure this is here for the timestamp!
                -- Daily totals for the Goal Met badge
                SUM(COALESCE(l.duration_min, 0)) OVER(PARTITION BY l.habit_type_id) as daily_total_duration,
                SUM(COALESCE(l.intake_ml, 0)) OVER(PARTITION BY l.habit_type_id) as daily_total_intake,
                t.target_value
            FROM activity_logs l
            LEFT JOIN user_targets t ON l.user_id = t.user_id AND l.habit_type_id = t.habit_type_id
            WHERE l.user_id = $1 AND l.log_date = $2
            ORDER BY l.updated_at DESC`, 
            { bind: [realUserId, date], type: QueryTypes.SELECT }
        );

        // Always return an array, even if empty, to prevent frontend .forEach() crashes
        res.json(Array.isArray(logs) ? logs : []);
        
    } catch (err) {
        console.error("❌ History Controller Error:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

exports.deleteLog = async (req, res) => {
    const { id } = req.params; // This is the activity_log_id from the URL
    const firebase_uid = req.user.uid;

    try {
        // 1. Get the real user_id to ensure ownership
        const userLookup = await sequelize.query(
            'SELECT user_id FROM users WHERE firebase_uid = $1',
            { bind: [firebase_uid], type: QueryTypes.SELECT }
        );

        if (userLookup.length === 0) return res.status(404).json({ error: "User not found" });
        const realUserId = userLookup[0].user_id;

        // 2. Delete the record only if it belongs to this user
        const result = await sequelize.query(
            'DELETE FROM activity_logs WHERE activity_log_id = $1 AND user_id = $2',
            { bind: [id, realUserId] }
        );

        res.json({ message: "Record deleted successfully" });
    } catch (err) {
        console.error("Delete Error:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

exports.updateLog = async (req, res) => {
    const { id } = req.params;
    const { habit_type_id, duration_min, intake_ml, start_time, end_time } = req.body;
    const firebase_uid = req.user.uid;

    try {
        // 1. Ownership check
        const userLookup = await sequelize.query(
            'SELECT user_id FROM users WHERE firebase_uid = $1',
            { bind: [firebase_uid], type: QueryTypes.SELECT }
        );
        if (userLookup.length === 0) return res.status(404).json({ error: "User not found" });
        const realUserId = userLookup[0].user_id;

        // 2. Fetch the existing log to get the date (to keep start/end time dates consistent)
        const existingLog = await sequelize.query(
            'SELECT log_date FROM activity_logs WHERE activity_log_id = $1 AND user_id = $2',
            { bind: [id, realUserId], type: QueryTypes.SELECT }
        );
        if (existingLog.length === 0) return res.status(404).json({ error: "Log not found" });

        const logDate = existingLog[0].log_date; // e.g., "2026-04-19"
        
        // 3. Prepare the update based on habit type
        let query = "";
        let binds = [id, realUserId, new Date()]; // updated_at is always now

        if (Number(habit_type_id) === 1 || Number(habit_type_id) === 2) {
            // Sleep/Exercise: Update times + duration
            const fullStart = `${logDate}T${start_time}:00`;
            const fullEnd = `${logDate}T${end_time}:00`;
            query = `UPDATE activity_logs 
                     SET start_time = $4, end_time = $5, duration_min = $6, updated_at = $3 
                     WHERE activity_log_id = $1 AND user_id = $2`;
            binds.push(fullStart, fullEnd, duration_min);
        } else if (Number(habit_type_id) === 3) {
            // Study: Update duration only
            query = `UPDATE activity_logs SET duration_min = $4, updated_at = $3 WHERE activity_log_id = $1 AND user_id = $2`;
            binds.push(duration_min);
        } else if (Number(habit_type_id) === 4) {
            // Water: Update intake only
            query = `UPDATE activity_logs SET intake_ml = $4, updated_at = $3 WHERE activity_log_id = $1 AND user_id = $2`;
            binds.push(intake_ml);
        }

        await sequelize.query(query, { bind: binds });
        res.json({ message: "Update successful" });

    } catch (err) {
        console.error("Update Error:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// Get a single log for editing
exports.getSingleLog = async (req, res) => {
    const { id } = req.params;
    const firebase_uid = req.user.uid;

    try {
        const userLookup = await sequelize.query(
            'SELECT user_id FROM users WHERE firebase_uid = $1',
            { bind: [firebase_uid], type: QueryTypes.SELECT }
        );

        if (userLookup.length === 0) return res.status(404).json({ error: "User not found" });
        const realUserId = userLookup[0].user_id;

        const log = await sequelize.query(
            `SELECT * FROM activity_logs WHERE activity_log_id = $1 AND user_id = $2`,
            { bind: [id, realUserId], type: QueryTypes.SELECT }
        );

        if (log.length === 0) return res.status(404).json({ error: "Log not found" });

        res.json(log[0]);
    } catch (err) {
        console.error("Error fetching single log:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};