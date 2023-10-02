import { firebases, initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import 'firebase/auth';
import { collection, doc, setDoc, getFirestore, serverTimestamp } from "firebase/firestore";
import { FirebaseEnv } from './FirebaseEnv';

let app = null;
let firestore = null;

const config = async (firestore,options) => {
    if (options !== undefined && options.user !== undefined) {
	const user = options.user;
	await signInWithEmailAndPassword ( getAuth(), user.email, user.password );
    }
    const id = `${process.env.APP}_${process.pid}`;
    const timestamp = serverTimestamp();
    const heartbeats = collection(firestore,'heartbeats');
    const heartbeat = doc(heartbeats,id);
    await setDoc(heartbeat,{ timestamp });
}

export const db = async (options) => {
    if (firestore === null) {
	const firebaseEnv = new FirebaseEnv(options);
	const firebaseConfig = await firebaseEnv.getConfig();
	app = initializeApp(firebaseConfig);
	firestore = getFirestore(app);
        await config(firestore, options);
    } else if (options !== undefined) {
        await config(firestore, options);
    }
    return firestore;
}
export default db;
