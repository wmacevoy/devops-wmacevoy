const request = require('supertest');
const { db, sleep, signup, isFirestoreReady, isAuthReady, isReady } = require('./db');
const { Data } = require('./Data');

const timeout = 60;
describe('db', () => {
    it('has auth ready within ${timeout} seconds', async () => {
	while (!(await isAuthReady())) {
	    await sleep(1);
	}
    },timeout*1000);
    it('has firestore ready within ${timeout} seconds', async () => {
	while (!(await isFirestoreReady())) {
	    await sleep(1);
	}
    },timeout*1000);
    
    it('has isReady within 30 seconds', async () => {
	const wait = true;
	await isReady(wait);
    },timeout*1000);
       
    it('loads in ${timeout} seconds', async () => {
	const data = new Data();
	const admins = await data.getAdmins();
	const admin = admins[0];
	const wait = timeout;
	await isReady(wait);
	await signup(admin);
	
	const firebase = await db({user : admin, heartbeat: true});
	expect(firebase !== null).toBe(true);
    },timeout*1000); // timeout in milliseconds
});
