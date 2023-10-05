const request = require('supertest');
const { db } = require('./db');
const { Data } = require('./Data');

const signup = async (user) => {
    const emulating =
	  (process.env.REACT_APP_NODE_ENV === 'development')
	  || (process.env.REACT_APP_NODE_ENV === 'test');
    
    const dbHost = `${process.env.REACT_APP_NAME}-${process.env.REACT_APP_NODE_ENV}-db`;
    const authPort = parseInt(process.env.REACT_APP_AUTH_PORT);
    const apiKey = process.env.REACT_APP_FIREBASE_API_KEY;
    const authUrl = emulating
	  ? `http://${dbHost}:${authPort}/identitytoolkit.googleapis.com/v1`
	  : `https://identitytoolkit.googleapis.com/v1`;

    const signupUrl = `${authUrl}/accounts:signUp`;

    console.log(`url ${signupUrl}`);
    await fetch(`${signupUrl}?key=${apiKey}`,{
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
    return user;
}

describe('db', () => {
    it('loads in  600 seconds or less', async () => {
	const data = new Data();
	const admins = await data.getAdmins();
	const admin = admins[0];
	await signup(admin);
	const firebase = await db({admin});
	expect(firebase !== null).toBe(true);
    },5000);
});
