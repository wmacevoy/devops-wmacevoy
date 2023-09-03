const { Pool } = require('pg');

const bcrypt = require('bcrypt');
const crypto = require('crypto');

const config = async (pool,options) => {
    const reset = options?.reset ?? false;
    try {
	if (reset) {
            await pool.query(`DROP ALL TABLES`);
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

	const alex = { 'id': 'alex', 'password': '@bc!23', 'roles': ['admin','user'], notes : [{content:'this is alex'}] };
	const jordan = {'id':'jordan','password':'abc123','roles':['user'], notes : [{content:'this is jordan'}] };
	
	for (const user of [alex,jordan]) {
	    const result = await pool.query('SELECT id FROM users WHERE id = $1', [user.id]);
            if (result.rows.length === 0) {
		const jwt_secret = crypto.randomBytes(16).toString('hex');
		const hashedPassword = await bcrypt.hash(user.password, parseInt(process.env.BCRYPT_ROUNDS));
		await pool.query('INSERT INTO users (id, jwt_secret, hashed_password) VALUES ($1, $2, $3)', [user.id, jwt_secret, hashedPassword]);
		for (const role of user.roles) {
		    await pool.query('INSERT INTO roles (id) VALUES ($1) ON CONFLICT DO NOTHING', [role]);
		    await pool.query('INSERT INTO user_roles (user_id,role_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',[user.id,role]);
		}
		for (const note of user.notes) {
		    await pool.query('INSERT INTO notes (user_id, content) VALUES ($1, $2)', [user.id, note.content]);
		}
		console.log(`${user.id} user created with password ${user.password} with roles ${JSON.stringify(user.roles)}`);
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
	await config(pool,options);
    } else if (options !== null) {
	await config(pool,options);
    }
    
    return pool;
}

module.exports = { db };

