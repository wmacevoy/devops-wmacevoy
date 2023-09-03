const request = require('supertest');
const { db } = require('./db');
const { app , start } = require('./app');

const admin = { 'user_id' : 'alex', 'password' : '@bc!23' };
const user = { 'user_id' : 'jordan', 'password' : 'abc123' };
const nobody = { 'user_id' : 'murphy', 'password' : 'yes' };

const quiet = true;

const tokenFor = async (user) => {
    const payload = { 'user_id' : user.user_id, 'password' : user.password };
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
    it('works for admin', async () => {
	await db({'reset':true, quiet });
	await tokenFor(admin);
    });
    it('works for user', async () => {
	await db({'reset':true, quiet });
	await tokenFor(user);
    });
    it('fails for nobody',async () => {
	await db({'reset':true, quiet });
	await db({'reset':true, quiet });
	const payload = { 'user_id' : nobody.user_id, 'password' : nobody.password };
	const response = await request(app)
	      .post(`/api/v1/login`)
	      .send(payload)
	      .expect(401);
    });
});

describe('notes', () => {
    it('works for admin', async () => {
	await db({'reset':true, quiet });
	const token = await tokenFor(admin);
	const response = await request(app)
	      .get(`/api/v1/notes`)
	      .set('Authorization', `Bearer ${token}`)
	      .set('Accept', 'application/json')
	      .expect('Content-Type', /json/)
	      .expect(200);

	notes = response.body;
	expect(notes[0].content).toBe('this is alex');
    });
    it('works for jordan', async () => {
	await db({'reset':true, quiet });
	const token = await tokenFor(user);
	const response = await request(app)
	      .get(`/api/v1/notes`)
	      .set('Authorization', `Bearer ${token}`)
	      .set('Accept', 'application/json')
	      .expect('Content-Type', /json/)
	      .expect(200);

	notes = response.body;
	expect(notes[0].content).toBe('this is jordan');
    });
    it('fails without authorization', async () => {
	await db({'reset':true, quiet });
	const response = await request(app)
	      .get(`/api/v1/notes`)
	      .set('Accept', 'application/json')
	      .expect(403);
    });
});
