# Notes

## Remote - Fly

https://fly.io/docs/postgres/getting-started/create-pg-cluster/
https://fly.io/docs/postgres/getting-started/what-you-should-know/

### Install flyctl

https://fly.io/docs/hands-on/install-flyctl/
```bash
brew install flyctl
```




## Local

This is a very simple app to illustrate the idea of a REST api with authorizations and permissions.
It does not have anything like full functionality, just enough to illustrate the mechanics of such
a service.

## Up/Down/Clean
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

If you only want the development containers, you can prefix with "development-"

```bash
make development-up
make development-down
make development-clean
```

Similarly for tests
```bash
make test-up
make test-down
make test-clean
```

There are two pairs of containers, one for development and one for testing.  The continuous testing server frequently resets the corresponding database for unit tests, and so not suitable for trying things where the state of the database will matter.  Both are hot-reloaded when files change.

When running, you should be able to see the api (see `api/routes.js` for the routes) as http://localhost:3000/api/v1/login etc.  There are some very basic web pages served up from the 'api/static' folder so http://localhost:3000/login.html exercises the login api, etc.

The basic infrastructure is as follows:

- The postgress database maintains these tables
-- users (id, jwt_secret, hashed_password)
-- roles (id)
-- user_roles (user_id,role_id)
-- notes(user_id,content)

the `api/private` directory has configuration data & keys.  It is only loaded to the repo in an encrypted state using git-crypt.
