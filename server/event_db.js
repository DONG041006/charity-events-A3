// event_db.js - MySQL connection pool
//
// A3 update: the database now also contains the `registrations` table
// (see schema.sql) which records event registrations / ticket purchases.
// This module only manages the connection pool; all queries against the
// tables (charity_organizations, event_categories, charity_events,
// registrations) are issued in server.js.
//
// PRODUCTION (cPanel) credentials below. For local development, replace the
// user/password/database with your local MySQL details (e.g. root/localhost).
// The half-width exclamation mark in the password is intentional.

const mysql = require('mysql2');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'xsun37_charityevents_db',
    password: 'Sxd20041006!',
    database: 'xsun37_charityevents_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test the connection on startup
pool.getConnection((err, connection) => {
    if (err) {
        console.error('Database connection failed:', err.message);
        if (err.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('  Check the username and password in event_db.js');
        } else if (err.code === 'ER_BAD_DB_ERROR') {
            console.error('  The database charityevents_db does not exist. Run schema.sql first.');
        }
    } else {
        console.log('Database connected successfully!');
        connection.release();
    }
});

module.exports = pool.promise();
