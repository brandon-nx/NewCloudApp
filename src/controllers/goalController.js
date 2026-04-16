const sequelize = require("../config/db"); // Ensure this is your sequelize instance
const { QueryTypes } = require('sequelize');

// 1. Fetch goals
exports.getGoals = async (req, res) => {
    const firebase_uid = req.user.uid; 
    try {
        // Look up the integer user_id
        const userLookup = await sequelize.query(
            'SELECT user_id FROM users WHERE firebase_uid = $1',
            {
                bind: [firebase_uid], // Use 'bind' for $1 syntax
                type: QueryTypes.SELECT
            }
        );

        if (userLookup.length === 0) return res.status(404).json({ error: "User not found" });

        const realUserId = userLookup[0].user_id;

        const results = await sequelize.query(
            'SELECT habit_type_id, target_value FROM user_targets WHERE user_id = $1',
            {
                bind: [realUserId],
                type: QueryTypes.SELECT
            }
        );
        
        const goalsObj = {};
        results.forEach(row => {
            goalsObj[row.habit_type_id] = row.target_value;
        });
        res.json(goalsObj);
    } catch (err) {
        console.error("GET Goals Error:", err);
        res.status(500).send();
    }
};

// 2. Update goals
exports.updateGoals = async (req, res) => {
    const { goals } = req.body;
    const firebase_uid = req.user.uid;

    try {
        // Get the real user_id
        const userLookup = await sequelize.query(
            'SELECT user_id FROM users WHERE firebase_uid = $1',
            {
                bind: [firebase_uid],
                type: QueryTypes.SELECT
            }
        );

        if (userLookup.length === 0) return res.status(404).json({ error: "User not found" });

        const realUserId = userLookup[0].user_id;

        // Upsert logic using Sequelize.query
        const promises = goals.map(goal => {
            return sequelize.query(
                `INSERT INTO user_targets (user_id, habit_type_id, target_value) 
                 VALUES ($1, $2, $3) 
                 ON CONFLICT (user_id, habit_type_id) 
                 DO UPDATE SET target_value = EXCLUDED.target_value`,
                {
                    bind: [realUserId, goal.id, goal.val],
                    type: QueryTypes.INSERT
                }
            );
        });

        await Promise.all(promises);
        res.status(200).json({ message: "Goals saved successfully" });

    } catch (err) {
        console.error("POST Goals Error:", err);
        res.status(500).json({ error: "Database error" });
    }
};