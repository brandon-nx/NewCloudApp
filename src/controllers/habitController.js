const sequelize = require("../config/db");
const { QueryTypes } = require("sequelize");

// ---------- Helpers ----------

async function getUserIdByFirebaseUid(firebaseUid, transaction) {
  const rows = await sequelize.query(
    `
      SELECT user_id
      FROM users
      WHERE firebase_uid = $1
      LIMIT 1
    `,
    {
      bind: [firebaseUid],
      type: QueryTypes.SELECT,
      transaction,
    }
  );

  return rows[0]?.user_id || null;
}

async function getHabitTypeIdByName(habitName, transaction) {
  const existingRows = await sequelize.query(
    `
      SELECT habit_type_id
      FROM habit_types
      WHERE LOWER(habit_name) = LOWER($1)
      LIMIT 1
    `,
    {
      bind: [habitName],
      type: QueryTypes.SELECT,
      transaction,
    }
  );

  if (existingRows[0]?.habit_type_id) {
    return existingRows[0].habit_type_id;
  }

  const insertedRows = await sequelize.query(
    `
      INSERT INTO habit_types (habit_name)
      VALUES ($1)
      RETURNING habit_type_id
    `,
    {
      bind: [habitName],
      type: QueryTypes.INSERT,
      transaction,
    }
  );

  return insertedRows[0]?.[0]?.habit_type_id || null;
}

