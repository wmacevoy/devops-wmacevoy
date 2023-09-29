const request = require('supertest');
const { db } = require('./db');

describe('db', () => {
    it('loads', async () => {
	const firebase = await db();
	expect(firebase !== null).toBe(true);
    });
});
