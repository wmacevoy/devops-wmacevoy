# Notes

This is a very simple app to illustrate the idea of a REST api with authorizations and permissions.  It does not have
anything like full functionality, just enough to illustrate the mechanics of such a service.

## Up/Down/Reset
To start, use (in this directory after starting docker)

```bash
make up
```

To shut down, use

```bash
make down
```

If you want to reset the postgress database, you can re-initilize this by erasing the volume mount as well,

```
make clean
```

This way the next time the service starts it will re-create the tables.  Look at `api/db-init.js` for the initialization code.

When running, you should be able to see the api (see `api/routes.js` for the routes) as http://localhost:3000/api/v1/login etc.  There are some very basic web pages served up from the 'api/static' folder so http://localhost:3000/login.html exercises the login api, etc.

The development and test environments supports hot-reload so changes trigger a server / test re-run.

The basic infrastructure is as follows:

- The postgress database maintains these tables
-- users (id, jwt_secret, hashed_password)
-- roles (id)
-- user_roles (user_id,role_id)
-- notes(user_id,content)

the `api/private` directory has configuration data & keys.  It is only loaded to the repo in an encrypted state using git-crypt.
