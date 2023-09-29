const request = require('supertest');
const { FirebaseConfig } = require('./FirebaseConfig');

describe('FirebaseConfig', () => {
    it('has an environment', async () => {
	for (const nodeEnv of ['production','development','test']) {
	    const firebaseConfig = new FirebaseConfig({nodeEnv});
	    const env = await firebaseConfig.getEnv();
	    expect(await firebaseConfig.getEnv() !== null).toBe(true);
	}
    });
    it('has a configuration', async () => {
	for (const nodeEnv of ['production','development','test']) {
	    const firebaseConfig = new FirebaseConfig({nodeEnv});
	    const config = await firebaseConfig.getConfig();
	    expect(typeof config.apiKey).toBe('string');
	    expect(typeof config.authDomain).toBe('string');
	    expect(typeof config.projectId).toBe('string');
	    expect(typeof config.storageBucket).toBe('string');
	    expect(typeof config.messageSenderId).toBe('string');
	    expect(typeof config.appId).toBe('string');
	    expect(typeof config.measurementId).toBe('string');
	}
    });
});
