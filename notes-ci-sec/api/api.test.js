const request = require('supertest');
const { db } = require('./db');
const { app, start } = require('./app');
const { Data } = require('./data');

const data = new Data();

const quiet = true;

const tokenFor = async (user) => {
	const payload = { 'user_id': user.id, 'password': user.password };
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
    it('works for admins', async () => {
	for (const admin of await data.getAdmins()) {
	  await tokenFor(admin);
	}
    });
    it('works for users', async () => {
	for (const user of await data.getUsers()) {
	  await tokenFor(user);
	}
    });
    it('works for nobodies', async () => {
	for (const nobody of await data.getNobodies()) {
	  await tokenFor(nobody);
	}
    });
    if ('fails for bad passwords',async () => {
	for (const user of await data.getAllUsers()) {
	    const payload = { 'user_id': user.id, 'password': `not ${user.password}` };
	    const response = await request(app)
		  .post(`/api/v1/login`)
		  .send(payload)
		  .expect(401);
	}
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
    it('works for admins', async () => {
	for (const admin of await data.getAdmins()) {	
	    const notes = await notesFor(admin);
	    for (note of admin.notes) {
		expect(notes).toEqual(expect.arrayContaining([expect.objectContaining({ content: note.content })]));		
	    }
	}
    });
    it('works for users', async () => {
	for (const user of await data.getUsers()) {	
	    const notes = await notesFor(user);
	    for (note of user.notes) {
		expect(notes).toEqual(expect.arrayContaining([expect.objectContaining({ content: note.content })]));
	    }
	}
    });
    it('fails for nobodies', async () => {
	for (const nobody of await data.getNobodies()) {	
	    const token = await tokenFor(nobody);
	    const response = await request(app)
		  .get(`/api/v1/notes`)
		  .set('Authorization', `Bearer ${token}`)
		  .set('Accept', 'application/json')
		  .expect(403);
	}
    });
});
