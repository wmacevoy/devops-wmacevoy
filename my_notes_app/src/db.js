// thanks to https://www.doc.ic.ac.uk/~nuric/coding/how-to-setup-and-connect-firebase-emulators.html

import { initializeApp } from "firebase/app";
import { collection, doc, setDoc, getFirestore, serverTimestamp, connectFirestoreEmulator }
  from "firebase/firestore";
import { connectAuthEmulator, getAuth, signInWithEmailAndPassword } from "firebase/auth";

import { FirebaseEnv } from './FirebaseEnv';

let app = null;

export const sleep = async (seconds) => new Promise((resolve) =>setTimeout(resolve, seconds * 1000));

export const getNodeEnv = () => {
    return process.env.NODE_ENV || process.env.REACT_APP_NODE_ENV;
};

export const isEmulated = () => {
    return ["test","development"].includes(getNodeEnv());
};

export const getAuthUrl = () => {
    if (isEmulated()) {
	const dbHost = `${process.env.REACT_APP_NAME}-${process.env.REACT_APP_NODE_ENV}-db`;
	const authPort = parseInt(process.env.REACT_APP_AUTH_PORT);
	return `http://${dbHost}:${authPort}/identitytoolkit.googleapis.com/v1`;
    } else {
	return "https://identitytoolkit.googleapis.com/v1";
    }
}

export const getFirestoreUrl = () => {
    if (isEmulated()) {
	const dbHost = `${process.env.REACT_APP_NAME}-${process.env.REACT_APP_NODE_ENV}-db`;
	const firestorePort = parseInt(process.env.REACT_APP_FIRESTORE_PORT);
	return `http://${dbHost}:${firestorePort}/firestore.googleapis.com/v1`;
    } else {
	return "https://firestore.googleapis.com/v1";
    }
}

export const isAuthReady = async () => {
    if (isEmulated()) {
	const dbHost = `${process.env.REACT_APP_NAME}-${process.env.REACT_APP_NODE_ENV}-db`;
	const authPort = parseInt(process.env.REACT_APP_AUTH_PORT);

	const response = await fetch(`http://${dbHost}:${authPort}`,{
	  method: 'GET',
	  headers: {
	      'Accept': 'application/json',
	  }
	});
	return response.status === 200 && response.ok;
    }
    return true;
}

export const isFirestoreReady = async () => {
    if (isEmulated()) {
	const dbHost = `${process.env.REACT_APP_NAME}-${process.env.REACT_APP_NODE_ENV}-db`;
	const firestorePort = parseInt(process.env.REACT_APP_FIRESTORE_PORT);

	const response = await fetch(`http://${dbHost}:${firestorePort}`,{
	  method: 'GET',
	  headers: {
	      'Accept': 'application/json'
	  }
	});
	return response.status === 200 && response.ok;
    }
    return true;
}

export const getApiKey = () => {
    return process.env.REACT_APP_FIREBASE_API_KEY;
}

export const signup = async (user) => {
    const signupUrl = `${getAuthUrl()}/accounts:signUp?key=${getApiKey()}`;

    const response = await fetch(`${signupUrl}`,{
	  method: 'POST',
	  headers: {
	      'Accept': 'application/json',
	      'Content-Type': 'application/json',
	  },
	  body: JSON.stringify({
	      email: user.email,
	      password: user.password
	  })
    });
    return response.status === 200 && response.ok;
}

const config = async (app,options) => {
    const appName = process.env.REACT_APP_NAME;
    const nodeEnv = getNodeEnv(options ? options.nodeEnv : undefined);
    if (isEmulated()) {
	const dbHost = `${appName}-${nodeEnv}-db`
	const firestorePort = parseInt(process.env.REACT_APP_FIRESTORE_PORT);
	const authPort = parseInt(process.env.REACT_APP_AUTH_PORT);

	connectAuthEmulator(getAuth(app), `http://${dbHost}:${authPort}`);
	connectFirestoreEmulator(getFirestore(app), dbHost, firestorePort);
    }
    if (options && options.user) {
	const user = options.user;
	await signInWithEmailAndPassword ( getAuth(app), user.email, user.password );
    }
    if (options && options.heartbeat) {
	const id = `${process.env.REACT_APP_NAME}_${process.pid}`;
	const timestamp = serverTimestamp();
	const heartbeats = collection(getFirestore(app),'heartbeats');
	const heartbeat = doc(heartbeats,id);
	await setDoc(heartbeat,{ timestamp });
    }
}

export const isReady = async (wait) => {
    for (;;) {
	const firestoreReady = isFirestoreReady();
	const authReady = isAuthReady();
	const ready = firestoreReady && authReady;
	if (!ready && wait) {
	    let unready = [];
	    if (!firestoreReady) unready.push("firestore");
	    if (!authReady) unready.push("auth");
	    console.log(`waiting for services to start: ${unready.join(", ")}`);
	    await sleep(1);
	}
	return ready;
    }
}

export const db = async (options) => {
    if (app === null) {
	const wait = true;
	await isReady(wait);
	
	const firebaseEnv = new FirebaseEnv(options);
	const firebaseConfig = await firebaseEnv.getConfig();
	app = initializeApp(firebaseConfig);
	
        await config(app, options);
    } else if (options !== undefined) {
        await config(app, options);
    }
    return getFirestore(app);
}
export default db;
