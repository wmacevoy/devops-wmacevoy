const request = require('supertest');
const { db, signup, isFirestoreReady, isAuthReady } = require('./db');
const { Data } = require('./Data');

// https://dev.to/codingwithadam/how-to-make-a-sleep-function-in-javascript-with-async-await-499b

describe('db', () => {
    it('has auth ready within 10 seconds', async () => {
	while (!(await isAuthReady())) {
	    await sleep(1);
	}
    },10000);
    it('has firestore ready within 10 seconds', async () => {
	while (!(await isFirestoreReady())) {
	    await sleep(1);
	}
    },10000);
       
    it('loads', async () => {
	const data = new Data();
	const admins = await data.getAdmins();
	const admin = admins[0];
	// balk while admin server is available
	while ((await signup(admin)).status === 404) { await sleep(1); }
	const firebase = await db({user : admin, heartbeat: true});
	expect(firebase !== null).toBe(true);
    },5000); // timeout in milliseconds
});
