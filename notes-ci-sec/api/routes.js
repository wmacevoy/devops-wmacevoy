const express = require('express');
const { User } = require('./user');

const isAuthenticatedAs = async (role, req, res, next) => {
    try {
	const authorization = req.headers.authorization;
	if (authorization) {
            if (authorization.startsWith('Bearer ')) {
		const jwtToken = authorization.substring(7,authorization.length);
		const user = new User({jwtToken});
		if ((await user.load(req.pool)) && (await user.hasRole(role))) {
		    req.user = user;
		    next();
		    return;
		}
	    }
	}
	res.sendStatus(403);
    } catch (error) {
	console.log(error.message);
	res.status(500).send(error.message);
    }
};

const isAdmin = async (req, res, next) => {
    await isAuthenticatedAs('admin', req, res, next);
}

const isUser = async (req, res, next) => {
    await isAuthenticatedAs('user', req, res, next);
}

module.exports = (app) => {
    const router = express.Router();

    router.post('/register', isAdmin, async (req, res) => {
	try {
            const { user_id, password } = req.body;
	    const register = new User({'id':user_id});
	    let status = 'unknown';
	    if (await register.load(pool)) {
		status = 'exists';
	    } else {
		await register.setPassword(password);
		await register.setRoles(['user']);
		if (await register.save(pool)) {
		    status = 'saved';
		}
		
	    }
	    res.status(200).send({status});
	} catch (error) {
	    console.log(error.message);
	    res.status(500).send(error.message);
	}
    });

    // Roles
    router.post('/roles', isUser, async (req, res) => {
	try {
	    res.status(200).send(await req.user.getRoles());
	} catch (error) {
	    console.log(error.message);
	    res.status(500).send(error.message);
	}
    });

    // Login
    router.post('/login', async (req, res) => {
	try {
            const { user_id, password } = req.body;
	    const user = new User({'id':user_id});
	    if ((await user.load(req.pool)) && user.checkPassword(password)) {
		const token = await user.getJwtToken();
		res.status(200).send({token});
	    } else {
		res.status(401).send('Invalid user id or password');
	    }
	} catch (error) {
	    console.log(error.message);
	    res.status(500).send(error.message);
	}
    });

    // Get Notes (Protected)
    router.get('/notes', isUser, async (req, res) => {
        try {
	    const id = await req.user.getId();
            const notes = (await req.pool.query('SELECT content FROM notes WHERE user_id = $1', [id])).rows;
            res.status(200).send(notes);
        } catch (error) {
	    console.log(error.message);	    
	    res.status(500).send(error.message);
	}
    });

    app.use('/api/v1', router);
};
