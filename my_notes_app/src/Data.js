const fs = require('fs');
const util = require('util');
const readFile = util.promisify(fs.readFile);

class Data {
    constructor(options) {
	this._dataFile = options?.dataFile ?? `./src/private/data-${process.env.NODE_ENV}.json`;
	this._data = null;
    }
    
    get dataFile() {
	return this._dataFile;
    }

    async getData() {
	if (this._data === null) {
	    const json = await readFile(this.dataFile, 'utf8');
	    this._data=JSON.parse(json);
	}
	return this._data;
    }

    async getRoles() {
	const data = await this.getData();
	const roles = data.roles;
	return data.roles;
    }

    async getAllUsers() {
	const data = await this.getData();
	const users = data.users;
	return users;
    }

    async getAdmins() {
	const allUsers = await this.getAllUsers();
	return allUsers.filter(user => user.roles.includes('admin'));
    }

    async getUsers() {
	const allUsers = await this.getAllUsers();	
	return allUsers.filter(user => user.roles.includes('user') && !user.roles.includes('admin'));
    }

    async getNobodies() {
	const allUsers = await this.getAllUsers();
        return allUsers.filter(user => !user.roles.includes('user') && !user.roles.includes('admin'));
    }
}

module.exports = { Data };
