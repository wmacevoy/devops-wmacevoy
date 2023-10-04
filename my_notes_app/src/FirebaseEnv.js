export class FirebaseEnv {
    constructor() {
	this._config = null;
    }
    async getConfig() {
	if (this._config === null) {
	    const apiKey = process.env.REACT_APP_FIREBASE_API_KEY;
	    const authDomain = process.env.REACT_APP_FIREBASE_AUTH_DOMAIN;
	    const projectId = process.env.REACT_APP_FIREBASE_PROJECT_ID;
	    const storageBucket = process.env.REACT_APP_FIREBASE_STORAGE_BUCKET;
	    const messageSenderId = process.env.REACT_APP_FIREBASE_MESSAGE_SENDER_ID;
	    const appId = process.env.REACT_APP_FIREBASE_APP_ID;
	    const measurementId = process.env.REACT_APP_FIREBASE_MEASUREMENT_ID;
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

export default FirebaseEnv;
