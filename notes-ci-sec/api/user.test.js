const request = require('supertest');
const { Data } = require('./data');
const { User } = require('./user');
const { db } = require('./db');

describe('user', () => {
    it('has null default values', async () => {
	const user = new User();
	expect(await user.getId()).toBe(null);
	expect(await user.getPassword()).toBe(null);
	expect(await user.getHashedPassword()).toBe(null);
	expect(typeof await user.getJwtSecret()).toBe('string');
	expect(typeof await user.getJwtToken()).toBe('string');
	expect((await user.getRoles()).length).toBe(0);
    });
    
    it('has builder', async () => {
	const options = {
	    'id':'my id',
	    'password':'my password',
	    'hashedPassword':'my hashed password',
	    'jwtSecret':'03dd415a02ae9ec08e0625aefea74891',
	    'jwtToken':'my jwt token',
	    'roles':['my role'],
	};
	const user = new User(options);
	expect(await user.getId()).toBe(options.id);
	expect(await user.getPassword()).toBe(options.password);
	expect(await user.getHashedPassword()).toBe(options.hashedPassword);
	expect(await user.getJwtSecret()).toBe(options.jwtSecret);
	expect(await user.getJwtToken()).toBe(options.jwtToken);
	expect((await user.getRoles())[0]).toBe(options.roles[0]);
    });

    it('has get/set',async () => {
	const options = {
	    'id':'my id',
	    'password':'my pretty good password',
	    'hashedPassword':'my hashed password',
	    'jwtSecret':'03dd415a02ae9ec08e0625aefea74891',
	    'jwtToken':'my jwt token',
	    'roles':['my role'],
	};
	const user = new User();

	await user.setId(options.id);
	expect(await user.getId()).toBe(options.id);
	
	await user.setPassword(options.password);
	expect(await user.getPassword()).toBe(options.password);

	await user.setHashedPassword(options.hashedPassword);
	expect(await user.getHashedPassword()).toBe(options.hashedPassword);

	await user.setJwtSecret(options.jwtSecret);
	expect(await user.getJwtSecret()).toBe(options.jwtSecret);

	await user.setJwtToken(options.jwtToken);
	expect(await user.getJwtToken()).toBe(options.jwtToken);

	await user.setRoles(options.roles);
	expect((await user.getRoles())[0]).toBe(options.roles[0]);
    });

    it('checks passwords',async () => {
	const options = {
	    'id':'my id',
	    'password':'my pretty good password',
	    'hashedPassword':'my hashed password',
	    'jwtSecret':'03dd415a02ae9ec08e0625aefea74891',
	    'jwtToken':'my jwt token',
	    'roles':['my role'],
	};
	const user = new User();
	await user.setId(options.id);
	await user.setPassword(options.password);
	const hashedPassword = await user.getHashedPassword();

	const checkUserOk = new User();
	await checkUserOk.setId(options.id);
	await checkUserOk.setHashedPassword(hashedPassword);
	expect (await checkUserOk.checkPassword(options.password)).toBe(true);

	const checkUserBad = new User();
	await checkUserBad.setId(options.id);
	await checkUserBad.setHashedPassword(hashedPassword);
	expect (await checkUserBad.checkPassword(`not ${options.password}`)).toBe(false);
    });
    it('has roles', async () => {
	const user = new User();
	await user.addRole('role 1');
	await user.addRole('role 2');
	await user.addRole('role 2');
	await user.addRole('role 3');	
	
	const roles = await user.getRoles();
	expect(roles.length).toBe(3);
	expect(roles.includes('role 1')).toBe(true);
	expect(roles.includes('role 2')).toBe(true);
	expect(roles.includes('role 3')).toBe(true);	

	await user.removeRole('role 2');
	expect(roles.length).toBe(2);
	expect(roles.includes('role 1')).toBe(true);
	expect(roles.includes('role 3')).toBe(true);

	await user.removeRole('role 1');
	expect(roles.length).toBe(1);
	expect(roles.includes('role 3')).toBe(true);

	await user.removeRole('role 3');
	expect(roles.length).toBe(0);
    });
    it('saves/loads', async () => {
	const options = {
	    'id':'my id',
	    'password':'my pretty good password',
	    'roles':['role 1','role 2'],
	};
	const post = await db({'reset':true,'quiet':true});
	const saveUser = new User(options);
	await saveUser.save(post);

	const loadUser = new User({'id':options.id});
	const status = await loadUser.load(post);
	expect(status).toBe(true);

	expect(await loadUser.getId()).toBe(options.id);
	for (role of options.roles) {
	    expect((await loadUser.getRoles()).includes(role)).toBe(true);
	}
	
	expect(await loadUser.checkPassword(options.password)).toBe(true);
    });
    it('loads from token', async () => {
	const options = {
	    'id':'my id',
	    'password':'my pretty good password',
	    'roles':['role 1','role 2'],
	};
	const pool = await db({'reset':true,'quiet':true});
	const saveUser = new User(options);
	await saveUser.save(pool);

	const token = await saveUser.getJwtToken();

	const loadUser = new User({'jwtToken':token});
	const status = await loadUser.load(pool);
	expect(status).toBe(true);

	expect(await loadUser.getId()).toBe(options.id);
	for (role of options.roles) {
	    expect((await loadUser.getRoles()).includes(role)).toBe(true);
	}
	
	expect(await loadUser.checkPassword(options.password)).toBe(true);
    });
    it('works with preload data', async () => {
	const data = new Data();
	const allUsers = await data.getAllUsers();
	const pool = await db({'reset':true,'quiet':true});
	for (const userData of allUsers) {
	    const user = new User({'id':userData.id});
	    expect(await user.load(pool)).toBe(true);
	    expect(await user.getId()).toBe(userData.id);
	    expect(await user.checkPassword(userData.password)).toBe(true);
	    const roles = await user.getRoles();
	    expect(roles.length).toBe(userData.roles.length);
	    for (role of userData.roles) {
		expect(roles.includes(role)).toBe(true);
	    }
	}
    });
});
