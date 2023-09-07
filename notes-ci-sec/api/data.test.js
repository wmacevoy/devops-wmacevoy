const request = require('supertest');
const { Data } = require('./data');

describe('data', () => {
    it('exists', async () => {
	const data = new Data();
	expect(typeof data).toBe('object');
	expect(typeof data.dataFile).toBe('string');
	expect(typeof await data.getData()).toBe('object');
    });
    it('has roles', async () => {
	const data = new Data();
	const roles = await data.getRoles();
	expect(Array.isArray(roles) &&
	       roles.every(item => typeof item === 'string')).toBe(true);
    });
    it('has all users', async () => {
	const data = new Data();
	const allUsers = await data.getAllUsers();
	expect(Array.isArray(allUsers) &&
	       allUsers.every(user => (typeof user.id === 'string' && typeof user.password === 'string' && Array.isArray(user.notes)))).toBe(true);
    });
    it('has some admins', async () => {
	const data = new Data();	
	const admins = await data.getAdmins();
	expect(Array.isArray(admins) && admins.length > 0).toBe(true);
	expect(admins.every(admin => admin.roles.includes('admin') && admin.roles.includes('user'))).toBe(true);
    });
    it('has some users', async () => {
	const data = new Data();
	const users = await data.getUsers();
	expect(Array.isArray(users) && users.length > 0).toBe(true);
	expect(users.every(user => (!user.roles.includes('admin')) && user.roles.includes('user'))).toBe(true);
    });
    
    it('has some nobodies', async () => {
	const data = new Data();
	const nobodies = await data.getNobodies();
	expect(Array.isArray(nobodies) && nobodies.length > 0).toBe(true);
	expect(nobodies.every(nobody => nobody.roles.length === 0)).toBe(true);
    });
});
