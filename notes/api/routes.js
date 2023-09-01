const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    
    if (authHeader) {
      const token = authHeader.split(' ')[1];  // Extract the token from Bearer
  
      // Validate token here
      // ...
  
      next(); // proceed to next middleware
    } else {
      res.sendStatus(403); // Forbidden
    }
  };
  

module.exports = (app) => {
    const router = express.Router();

    // Registration
    router.post('/register', async (req, res) => {
        const { username, password } = req.body;
        const pool = req.pool;
        const hashedPassword = await bcrypt.hash(password, 10);

        try {
            await pool.query('INSERT INTO users (username, password) VALUES ($1, $2)', [username, hashedPassword]);
            res.status(201).send('User registered.');
        } catch (err) {
            res.status(500).send(err.message);
        }
    });

    // Login
    router.post('/login', async (req, res) => {
        console.log('login post');
        const { username, password } = req.body;
        const pool = req.pool;

        try {
            const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
            const user = result.rows[0];

            if (!user) {
                return res.status(401).send('Invalid username or password');
            }

            const passwordMatch = await bcrypt.compare(password, user.password);
            if (!passwordMatch) {
                return res.status(401).send('Invalid username or password');
            }

            const token = jwt.sign({ username }, 'secret-key', { expiresIn: '1h' });
            res.send({ token });
        } catch (err) {
            res.status(500).send(err.message);
        }
    });

    // Get Notes (Protected)
    router.get('/notes', async (req, res) => {
        try {
           const token = req.headers['authorization'].split(' ')[1];
           const pool = req.pool;
           const payload = jwt.verify(token, 'secret-key');
           const username = payload.username;
           const result = await pool.query('SELECT * FROM notes WHERE username = $1', [username]);
           const notes = result.rows;
           console.log("processing login");
           res.send(notes);
        } catch (err) {
            res.status(403).send('Invalid token');
        }
    });

    app.use('/api/v1', router);
};
