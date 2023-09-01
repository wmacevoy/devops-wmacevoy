const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const util = require('util');

const jwtVerify = util.promisify(jwt.verify);
const jwtSign = util.promisify(jwt.sign);

const isAuthenticatedAs = async (role, req, res, next) => {
    try {
	const token = req.headers['authorization'].split(' ')[1];
	console.log(`token ${token}`);
        req.user = await jwtVerify(token,process.env.JWT_SECRET);
	console.log(`user ${JSON.stringify(req.user)}`);
	const hasRole = (await req.pool.query('SELECT EXISTS(SELECT 1 FROM user_roles WHERE user_id=$1 AND role_id=$2)',[req.user.id,role])).rows[0].exists;
	if (hasRole) {
	    next();
	    return;
	}
    } catch (error) {
	console.log(JSON.stringify(error));
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

    // Registration
    router.post('/register', isAdmin, async (req, res) => {
        const { username, password } = req.body;
        const pool = req.pool;
        const hashedPassword = await bcrypt.hash(password, 10);

        try {
            await pool.query('INSERT INTO users (id, password) VALUES ($1, $2)', [username, hashedPassword]);
            res.status(201).send('User registered.');
        } catch (err) {
            res.status(500).send(err.message);
        }
    });

    // Roles
    router.post('/roles', isUser, async (req, res) => {
	try {
            const pool = req.pool;
            const result = await pool.query('SELECT role_id FROM user_roles WHERE user_id = $1', [req.user.id]);
            const roles = result.rows;
            res.send(roles);
        } catch (err) {
            res.status(403).send('error');
        }

    });

    // Login
    router.post('/login', async (req, res) => {
        const { username, password } = req.body;

        try {
            const user = (await req.pool.query('SELECT id, password FROM users WHERE id = $1', [username])).rows[0];
            const passwordMatch = await bcrypt.compare(password, user.password);
            if (!passwordMatch) {
                return res.status(401).send('Invalid username or password');
            }
            const roles = (await req.pool.query('SELECT role_id FROM user_roles WHERE user_id = $1', [username])).rows.map(row => row.role_id);
            const token = jwt.sign({'id' : username, 'roles' : roles}, process.env.JWT_SECRET, { expiresIn: '1h' });
            res.send({ token });
        } catch (err) {
            console.log(JSON.stringify(err));
            res.status(500).send(err.message);
        }
    });

    // Get Notes (Protected)
    router.get('/notes', isUser, async (req, res) => {
	try {
            const notes = (await req.pool.query('SELECT * FROM notes WHERE user_id = $1', [req.user.id])).rows;
	    console.log(`notes ${JSON.stringify(notes)}`);
            res.send(notes);
        } catch (err) {
            res.status(403).send('error');
        }
    });

    app.use('/api/v1', router);
};