function formatDateTimeForSql(date) {
  const pad = (value) => String(value).padStart(2, "0");

  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function buildDateTimes(logDate, startClock, endClock) {
  const start = new Date(`${logDate}T${startClock}:00`);
  const end = new Date(`${logDate}T${endClock}:00`);

  if (end <= start) {
    end.setDate(end.getDate() + 1);
  }

  return {
    startTime: formatDateTimeForSql(start),
    endTime: formatDateTimeForSql(end),
  };
}

async function upsertHabitValue({
  transaction,
  firebaseUid,
  habitName,
  icon,
  currentValue,
  goalValue,
  increment = false,
}) {
  let updatedRows;

  if (increment) {
    updatedRows = await sequelize.query(
      `
        UPDATE habits
        SET current_value = COALESCE(current_value, 0) + $1
        WHERE firebase_uid = $2 AND LOWER(name) = LOWER($3)
        RETURNING *
      `,
      {
        bind: [currentValue, firebaseUid, habitName],
        type: QueryTypes.UPDATE,
        transaction,
      }
    );
  } else {
    updatedRows = await sequelize.query(
      `
        UPDATE habits
        SET current_value = $1
        WHERE firebase_uid = $2 AND LOWER(name) = LOWER($3)
        RETURNING *
      `,
      {
        bind: [currentValue, firebaseUid, habitName],
        type: QueryTypes.UPDATE,
        transaction,
      }
    );
  }

  let habit = updatedRows[0]?.[0];

  if (!habit) {
    const insertedRows = await sequelize.query(
      `
        INSERT INTO habits (
          firebase_uid,
          name,
          icon,
          current_value,
          goal_value,
          created_at
        )
        VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
        RETURNING *
      `,
      {
        bind: [firebaseUid, habitName, icon, currentValue, goalValue],
        type: QueryTypes.INSERT,
        transaction,
      }
    );

    habit = insertedRows[0]?.[0];
  }

  return habit;
}

// ---------- Controllers ----------

// Get all habits for the logged-in user
exports.getHabits = async (req, res) => {
  const firebaseUid = req.user.uid;

  try {
    const habits = await sequelize.query(
      `
        SELECT *
        FROM habits
        WHERE firebase_uid = $1
        ORDER BY created_at DESC
      `,
      {
        bind: [firebaseUid],
        type: QueryTypes.SELECT,
      }
    );

    return res.status(200).json(habits);
  } catch (error) {
    console.error("❌ Error fetching habits:", error);
    return res.status(500).json({
      error: "Failed to retrieve habits from database.",
      details: error.message,
    });
  }
};

// Generic habit update
exports.logHabit = async (req, res) => {
  const firebaseUid = req.user.uid;
  const { habitId, value } = req.body;

  if (!habitId) {
    return res.status(400).json({ error: "Habit ID is required" });
  }

  try {
    const rows = await sequelize.query(
      `
        UPDATE habits
        SET current_value = $1
        WHERE id = $2 AND firebase_uid = $3
        RETURNING *
      `,
      {
        bind: [value ?? 0, habitId, firebaseUid],
        type: QueryTypes.UPDATE,
      }
    );

    const updatedHabit = rows[0]?.[0];

    if (!updatedHabit) {
      return res.status(404).json({
        error: "Habit not found or unauthorized.",
      });
    }

    return res.status(200).json({
      message: "Habit updated successfully",
      habit: updatedHabit,
    });
  } catch (error) {
    console.error("❌ Error logging habit:", error);
    return res.status(500).json({
      error: "Failed to log habit activity.",
      details: error.message,
    });
  }
};

// Sleep-specific logging
exports.logSleep = async (req, res) => {
  const firebaseUid = req.user.uid;
  const { bedtime, wakeTime, durationMin, sleepQuality, logDate } = req.body;

  if (!bedtime || !wakeTime || !durationMin || !logDate) {
    return res.status(400).json({
      error: "bedtime, wakeTime, durationMin, and logDate are required.",
    });
  }

  const parsedDuration = Number(durationMin);
  const parsedQuality = Number(sleepQuality || 3);

  if (!Number.isFinite(parsedDuration) || parsedDuration <= 0) {
    return res.status(400).json({
      error: "durationMin must be a positive number.",
    });
  }

  const transaction = await sequelize.transaction();

  try {
    const userId = await getUserIdByFirebaseUid(firebaseUid, transaction);

    if (!userId) {
      await transaction.rollback();
      return res.status(404).json({
        error: "User not found in database. Please log in again.",
      });
    }

    const sleepHabitTypeId = await getHabitTypeIdByName("sleep", transaction);

    if (!sleepHabitTypeId) {
      await transaction.rollback();
      return res.status(404).json({
        error: "Sleep habit type not found in database.",
      });
    }

    const builtTimes = buildDateTimes(logDate, bedtime, wakeTime);

    const activityLogRows = await sequelize.query(
      `
        INSERT INTO activity_logs (
          user_id,
          habit_type_id,
          start_time,
          end_time,
          duration_min,
          intake_ml,
          log_date,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, NULL, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *
      `,
      {
        bind: [
          userId,
          sleepHabitTypeId,
          builtTimes.startTime,
          builtTimes.endTime,
          parsedDuration,
          logDate,
        ],
        type: QueryTypes.INSERT,
        transaction,
      }
    );

    const activityLog = activityLogRows[0]?.[0];

    const sleepHabit = await upsertHabitValue({
      transaction,
      firebaseUid,
      habitName: "Sleep",
      icon: "bedtime",
      currentValue: parsedDuration,
      goalValue: 480,
    });

    await transaction.commit();

    return res.status(201).json({
      message: "Sleep logged successfully",
      habit: sleepHabit,
      activityLog,
      sleepQuality: parsedQuality,
    });
  } catch (error) {
    await transaction.rollback();
    console.error("❌ Error logging sleep:", error);

    return res.status(500).json({
      error: "Failed to save sleep log.",
      details: error.message,
    });
  }
};

// Exercise-specific logging
exports.logExercise = async (req, res) => {
  const firebaseUid = req.user.uid;
  const { activityType, startTime, endTime, durationMin, remarks, logDate } = req.body;

  if (!activityType || !startTime || !endTime || !durationMin || !logDate) {
    return res.status(400).json({
      error: "activityType, startTime, endTime, durationMin, and logDate are required.",
    });
  }

  const parsedDuration = Number(durationMin);

  if (!Number.isFinite(parsedDuration) || parsedDuration <= 0) {
    return res.status(400).json({
      error: "durationMin must be a positive number.",
    });
  }

  const transaction = await sequelize.transaction();

  try {
    const userId = await getUserIdByFirebaseUid(firebaseUid, transaction);

    if (!userId) {
      await transaction.rollback();
      return res.status(404).json({
        error: "User not found in database. Please log in again.",
      });
    }

    const exerciseHabitTypeId = await getHabitTypeIdByName("exercise", transaction);

    if (!exerciseHabitTypeId) {
      await transaction.rollback();
      return res.status(404).json({
        error: "Exercise habit type not found in database.",
      });
    }

    const builtTimes = buildDateTimes(logDate, startTime, endTime);

    const activityLogRows = await sequelize.query(
      `
        INSERT INTO activity_logs (
          user_id,
          habit_type_id,
          start_time,
          end_time,
          duration_min,
          intake_ml,
          log_date,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, NULL, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *
      `,
      {
        bind: [
          userId,
          exerciseHabitTypeId,
          builtTimes.startTime,
          builtTimes.endTime,
          parsedDuration,
          logDate,
        ],
        type: QueryTypes.INSERT,
        transaction,
      }
    );

    const activityLog = activityLogRows[0]?.[0];

    const exerciseHabit = await upsertHabitValue({
      transaction,
      firebaseUid,
      habitName: "Exercise",
      icon: "fitness_center",
      currentValue: parsedDuration,
      goalValue: 45,
    });

    await transaction.commit();

    return res.status(201).json({
      message: "Exercise logged successfully",
      habit: exerciseHabit,
      activityLog,
      activityType,
      remarks: remarks || "",
    });
  } catch (error) {
    await transaction.rollback();
    console.error("❌ Error logging exercise:", error);

    return res.status(500).json({
      error: "Failed to save exercise log.",
      details: error.message,
    });
  }
};

// Study-specific logging
exports.logStudy = async (req, res) => {
  const firebaseUid = req.user.uid;
  const { subject, startTime, endTime, durationMin, remarks, logDate } = req.body;

  if (!startTime || !endTime || !durationMin || !logDate) {
    return res.status(400).json({
      error: "startTime, endTime, durationMin, and logDate are required.",
    });
  }

  const parsedDuration = Number(durationMin);

  if (!Number.isFinite(parsedDuration) || parsedDuration <= 0) {
    return res.status(400).json({
      error: "durationMin must be a positive number.",
    });
  }

  const transaction = await sequelize.transaction();

  try {
    const userId = await getUserIdByFirebaseUid(firebaseUid, transaction);

    if (!userId) {
      await transaction.rollback();
      return res.status(404).json({
        error: "User not found in database. Please log in again.",
      });
    }

    const studyHabitTypeId = await getHabitTypeIdByName("study", transaction);

    if (!studyHabitTypeId) {
      await transaction.rollback();
      return res.status(404).json({
        error: "Study habit type not found in database.",
      });
    }

    const builtTimes = buildDateTimes(logDate, startTime, endTime);

    const activityLogRows = await sequelize.query(
      `
        INSERT INTO activity_logs (
          user_id,
          habit_type_id,
          start_time,
          end_time,
          duration_min,
          intake_ml,
          log_date,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, NULL, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *
      `,
      {
        bind: [
          userId,
          studyHabitTypeId,
          builtTimes.startTime,
          builtTimes.endTime,
          parsedDuration,
          logDate,
        ],
        type: QueryTypes.INSERT,
        transaction,
      }
    );

    const activityLog = activityLogRows[0]?.[0];

    const studyHabit = await upsertHabitValue({
      transaction,
      firebaseUid,
      habitName: "Study",
      icon: "menu_book",
      currentValue: parsedDuration,
      goalValue: 120,
    });

    await transaction.commit();

    return res.status(201).json({
      message: "Study logged successfully",
      habit: studyHabit,
      activityLog,
      subject: subject || "",
      remarks: remarks || "",
    });
  } catch (error) {
    await transaction.rollback();
    console.error("❌ Error logging study:", error);

    return res.status(500).json({
      error: "Failed to save study log.",
      details: error.message,
    });
  }
};

// Water-specific logging
exports.logWater = async (req, res) => {
  const firebaseUid = req.user.uid;
  const { intakeMl, logDate } = req.body;

  if (!intakeMl || !logDate) {
    return res.status(400).json({
      error: "intakeMl and logDate are required.",
    });
  }

  const parsedIntakeMl = Number(intakeMl);

  if (!Number.isFinite(parsedIntakeMl) || parsedIntakeMl <= 0) {
    return res.status(400).json({
      error: "intakeMl must be a positive number.",
    });
  }

  const transaction = await sequelize.transaction();

  try {
    const userId = await getUserIdByFirebaseUid(firebaseUid, transaction);

    if (!userId) {
      await transaction.rollback();
      return res.status(404).json({
        error: "User not found in database. Please log in again.",
      });
    }

    const waterHabitTypeId = await getHabitTypeIdByName("Water Intake", transaction);

    if (!waterHabitTypeId) {
      await transaction.rollback();
      return res.status(404).json({
        error: "Water habit type not found in database.",
      });
    }

    const activityLogRows = await sequelize.query(
      `
        INSERT INTO activity_logs (
          user_id,
          habit_type_id,
          start_time,
          end_time,
          duration_min,
          intake_ml,
          log_date,
          created_at,
          updated_at
        )
        VALUES ($1, $2, NULL, NULL, NULL, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *
      `,
      {
        bind: [userId, waterHabitTypeId, parsedIntakeMl, logDate],
        type: QueryTypes.INSERT,
        transaction,
      }
    );

    const activityLog = activityLogRows[0]?.[0];

    const waterHabit = await upsertHabitValue({
      transaction,
      firebaseUid,
      habitName: "Water Intake",
      icon: "water_drop",
      currentValue: parsedIntakeMl,
      goalValue: 2500,
      increment: true,
    });

    await transaction.commit();

    return res.status(201).json({
      message: "Water logged successfully",
      habit: waterHabit,
      activityLog,
      intakeMl: parsedIntakeMl,
    });
  } catch (error) {
    await transaction.rollback();
    console.error("❌ Error logging water:", error);

    return res.status(500).json({
      error: "Failed to save water log.",
      details: error.message,
    });
  }
};