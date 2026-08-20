# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repository is

A DevOps course repository: a set of **independent, self-contained example projects**, not one application.
Each top-level directory stands alone (its own Makefile / package.json / Dockerfile). There is no root build,
no root test runner, and no shared dependency graph. Change one directory without expecting it to affect another.

Everything runs in Docker. `docker run --rm hello-world` working is the assumed baseline — several scripts
check for it and abort otherwise. **bash is required** (`ops` exports a shell function; zsh/ksh work only in
the top-level shell, not subshells).

## The `ops` dispatcher

```bash
. ./ops              # defines the ops() function (source it, don't execute it)
ops <cmd> args...    # runs bin/<cmd> args...
ops dir              # prints the repo root
```

`bin/` commands:

| command | purpose |
|---|---|
| `cloudbox [--build] [--platform linux/arm64\|linux/amd64] [--user node] [cmd...]` | interactive container with gcloud, firebase, aws, az CLIs; repo mounted at `/repo`, cwd preserved |
| `cloudbox --test` | runs `bin/test-cloudbox-tests` inside the container (checks arch, sudo, gcloud/firebase/aws present, ssh git clone) |
| `flutterbox` | same pattern, Flutter image |
| `test-ops` | verifies the `ops` function works under bash/zsh/ksh in alpine |
| `prune-docker` | `docker system prune -a` + volume prune |
| `doctor` | checks the laptop setup: bash, docker, git identity, github ssh, gpg (+key expiry), git-crypt lock state, `gh`, `claude`, disk space. This is the last step of `macos.md`/`windows.md` |

`cloudbox`/`flutterbox` auto-rebuild when `bin/Dockerfile.<tag>` is newer than the built image. They copy the
host's `~/.gnupg`, `~/.ssh`, `~/.config`, `~/.gitconfig` into `private/home/$(git config user.email)/` (gitignored)
and bind-mount that as the container `$HOME`, so credentials persist across runs. Deleting that directory
resets the container identity.

Note: the root `sbox` and `nodebox` scripts reference `Dockerfile.sbox` / `Dockerfile.nodebox`, which do not
exist — they are dead, superseded by `bin/cloudbox`.

## git-crypt

Secrets are committed encrypted. `.gitattributes` marks `**/private/**` repo-wide; `my_notes_app/.gitattributes`
additionally marks `*.env`, `*.env.*`, and `firebase.json`.

**The working tree is currently locked** — `notes/api/private/*.env`, `my_notes_app/.env.*` etc. are ciphertext
(they start with the bytes `GITCRYPT`). Any `make` target in `notes/`, `notes-ci-sec/`, `notes-unsec/`, or
`my_notes_app/` that reads a `private/*.env` will produce garbage until:

```bash
git-crypt unlock         # needs a GPG key authorized in .git-crypt/keys/default/0/
```

`notes-ci/` is the exception: its config lives in cleartext `config/*.env`, so it runs without unlocking.

One file escaped the filter: `notes-unsec/api/private/production.env` is committed in **plaintext** (added in
`005f450`, before the attribute covered it) and contains a Fly Postgres `DATABASE_URL` with a password. The host
is a `.flycast` internal name for a 2023 app, so exposure is almost certainly moot — but don't treat "matches
`**/private/**`" as proof a file is encrypted; check for the `GITCRYPT` magic bytes, which is what `ops doctor` does.

`randomize` (awk) rewrites every hex run of ≥17 chars with fresh `openssl rand -hex` output;
`randomize-private-keys` applies it in place to `api/private/*.{env,json}`. Run these after copying a project
so committed sample secrets are not reused.

## The notes app lineage

`notes-basic` → `notes-ci` → `notes-ci-sec` → `notes-unsec` → `notes` (plus `notes-py`, an unfinished Python port)
are successive versions of the *same* Express + PostgreSQL notes API, each adding one course topic
(compose → CI/test container → git-crypt secrets → JWT-per-user + Fly deploy). They are copies, not shared code:
a fix in `notes/api/routes.js` does **not** reach `notes-ci-sec/api/routes.js`. When asked to change "the notes
app", confirm which one — or apply the change to each copy deliberately.

