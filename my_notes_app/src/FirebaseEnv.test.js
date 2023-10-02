const request = require('supertest');
const { FirebaseEnv } = require('./FirebaseEnv');

describe('FirebaseEnv', () => {
    it('has a configuration', async () => {
	const firebaseEnv = new FirebaseEnv();
	const config = await firebaseEnv.getConfig();

	expect(typeof config.apiKey).toBe('string');
	expect(typeof config.authDomain).toBe('string');
	expect(typeof config.projectId).toBe('string');
	expect(typeof config.storageBucket).toBe('string');
	expect(typeof config.messageSenderId).toBe('string');
	expect(typeof config.appId).toBe('string');
	expect(typeof config.measurementId).toBe('string');
    });
});
