const express = require('express');
const bodyParser = require('body-parser');
const initDB = require('./init-db');
const routes = require('./routes');
const path = require('path');
const { pool } = require('./db');

const app = express();
app.use(bodyParser.json());

// Pass the database pool to routes
app.use((req, res, next) => {
    req.pool = pool;
    next();
});

// Setup routes
routes(app);

app.use(express.static(path.join(__dirname, 'static')));

const start = async (options) => {
    await initDB();
    const port = options?.port ?? process.env.PORT;
    return app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
};

module.exports = {
    app,
    start
};
