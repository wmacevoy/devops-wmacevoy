const fs = require('fs');
const util = require('util');
const dotenv = require('dotenv');
const readFile = util.promisify(fs.readFile);

class FirebaseConfig {
    constructor(options) {
	this._nodeEnv = options?.nodeEnv ?? process.env.NODE_ENV;
	this._env = null;
	this._config = null;
    }

    get dataFile() {
	return `./src/private/firebase-${this._nodeEnv}.env`;
    }
    
    async getEnv() {
	if (this._env === null) {
	    this._env = dotenv.parse(await readFile(this.dataFile, 'utf8'));
	}
	return this._env;
    }

    async getConfig() {
	if (this._config === null) {
	    const env = await this.getEnv();
	    const apiKey = env.FIREBASE_API_KEY;
	    const authDomain = env.FIREBASE_AUTH_DOMAIN;
	    const projectId = env.FIREBASE_PROJECT_ID;
	    const storageBucket = env.FIREBASE_STORAGE_BUCKET;
	    const messageSenderId = env.FIREBASE_MESSAGE_SENDER_ID;
	    const appId = env.FIREBASE_APP_ID;
	    const measurementId = env.FIREBASE_MEASUREMENT_ID;
	    this._config = {
		apiKey,
		authDomain,
		projectId,
		storageBucket,
		messageSenderId,
		appId,
		measurementId
	    };
	}
	return this._config;
    }
}

module.exports = { FirebaseConfig };
