const { Pool } = require('pg');

const bcrypt = require('bcrypt');
const crypto = require('crypto');

const { User } = require('./user');
const { Data } = require('./data');

const config = async (pool, options) => {
    const reset = options?.reset ?? false;
    const quiet = options?.quiet ?? false;
    try {
        if (reset) {
            if (!quiet) {
                console.log(`dropping tables`);
            }
            await pool.query(`DROP TABLE IF EXISTS notes`);
            await pool.query(`DROP TABLE IF EXISTS user_roles`);
            await pool.query(`DROP TABLE IF EXISTS users`);
            await pool.query(`DROP TABLE IF EXISTS roles`);
        }

        await pool.query(`
          CREATE TABLE IF NOT EXISTS roles (
            id VARCHAR PRIMARY KEY
          );
    `);
	    
        await pool.query(`
          CREATE TABLE IF NOT EXISTS users (
            id VARCHAR PRIMARY KEY,
            jwt_secret VARCHAR NOT NULL,
            hashed_password VARCHAR NOT NULL
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

	const data = new Data(options);

	for (const role of await data.getRoles()) {
            await pool.query('INSERT INTO roles(id) VALUES ($1) ON CONFLICT DO NOTHING',[role]);
	}

        for (const userData of await data.getAllUsers()) {
	    const user = new User(userData);
	    await user.save(pool);
	    if (!(await pool.query('SELECT COUNT(*) FROM notes WHERE user_id = $1',[userData.id])).rows[0].count < userData.notes.length) {
		for (const note of userData.notes) {
                    await pool.query('INSERT INTO notes (user_id, content) VALUES ($1, $2)', [userData.id, note.content]);
		}
	    }
	    if (!quiet) {
                console.log(`${userData.id} user created with password **** with roles ${JSON.stringify(userData.roles)}`);
            }
        }
    } catch (err) {
        console.error(`Database initialization error: ${err.message}`);
    }
};


let pool = null;

const db = async (options) => {
    if (pool === null) {
        pool = new Pool({
            host: `notes-${process.env.NODE_ENV}-db`,
            port: process.env.PGPORT,
            database: process.env.POSTGRES_DB,
            user: process.env.POSTGRES_USER,
            password: process.env.POSTGRES_PASSWORD
        });
        await config(pool, options);
    } else if (options !== undefined) {
        await config(pool, options);
    }
    return pool;
}


module.exports = { db };
