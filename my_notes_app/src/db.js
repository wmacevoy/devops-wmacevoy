const firebase = require("firebase/app");
const auth = require("firebase/auth");
require("firebase/firestore");

const { FirebaseConfig } = require('./FirebaseConfig');

let _db = null;

const config = async (db,options) => {
    const id = `${process.env.APP}_${process.pid}`;
    const docRef = db.collection('heartbeats').doc(id);
    docRef.set({
	timestamp: _firestore.FieldValue.serverTimestamp()
    }, { merge: true })
	.then(() => {
	    console.log(`heartbeat ${id} set`);
	})
	.catch((error) => {
	    console.error(`error settng heartbeat ${id}: `, error);
	});
}

const db = async (options) => {
    if (_db == null) {
	const firebaseConfig = new FirebaseConfig(options);
	const config = await firebaseConfig.getConfig();
	firebase.initializeApp(config);
	_db = firebase.firestore;
        await config(firestore, options);
    } else if (options !== undefined) {
        await config(_db, options);
    }
    return _db;
}

module.exports = { db };
