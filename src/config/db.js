// const { Sequelize } = require("sequelize");
// require("dotenv").config();

// const sequelize = new Sequelize(
//   process.env.DB_NAME,
//   process.env.DB_USER,
//   process.env.DB_PASSWORD,
//   {
//     host: process.env.DB_HOST,
//     dialect: process.env.DB_DIALECT || "mysql",
//     logging: false,
//   }
// );

// module.exports = sequelize;

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: {
    rejectUnauthorized: false, // Essential for self-signed Cloud SQL certs
    ca: fs.readFileSync(path.join(__dirname, '..', 'certs', 'server-ca.pem')).toString(),
    key: fs.readFileSync(path.join(__dirname, '..', 'certs', 'client-key.pem')).toString(),
    cert: fs.readFileSync(path.join(__dirname, '..', 'certs', 'client-cert.pem')).toString(),
  },
});

// Test connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Connection error:', err.stack);
  } else {
    console.log('✅ Successfully connected to Google Cloud SQL via SSL!');
  }
});

module.exports = pool;