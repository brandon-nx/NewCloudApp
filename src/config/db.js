const { Sequelize } = require("sequelize");

const isCloudRun = !!process.env.K_SERVICE;
const connectionName = process.env.INSTANCE_CONNECTION_NAME;

let sequelize;

if (isCloudRun && connectionName) {
  // PRODUCTION: Cloud Run (Unix Socket)
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      dialect: "postgres",
      host: `/cloudsql/${connectionName}`,
      logging: false,
      dialectOptions: {
        socketPath: `/cloudsql/${connectionName}` 
      }
    }
  );
} else {
  // LOCAL: Public IP + SSL
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
          require: true,
          rejectUnauthorized: false, 
        },
      },
      logging: false,
    }
  );
}

sequelize.authenticate()
  .then(() => {
    console.log('✅ DATABASE CONNECTION: SUCCESS');
  })
  .catch(err => {
    console.error('❌ DATABASE CONNECTION: FAILED', err.message);
  });

module.exports = sequelize;




// const { Sequelize } = require("sequelize");

// const isCloudRun = !!process.env.K_SERVICE;
// const connectionName = process.env.INSTANCE_CONNECTION_NAME;

// let sequelize;

// if (isCloudRun && connectionName) {
//   // --- PRODUCTION: Cloud Run ---
//   // When deployed, we connect via the Cloud SQL Unix socket
//   sequelize = new Sequelize(
//     process.env.DB_NAME,
//     process.env.DB_USER,
//     process.env.DB_PASSWORD,
//     {
//       dialect: "postgres",
//       host: `/cloudsql/${connectionName}`,
//       // port: 5432,
//       // logging: false,
//       logging: false,
//       dialectOptions: {
//         // THIS IS THE CRITICAL ADDITION
//         socketPath: `/cloudsql/${connectionName}` 
//       }
//     }
//   );
// } else {
//   // --- LOCAL DEVELOPMENT: Your Laptop ---
//   // We use the Public IP. We still use SSL, but we skip certificate verification
//   // so you don't need to have .pem files locally.
//   sequelize = new Sequelize(
//     process.env.DB_NAME,
//     process.env.DB_USER,
//     process.env.DB_PASSWORD,
//     {
//       dialect: "postgres",
//       host: process.env.DB_HOST,
//       port: 5432,
//       dialectOptions: {
//         ssl: {
//           require: true,
//           // This bypasses the need for fs.readFileSync calls
//           rejectUnauthorized: false, 
//         },
//       },
//       logging: false,
//     }
//   );
// }
// // ... after your if/else logic that defines 'sequelize' ...

// // ADD THIS HERE:
// sequelize.authenticate()
//   .then(() => {
//     console.log('-----------------------------------------------');
//     console.log('✅ DATABASE CONNECTION: SUCCESS');
//     console.log(`Environment: ${isCloudRun ? 'Cloud Run (Production)' : 'Local'}`);
//     console.log('-----------------------------------------------');
//   })
//   .catch(err => {
//     console.error('-----------------------------------------------');
//     console.error('❌ DATABASE CONNECTION: FAILED');
//     console.error('Error Details:', err.message);
//     console.log('-----------------------------------------------');
//   });

// module.exports = sequelize;






// const fs = require('fs');
// const { Sequelize } = require("sequelize");

// const isCloudRun = !!process.env.K_SERVICE;
// const connectionName = process.env.INSTANCE_CONNECTION_NAME;

// let sequelize;

// if (isCloudRun && connectionName) {
//   sequelize = new Sequelize(
//     process.env.DB_NAME,
//     process.env.DB_USER,
//     process.env.DB_PASSWORD,
//     {
//       dialect: "postgres",
//       host: `/cloudsql/${connectionName}`,
//       port: 5432,
//       logging: false,
//     }
//   );
// } else {
//   sequelize = new Sequelize(
//     process.env.DB_NAME,
//     process.env.DB_USER,
//     process.env.DB_PASSWORD,
//     {
//       dialect: "postgres",
//       host: process.env.DB_HOST,
//       port: 5432,
//       dialectOptions: {
//         ssl: {
//           rejectUnauthorized: true,
//           // Use readFileSync to load the ACTUAL certificate data
//           ca: fs.readFileSync(process.env.DB_CA),
//           key: fs.readFileSync(process.env.DB_KEY),
//           cert: fs.readFileSync(process.env.DB_CERT),

//           checkServerIdentity: () => undefined,
//         },
//       },
//       logging: false,
//     }
//   );
// }

// module.exports = sequelize;