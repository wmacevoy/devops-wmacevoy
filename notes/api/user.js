const pako = require('pako');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const util = require('util');
const crypto = require('crypto');

const jwtVerify = util.promisify(jwt.verify);
const jwtSign = util.promisify(jwt.sign);
const jwtUnverifiedPayload = (jwt) => {
    return JSON.parse(Buffer.from(jwt.split('.')[1], 'base64').toString('utf8'));
}

function estimatePasswordEntropyByCompression(password) {
  const compressed = pako.deflate(password);
  const compressedLength = compressed.length;
  const entropy = compressedLength * 8; // 8 bits per byte
  return entropy;
}

const baselineEntropy = estimatePasswordEntropyByCompression('abc123');
const entropy = (password) => Math.max(estimatePasswordEntropyByCompression(password)-baselineEntropy,0);

class User {
    constructor(options) {
	this._options = options;
	this._id = options?.id ?? null;
	this._password = options?.password ?? null;
	this._hashedPassword = options?.hashedPassword ?? null;
	this._jwtSecret = options?.jwtSecret ?? null;
	this._jwtToken = options?.jwtToken ?? null;
	this._roles = options?.roles ?? [];
    }

    async getId() {
	return this._id;
    }
    
    async setId(value) {
	const regex = /^[-+._ a-zA-Z0-9]+$/;
	if (typeof value === 'string') {
	    value = value.trim().toLowerCase();
	    if (regex.test(value)) {
		this._id = value;
		return;
	    }
	}
	throw new TypeError("invalid id");
    }

    async getPassword() {
	return this._password;
    }

    async setPassword(value) {
	const minEntropy = this._options?.minEntropy ?? 10;
	const estimate = (typeof value === 'string') ? entropy(value) : 0;
	
	if (typeof value === 'string') {
	    value = value.trim();
	    if (estimate >= minEntropy) {
		this._password = value;
		this._hashedPassword = null;
		this._jwtSecret = null;
		return;
	    }
	}
	throw new TypeError(`password is missing ${minEntropy-estimate} bits of randomness.`);
    }

    async checkPassword(value) {
	const hashedPassword = await this.getHashedPassword();
	return await bcrypt.compare(value.trim(),hashedPassword);
    }

    async getHashedPassword() {
	const rounds = this._options?.rounds ?? parseInt(process.env.BCRYPT_ROUNDS || 10);
	if (this._hashedPassword === null && this._password !== null) {
	    this._hashedPassword = await bcrypt.hash(this._password, rounds);
	}
	return this._hashedPassword;
    }

    async setHashedPassword(value) {
	if (typeof value === 'string') {
	    if (this._hashedPassword !== value) {
		this._hashedPassword = value;
		this._password = null;
	    }
	    return;
	}
	throw new TypeError(`hashed password is not a string`);
    }

    async getJwtSecret() {
	if (this._jwtSecret === null) {
            this._jwtSecret = crypto.randomBytes(16).toString('hex');
	}
	return this._jwtSecret;
    }

    async setJwtSecret(value) {
	this._jwtSecret = value;
    }

    async getJwtToken() {
	if (this._jwtToken === null) {
	    const id = await this.getId();
	    const jwtSecret = await this.getJwtSecret();
	    if (jwtSecret !== null) {
		const roles = await this.getRoles();
		this._jwtToken = jwt.sign({ 'id': id, 'roles': roles }, jwtSecret, { expiresIn: '1h' });
	    }
	}
	return this._jwtToken;
    }

    async setJwtToken(value) {
	this._jwtToken = value;
    }

    async getRoles() {
	return this._roles;
    }

    async setRoles(value) {
	this._roles = Array.from(value);
    }
    
    async addRole(value) {
	if (typeof value === 'string' && !this._roles.includes(value)) {
	    this._roles.push(value);
	}
    }
    
    async removeRole(value) {
	const roles = this._roles;
	let n = 0;
	for (let i=0; i < roles.length; ++i) {
	    if (roles[i] !== value) {
		if (n<i) {
		    roles[n]=roles[i];
		}
		++n;
	    }
	}
	if (n < roles.length) {
	    roles.length = n;
	}
    }

    async hasRole(value) {
	const roles = this._roles;	
	return typeof value === 'string' && roles !== null && roles.includes(value);
    }

    async load(pool) {
	let user = null;
	if (this._id == null) {
	    if (this._jwtToken !== null) {
		const payload = jwtUnverifiedPayload(this._jwtToken);
		const id = payload?.id ?? null;
		if (id !== null) {
		    const users = (await pool.query('SELECT id,jwt_secret,hashed_password FROM users WHERE id = $1',[id])).rows;
		    if (users.length == 1 && await jwtVerify(this._jwtToken, users[0].jwt_secret)) {
			user = users[0];
		    }
		}
	    }
	} else if (this._id !== null) {
            const users = (await pool.query('SELECT id, jwt_secret, hashed_password FROM users WHERE id = $1', [this._id])).rows;
	    if (users.length == 1) {
		user = users[0];
	    }
	}
	
	if (user == null) {
	    return false;
	}

	this._id = user.id;
	this._jwtSecret = user.jwt_secret;
	this._password = null;
	this._hashedPassword = user.hashed_password;

	this._roles = (await pool.query('SELECT role_id FROM user_roles WHERE user_id = $1', [this._id])).rows.map(item => item.role_id);

	return true;
    }

    async save(pool) {
	const id = await this.getId();
	const hashedPassword = await this.getHashedPassword();
	const jwtSecret = await this.getJwtSecret();
	const roles = await this.getRoles();
	
	if (roles.length > 0) {
	    for (const role of roles) {
		await pool.query('INSERT INTO roles(id) VALUES ($1) ON CONFLICT DO NOTHING',[role]);
	    }
	}
	
        await pool.query('INSERT INTO users (id, jwt_secret, hashed_password) VALUES ($1, $2, $3) ON CONFLICT(id) DO UPDATE SET jwt_secret = EXCLUDED.jwt_secret, hashed_password = EXCLUDED.hashed_password', [id, jwtSecret, hashedPassword]);

	const oldRoles = (await pool.query('SELECT role_id FROM user_roles WHERE user_id=$1',[id])).rows.map(row => row.role_id);
	for (const oldRole of oldRoles) {
	    if (!roles.includes(oldRole)) {
		await pool.query('DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2', [id,oldRole]);
	    }
	}
	for (const newRole of roles) {
	    if (!oldRoles.includes(newRole)) {
		await pool.query('INSERT INTO user_roles(user_id,role_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',[id,newRole]);
	    }
	}
    }
}

module.exports = { User };
