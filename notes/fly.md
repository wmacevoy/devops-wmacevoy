# Launch on Fly

You need credentials (login to `fly.io`).

You need flyctl `https://fly.io/docs/hands-on/install-flyctl/`

You need to authenticate

```bash
flyctl auth login
```

To create a simple scaling api with postgress back-end go to the api folder of notes,

```bash
rm fly.toml
flyctl launch
```

Pick a development mode postgress.  Copy the connection url to the api/private/prodcution.env folder.

Export the production secrets to fly.io:
```
cd api && flyctl secrets set $$(cat private/production.env )
```

Deploy the container
```bash
flyctl deploy
```


