const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const util = require('util');


const jwtVerify = util.promisify(jwt.verify);
const jwtSign = util.promisify(jwt.sign);
const jwtUnverifiedPayload = (jwt) => {
    return JSON.parse(Buffer.from(jwt.split('.')[1], 'base64').toString('utf8'));
}

const isAuthenticatedAs = async (role, req, res, next) => {
    try {
	const token = req.headers['authorization'].split(' ')[1];
	const payload = jwtUnverifiedPayload(token);
	const user_id = payload.id;
	const hasRole = (await req.pool.query('SELECT EXISTS(SELECT 1 FROM user_roles WHERE user_id=$1 AND role_id=$2)',
					      [user_id,role])).rows[0].exists;
	if (hasRole) {
            const jwt_secret = (await req.pool.query('SELECT jwt_secret FROM users WHERE id = $1',
						     [user_id])).rows[0].jwt_secret;
            req.user = await jwtVerify(token,jwt_secret);
	    next();
	    return;
	}
    } catch (err) {
	console.log(`auth error ${err.message}`);
    }
    res.sendStatus(403);
};

const isAdmin = async (req,res,next) => {
    await isAuthenticatedAs('admin',req,res,next);
}

const isUser = async (req,res,next) => {
    await isAuthenticatedAs('user',req,res,next);
}

module.exports = (app) => {
    const router = express.Router();

    router.post('/register', isAdmin, async (req, res) => {
        const { user_id, password } = req.body;
        const pool = req.pool;
	const jwt_secret = crypto.randomBytes(16).toString('hex');
	const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS));

        try {
            await pool.query('INSERT INTO users (id, jwt_secret, hashed_password) VALUES ($1, $2)', [user_id, jwt_secret, hashedPassword]);
	    await pool.query('INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)', [user_id, 'user']);
            res.status(200).send({'status':'registered'});
	    return;
        } catch (err) {
            res.status(500).send(err.message);
        }
    });

    // Roles
    router.post('/roles', isUser, async (req, res) => {
	try {
            const pool = req.pool;
            const result = await pool.query('SELECT role_id FROM user_roles WHERE user_id = $1', [req.user.id]);
            const roles = result.rows.map(row => role_id);
            res.send(roles);
	    return;
	} catch (err) {
            res.status(500).send(err.message);
	}
    });

    // Login
    router.post('/login', async (req, res) => {
        const { user_id, password } = req.body;

        try {
            const user = (await req.pool.query('SELECT id, jwt_secret, hashed_password FROM users WHERE id = $1', [user_id])).rows[0];
            const passwordMatch = await bcrypt.compare(password, user.hashed_password);
            if (passwordMatch) {
		const roles = (await req.pool.query('SELECT role_id FROM user_roles WHERE user_id = $1', [user_id])).rows.map(row => row.role_id);
		const token = jwt.sign({'id' : user.id, 'roles' : roles}, user.jwt_secret, { expiresIn: '1h' });
            res.send({ token });
		return;
            }
	} catch (err) {
	    console.log(err.message);
	}
	res.status(401).send('Invalid user id or password');	
    });

    // Get Notes (Protected)
    router.get('/notes', isUser, async (req, res) => {
	try {
            const notes = (await req.pool.query('SELECT content FROM notes WHERE user_id = $1', [req.user.id])).rows;
            res.send(notes);
        } catch (err) {
            res.status(500).send(err.message);
        }
    });

    app.use('/api/v1', router);
};
