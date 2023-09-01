const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const initDB = async () => {
    const pool = new Pool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });
    try {
        // Create users table
        await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        username VARCHAR PRIMARY KEY,
        password VARCHAR NOT NULL
      );
    `);

        // Create notes table
        await pool.query(`
      CREATE TABLE IF NOT EXISTS notes (
        id SERIAL PRIMARY KEY,
        username VARCHAR REFERENCES users(username),
        content TEXT
      );
    `);

        // Check if 'admin' already exists
        const usersResult = await pool.query('SELECT * FROM users WHERE username = $1', ['admin']);
        if (usersResult.rows.length === 0) {
            // Add initial user 'admin'
            const hashedPassword = await bcrypt.hash('admin', 10);
            await pool.query('INSERT INTO users (username, password) VALUES ($1, $2)', ['admin', hashedPassword]);
            console.log("'admin' user created with password 'admin'");
        }

        const notesResult = await pool.query('SELECT * FROM notes WHERE username = $1', ['admin']);
        if (notesResult.rows.length === 0) {
            const content = 'hello'
            await pool.query('INSERT INTO notes (username, content) VALUES ($1, $2)', ['admin', content]);
            console.log(`admin user add note "${content}"`);
        }

    } catch (err) {
        console.error(`Database initialization error: ${err.message}`);
    } finally {
        pool.end();
    }
};

module.exports = initDB;