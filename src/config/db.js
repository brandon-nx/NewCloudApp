const { Sequelize } = require('sequelize');

// No more fs.readFileSync! We use the strings from the environment.
const sequelize = new Sequelize(
  process.env.DB_NAME, 
  process.env.DB_USER, 
  process.env.DB_PASSWORD, 
  {
    host: process.env.DB_HOST,
    dialect: 'postgres',
    port: 5432,
    dialectOptions: {
      ssl: {
        rejectUnauthorized: true,
        // These refer to the names we just set in the Cloud Console
        ca: process.env.DB_CA,
        key: process.env.DB_KEY,
        cert: process.env.DB_CERT,
      }
    }
  }
);

module.exports = sequelize;