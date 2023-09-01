const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const initDB = require('./init-db');
const routes = require('./routes');
const path = require('path');

const app = express();
app.use(bodyParser.json());

// Connect to PostgreSQL
const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

// Pass the database pool to routes
app.use((req, res, next) => {
    req.pool = pool;
    next();
});

// Setup routes
routes(app);

const port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'static')));

const startServer = async () => {
    await initDB();
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
};

startServer();
