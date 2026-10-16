// event_db.js - MySQL connection pool

const mysql = require('mysql2');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'Sxd20041006',
    database: 'charityevents_db',
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
