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
          ca: process.env.DB_CA,
          key: process.env.DB_KEY,
          cert: process.env.DB_CERT,
        },
      },
      logging: false,
    }
  );
}

module.exports = sequelize;