const express = require('express');
const bodyParser = require('body-parser');
const routes = require('./routes');
const path = require('path');
const { db } = require('./db');

const app = express();
app.use(bodyParser.json());

// Pass the database pool to routes
app.use(async (req, res, next) => {
    req.pool = await db();
    next();
});

// Setup routes
routes(app);

app.use(express.static(path.join(__dirname, 'static')));

const start = async (options) => {
    const port = options?.port ?? process.env.API_PORT;
    return app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
};

module.exports = {
    app,
    start
};
