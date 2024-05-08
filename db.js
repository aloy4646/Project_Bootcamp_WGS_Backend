const { Pool } = require('pg')
require('dotenv').config()

const db = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
})

// Handle error koneksi
db.on('error', (err, client) => {
    console.error('Error:', err);
});

module.exports = db