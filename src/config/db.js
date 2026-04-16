const fs = require('fs');
const { Sequelize } = require("sequelize");

const isCloudRun = !!process.env.K_SERVICE;
const connectionName = process.env.INSTANCE_CONNECTION_NAME;

let sequelize;

if (isCloudRun && connectionName) {
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      dialect: "postgres",
      host: `/cloudsql/${connectionName}`,
      port: 5432,
      logging: false,
    }
  );
} else {
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      dialect: "postgres",
      host: process.env.DB_HOST,
      port: 5432,
      dialectOptions: {
        ssl: {
          rejectUnauthorized: true,
          // Use readFileSync to load the ACTUAL certificate data
          ca: fs.readFileSync(process.env.DB_CA),
          key: fs.readFileSync(process.env.DB_KEY),
          cert: fs.readFileSync(process.env.DB_CERT),

          checkServerIdentity: () => undefined,
        },
      },
      logging: false,
    }
  );
}

module.exports = sequelize;