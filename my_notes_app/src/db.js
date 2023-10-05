// thanks to https://www.doc.ic.ac.uk/~nuric/coding/how-to-setup-and-connect-firebase-emulators.html

import { initializeApp, FirebaseOptions } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { collection, doc, setDoc, getFirestore, serverTimestamp, connectFirestoreEmulator }
  from "firebase/firestore";
// import { connectStorageEmulator, getStorage } from "firebase/storage";
import { connectAuthEmulator, getAuth, signInWithEmailAndPassword } from "firebase/auth";

import { FirebaseEnv } from './FirebaseEnv';

let app = null;

const config = async (app,options) => {
    if (process.env.NODE_ENV === "test" || process.env.NODE_ENV === "development") {
	const dbHost = `${process.env.REACT_APP_NAME}-${process.env.REACT_APP_NODE_ENV}-db`;
	console.log(`connecting to firebase emulator on ${dbHost}`);
	connectAuthEmulator(getAuth(app), `http://${dbHost}:${process.env.REACT_APP_AUTH_PORT}`);
	// connectFirestoreEmulator(getFirestore(app), `http://${dbHost}:${process.env.REACT_APP_FIRESTORE_PORT}`);
	// connectStorageEmulator(getStorage(app), "localhost", 9199);
    }
    if (options !== undefined && options.user !== undefined) {
	const user = options.user;
	await signInWithEmailAndPassword ( getAuth(app), user.email, user.password );
    }
    const id = `${process.env.REACT_APP_NAME}_${process.pid}`;
    const timestamp = serverTimestamp();
    const heartbeats = collection(getFirestore(app),'heartbeats');
    const heartbeat = doc(heartbeats,id);
    await setDoc(heartbeat,{ timestamp });
}

export const db = async (options) => {
    if (app === null) {
	const firebaseEnv = new FirebaseEnv(options);
	const firebaseConfig = await firebaseEnv.getConfig();

	app = initializeApp(firebaseConfig);
	
        await config(app, options);
    } else if (options !== undefined) {
        await config(firestore, options);
    }
    return getFirestore(app);
}

export default db;
