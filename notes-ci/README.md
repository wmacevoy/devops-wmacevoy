# Notes

This is a very simple app to illustrate the idea of a REST api with authorizations and permissions.  It does not have
anything like full functionality, just enough to illustrate the mechanics of such a service.

## Up/Down/Reset
To start, use (in this directory after starting docker)

```bash
docker-compose up
```

To shut down, use

```bash
docker-compose down
```

If you want to reset the postgress database, you can re-initilize this by erasing the volume mount as well,

```
docker-compose down --volumes
```

This way the next time the service starts it will re-create the tables.  Look at `api/db-init.js` for the initialization code.

When running, you should be able to see the api (see `api/routes.js` for the routes) as http://localhost:3000/api/v1/login etc.  There are some very basic web pages served up from the 'api/static' folder so http://localhost:3000/login.html exercises the login api, etc.

The basic infrastructure is as follows:

- The postgress database maintains these tables
-- users (id, nonce, password) with `admin` and `alex`  passwords are hashed
-- roles (id) with `admin` and `user`
-- user_roles (user_id,role_id) with (admin,admin) (admin,user) (alex,user)
-- notes(user_id,content) with (admin,hello)

 user table has user id's (usernames) and hashed passowrds.  The user_roles lists which roles (user, admin) a user has.  The roles are the roles managed by the system.  Use of the API requires a token from the login.  




