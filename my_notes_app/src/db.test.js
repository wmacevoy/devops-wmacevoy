const request = require('supertest');
const { db, auth } = require('./db');
const { Data } = require('./Data');

describe('db', () => {
    it('loads in  600 seconds or less', async () => {
	const data = new Data();
	const admins = await data.getAdmins();
	const user = admins[0];
	const firebase = await db({user});
	expect(firebase !== null).toBe(true);
    },5000);
});
