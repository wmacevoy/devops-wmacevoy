const request = require('supertest');
const { pool } = require('./db');
const { app , start } = require('./app');

const admin = { 'user_id' : 'alex', 'password' : '@bc!23' };
const user = { 'user_id' : 'jordan', 'password' : 'abc123' };
const nobody = { 'user_id' : 'murphy', 'password' : 'yes' };

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

describe('post /api/v1/login', () => {
    it('should return a token for admin', async () => {
	tokenFor(admin);
    });
    it('should return a token for user', async () => {
	tokenFor(user);
    });

    it('should not return a token for nobody', async () => {
	const payload = { 'user_id' : nobody.user_id, 'password' : nobody.password };
	const response = await request(app)
	      .post(`/api/v1/login`)
	      .send(payload)
	      .expect(401);
    });
});

describe('post /api/v1/notes', () => {
    it('should return notes for admin', async () => {
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
});
