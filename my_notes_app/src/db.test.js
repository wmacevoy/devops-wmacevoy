const request = require('supertest');
const { db, signup, isFirestoreReady, isAuthReady } = require('./db');
const { Data } = require('./Data');

// https://dev.to/codingwithadam/how-to-make-a-sleep-function-in-javascript-with-async-await-499b

describe('db', () => {
    it('has auth ready within 30 seconds', async () => {
	while (!(await isAuthReady())) {
	    await sleep(1);
	}
    },30000);
    it('has firestore ready within 30 seconds', async () => {
	while (!(await isFirestoreReady())) {
	    await sleep(1);
	}
    },30000);
       
    it('loads', async () => {
	const data = new Data();
	const admins = await data.getAdmins();
	const admin = admins[0];
	const firebase = await db({user : admin, heartbeat: true});
	expect(firebase !== null).toBe(true);
    },5000); // timeout in milliseconds
});