Shared shape (`api/`):
- `index.js` → `app.js` (express, static files from `api/static/`) → `routes.js` (auth middleware `isAdmin`/`isUser`) → `db.js` (pg pool, creates `roles`/`users`/`user_roles`/`notes`, seeds from `data.js`) → `user.js`.
- Later versions store a per-user `jwt_secret` in the `users` row; earlier ones use one global `JWT_SECRET`.
- `data.js` reads seed users/notes from `api/private/data-<env>.json` (git-crypt'd).

### The template + envsubst build pattern

This is the central mechanic of every Makefile here. `*.template` files plus an env file are expanded by
`envsubst` into generated, **untracked-by-intent** artifacts. Edit the `.template`, never the output:

| generated (do not edit) | from | vars from |
|---|---|---|
| `docker-compose.<env>.yml` | `docker-compose.template.yml` | `api/private/<env>.env` (or `config/<env>.env` in notes-ci) |
| `api/Dockerfile.<env>` | `api/Dockerfile.template` | same |
| `my_notes_app/*.development`, `*.test` | `*.template` | `.env.development` / `.env.test` + `PLATFORM` from `./platform` |

`<env>` is `development` or `test`, and it is baked into container names, network names, volume names and
ports — so both stacks run side by side.

### Running a notes project

```bash
cd notes                 # or notes-ci, notes-ci-sec, notes-unsec, my_notes_app
make up                  # both stacks concurrently, traps INT to bring them down
make development-up      # dev only: api on :3000, postgres on :5432
make test-up             # test only: api on :4000, postgres on :6432
make down / make clean   # clean also drops the volumes (fresh database)
```

Both stacks hot-reload via nodemon over the `./api:/app` bind mount. The **test** stack runs
`jest --runInBand --watchAll` continuously and resets its database between runs, so it is unusable for
manual poking — use the development stack for that. Web pages exercising the API are at
`http://localhost:3000/login.html` etc.; routes are under `/api/v1/`.

To run one test file or one test instead of the whole watch loop, exec into the running test container:

```bash
docker exec -it notes-test-api npx jest api.test.js --runInBand
docker exec -it notes-test-api npx jest -t 'works for admins' --runInBand
```

## Deployment targets

- `notes/`, `notes-unsec/` → Fly.io. `make secrets-fly` pushes `api/private/production.env` via `flyctl secrets set`; then `make production-deploy-fly`. App config in `notes/api/fly.toml`.
- `my_notes_app/` → Firebase Hosting (CRA + Firestore/Auth emulators locally). `./firebase-deploy` selects the project, logs in if needed, builds, deploys. `src/FirebaseEnv.js` pulls all config from `REACT_APP_FIREBASE_*` env vars — CRA inlines these at build time, so a rebuild is required after changing `.env.*`. `npm` scripts wrap `./balked-npm-install`, a symlink-based lock that prevents the dev and test containers from running `npm install` simultaneously on the shared mount.
- `aws/` → ECR + ECS Fargate. `aws/setup [all|app|configure|dockerfile|scripts]` is idempotent scaffolding: it *generates* `aws/hello-world/{push,deploy,register-task*,Dockerfile.amazonlinux-node,setup.py}` rather than those being hand-maintained. Edit the heredocs in `setup`, not the generated files. `aws/run --test` builds and self-tests the amazonlinux-node image.
- `azure/` → Azure Functions (.NET 6 isolated, `SentimentAnalysisFunction.cs`, xunit + Moq). `azure/setup` creates the resource group / storage / function app via `ops cloudbox az ...`. Build with `dotnet build` / test with `dotnet test` inside `ops cloudbox`.

## Other directories

- `container1`–`container4`: Docker teaching progression — baked image, devcontainer manifest copy, volume-mounted live reload, then `container4`'s CI harness. In `container4`, `. ./ci` defines `ci <cmd>` → `bin/<cmd>`; every script there is both sourceable (defines a function) and executable, and each implements a `--self-test` flag. `ci ci_test` discovers every script containing `self_test` and runs all of them.
- `devcontainers/`: vendored upstream Microsoft devcontainer image docs (`manifest.json` + `history/*.md`). Reference material only — nothing here builds it.
- `windows.md`, `macos.md`, `git-crypt.md`, `notes/fly.md`: student onboarding docs. **These are the repo's primary use** — it is an old course repo, and the two OS setup docs are what still gets read every semester, as dev-laptop config baselines. Treat them as the deliverable, not as commentary on the code: keep them working, and keep changes to them conservative while a semester is in progress.
  - `main` carries the in-semester version. A `spring-27` branch holds the next-semester rewrite (steps 4–9 factored into a shared `common.md`, 1Password ssh agent, `gh auth login`, commit signing, `wsl --install`, VS Code, Codespaces fallback). Fixes that current students need go on `main`; anything that reshapes the walkthrough goes to `spring-27`.
