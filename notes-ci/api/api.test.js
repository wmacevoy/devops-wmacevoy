const request = require('supertest');
const { db } = require('./db');
const { app, start } = require('./app');

const admin = { 'user_id': 'alex', 'password': '@bc!23' };
const user = { 'user_id': 'jordan', 'password': 'abc123' };
const nobody = { 'user_id': 'murphy', 'password': 'yes' };

const quiet = true;

const tokenFor = async (user) => {
	const payload = { 'user_id': user.user_id, 'password': user.password };
	const response = await request(app)
		.post(`/api/v1/login`)
		.send(payload)
		.set('Accept', 'application/json')
		.expect('Content-Type', /json/)
		.expect(200);
	expect(response.body).toHaveProperty('token');
	return response.body.token;
}

describe('login', () => {
	beforeAll(async () => await db({ 'reset': true, quiet }));
	it('works for admin', async () => await tokenFor(admin));
	it('works for user', async () => await tokenFor(user));
	it('fails for nobody', async () => {
		const payload = { 'user_id': nobody.user_id, 'password': nobody.password };
		const response = await request(app)
			.post(`/api/v1/login`)
			.send(payload)
			.expect(401);
	});
});

const notesFor = async (user) => {
	const token = await tokenFor(user);
	const response = await request(app)
		.get(`/api/v1/notes`)
		.set('Authorization', `Bearer ${token}`)
		.set('Accept', 'application/json')
		.expect('Content-Type', /json/)
		.expect(200);
	notes = response.body;
	expect(notes).toEqual(expect.arrayContaining([expect.objectContaining({ content: expect.anything() })]));
	return notes;
};

describe('notes', () => {
	beforeEach(async () => await db({ 'reset': true, quiet }));
	it('fails without authorization', async () => {
		const response = await request(app)
			.get(`/api/v1/notes`)
			.set('Accept', 'application/json')
			.expect(403);
	});
	it('works for admin', async () => {
		const notes = await notesFor(admin);
		expect(notes[0].content).toBe('this is alex');
	});
	it('works for user', async () => {
		const notes = await notesFor(user);
		expect(notes[0].content).toBe('this is jordan');
	});
});
