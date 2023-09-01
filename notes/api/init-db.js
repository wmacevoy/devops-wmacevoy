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

        await pool.query(`
          CREATE TABLE IF NOT EXISTS roles (
            id VARCHAR PRIMARY KEY
          );
    `);

        await pool.query(`
          CREATE TABLE IF NOT EXISTS users (
            id VARCHAR PRIMARY KEY,
            password VARCHAR NOT NULL
          );
    `);

        await pool.query(`
          CREATE TABLE IF NOT EXISTS user_roles (
            user_id VARCHAR REFERENCES users(id),
            role_id VARCHAR REFERENCES roles(id),
            PRIMARY KEY (user_id, role_id)
          );
    `);
        await pool.query(`
      CREATE TABLE IF NOT EXISTS notes (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR REFERENCES users(id),
        content TEXT
      );
    `);

	adminId='admin';
	adminPassword='admin';
	const usersResult = await pool.query('SELECT * FROM users WHERE id = $1', [adminId]);
        if (usersResult.rows.length === 0) {
            const hashedPassword = await bcrypt.hash(adminPassword, 10);
            await pool.query('INSERT INTO users (id, password) VALUES ($1, $2)', [adminId, hashedPassword]);
            console.log(`${adminId} user created with password ${adminPassword}`);
	}

	for (const role of ['user','admin']) {
	    await pool.query('INSERT INTO roles (id) VALUES ($1) ON CONFLICT DO NOTHING', [role]);
	    await pool.query('INSERT INTO user_roles (user_id,role_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',[adminId,role]);
        }

        const notesResult = await pool.query('SELECT * FROM notes WHERE user_id = $1', [adminId]);
        if (notesResult.rows.length === 0) {
            const content = 'hello'
            await pool.query('INSERT INTO notes (user_id, content) VALUES ($1, $2)', [adminId, content]);
            console.log(`${adminId} add note "${content}"`);
        }
    } catch (err) {
        console.error(`Database initialization error: ${err.message}`);
    } finally {
        pool.end();
    }
};

module.exports = initDB;
