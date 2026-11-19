# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repository is

A DevOps course repository: a set of **independent, self-contained example projects**, not one application.
Each top-level directory stands alone (its own Makefile / package.json / Dockerfile). There is no root build,
no root test runner, and no shared dependency graph. Change one directory without expecting it to affect another.

The code dates from the Fall 2023 offering and is mostly frozen. What is still live is the laptop setup
walkthrough (`macos.md`, `windows.md`) and `bin/doctor` — see [Setup docs and branches](#setup-docs-and-branches)
before touching either.

Everything runs in Docker. `docker run --rm hello-world` working is the assumed baseline — several scripts
check for it and abort otherwise. **bash is required** (`ops` exports a shell function; zsh/ksh work only in
the top-level shell, not subshells). The notes Makefiles also need `envsubst` (gettext) and the hyphenated
`docker-compose` command on the host.

## The `ops` dispatcher

```bash
. ./ops              # defines the ops() function (source it, don't execute it)
ops <cmd> args...    # runs bin/<cmd> args...
ops dir              # prints the repo root
```

From Claude Code, skip the function and call `bin/<cmd>` directly: each tool call is a fresh shell, so a
sourced `ops` does not survive to the next one. `cloudbox`, `flutterbox` and `aws/run` use `docker run -it`,
so they need a real terminal — ask the user to run those rather than running them from a tool call.

`bin/` commands:

| command | purpose |
|---|---|
| `cloudbox [--build] [--platform linux/arm64\|linux/amd64] [--tag t] [--dockerfile path] [--user node] [--home dir] [cmd...]` | interactive container with gcloud, firebase, aws, az CLIs; repo mounted at `/repo`, cwd preserved |
| `cloudbox --test` | runs `bin/test-cloudbox-tests` inside the container (checks arch, user, sudo, gcloud/firebase/aws present, ssh git clone) |
| `flutterbox` | same pattern, Flutter image; no `--test` |
| `test-ops` | verifies the `ops` function works under bash/zsh/ksh in alpine |
| `prune-docker` | `docker system prune -a` + volume prune — removes every unused image and volume on the machine, not just this repo's; never run it unasked |
| `doctor` | checks the laptop setup: bash, docker, git identity, github ssh, gpg secret key, git-crypt installed, `gh`, `claude`, git-crypt lock state. This is the last step of `macos.md`/`windows.md`. (The `spring-27` version adds gpg key expiry, commit signing, ssh agent, VS Code and disk space.) |

`cloudbox`/`flutterbox` auto-rebuild when `bin/Dockerfile.<tag>` is newer than the built image. They copy the
host's `~/.gnupg`, `~/.ssh`, `~/.config`, `~/.gitconfig` into `private/home/$(git config --global user.email)/`
(gitignored) and bind-mount that as the container `$HOME`, so credentials persist across runs. The copy happens
only once per item — later changes on the host are not picked up. Deleting that directory resets the container
identity.

Note: the root `sbox` and `nodebox` scripts reference `Dockerfile.sbox` / `Dockerfile.nodebox`, which do not
exist — they are dead, superseded by `bin/cloudbox`.

## git-crypt

Secrets are committed encrypted. `.gitattributes` marks `**/private/**` repo-wide; `my_notes_app/.gitattributes`
and `aws/hello-world/.gitattributes` additionally mark `*.env` and `*.env.*` (and `firebase.json` in `my_notes_app`).

**Assume the working tree is locked until you have checked.** When locked, `notes/api/private/*.env`,
`my_notes_app/.env.*` etc. are ciphertext (they start with the bytes `GITCRYPT`), and any `make` target in
`notes/`, `notes-ci-sec/`, `notes-unsec/`, or `my_notes_app/` that reads them will produce garbage. Check with:

```bash
head -c 9 notes/api/private/development.env    # "\0GITCRYPT" means locked
git-crypt unlock         # needs a GPG key authorized in .git-crypt/keys/default/0/
```

Never edit, "fix", or commit a file while it is ciphertext, and never paste decrypted values into docs,
commit messages, or tool output.

`notes-ci/` is the exception: its config lives in cleartext `config/*.env`, so it runs without unlocking.

One file escaped the filter: `notes-unsec/api/private/production.env` is committed in **plaintext** (added in
`005f450`, before the attribute covered it) and contains a Fly Postgres `DATABASE_URL` with a password. The host
is a `.flycast` internal name for a 2023 app, so exposure is almost certainly moot — but don't treat "matches
`**/private/**`" as proof a file is encrypted; check for the `GITCRYPT` magic bytes, which is what `ops doctor` does.

`randomize` (awk) rewrites every hex run of ≥17 chars with fresh `openssl rand -hex` output;
`randomize-private-keys` applies it in place to `api/private/*.{env,json}`. There is a copy of both in `notes/`,
`notes-unsec/` and `my_notes_app/`; run them from inside that project directory (unlocked) after copying a
project, so committed sample secrets are not reused.

## The notes app lineage

`notes-basic` → `notes-ci` → `notes-ci-sec` → `notes-unsec` → `notes` (plus `notes-py`, an unfinished Python port)
are successive versions of the *same* Express + PostgreSQL notes API, each adding one course topic
(compose → CI/test container → git-crypt secrets → JWT-per-user + Fly deploy). They are copies, not shared code:
a fix in `notes/api/routes.js` does **not** reach `notes-ci-sec/api/routes.js`. When asked to change "the notes
app", confirm which one — or apply the change to each copy deliberately.

Shape of `api/` from `notes-ci-sec` on (`notes-basic` and `notes-ci` have only `index.js`/`app.js`/`routes.js`/`db.js`):
- `index.js` → `app.js` (express, static files from `api/static/`) → `routes.js` (auth middleware `isAdmin`/`isUser`) → `db.js` (pg pool, creates `roles`/`users`/`user_roles`/`notes`, seeds from `data.js`) → `user.js`.
- Later versions store a per-user `jwt_secret` in the `users` row; earlier ones use one global `JWT_SECRET`.
- `data.js` reads seed users/notes from `api/private/data-<env>.json` (git-crypt'd).

### The template + envsubst build pattern

This is the central mechanic of every Makefile here. `*.template` files plus an env file are expanded by
`envsubst` into generated artifacts. They are not gitignored, so they show up in `git status` after a
`make` — edit the `.template`, never the output, and do not `git add` the output:

| generated (do not edit or commit) | from | vars from |
|---|---|---|
| `docker-compose.<env>.yml` | `docker-compose.template.yml` | `api/private/<env>.env` (or `config/<env>.env` in notes-ci) |
| `api/Dockerfile.<env>` (`notes`, `notes-unsec` only) | `api/Dockerfile.template` | same |
| `my_notes_app/*.development`, `*.test` (e.g. `docker-compose.yml.development`) | `*.template` | `.env.development` / `.env.test` + `PLATFORM` from `./platform` |

`<env>` is `development` or `test`, and it is baked into container names, network names, volume names and
ports — so both stacks run side by side. Every notes copy from `notes-ci` on uses the *same* container
names (`notes-<env>-api`, `notes-<env>-db`), so only one notes project can be up at a time.

### Running a notes project

```bash
cd notes                 # or notes-ci, notes-ci-sec, notes-unsec, my_notes_app
make all                 # both stacks concurrently, traps INT to bring them down
make development-up      # dev only: api on :3000, postgres on :5432
make test-up             # test only: api on :4000, postgres on :6432
make development-down test-down
make clean               # down + drop the volumes (fresh database)
```

Target names drift between the copies — check the Makefile before quoting one:

- Bare `make` is not useful: the default target is whichever file rule comes first, so it only generates a file.
- `make up` exists everywhere except `notes-ci` (`make all` works in all five).
- `make down` exists only in `my_notes_app`.

Both stacks hot-reload via nodemon over the `./api:/app` bind mount. The **test** stack runs
`jest --runInBand --watchAll` continuously and resets its database between runs, so it is unusable for
manual poking — use the development stack for that. Web pages exercising the API are at
`http://localhost:3000/login.html` etc.; routes are under `/api/v1/`.

To run one test file or one test instead of the whole watch loop, exec into the running test container
(drop `-it` when running from a tool call):

```bash
docker exec -it notes-test-api npx jest api.test.js --runInBand
docker exec -it notes-test-api npx jest -t 'works for admins' --runInBand
```

## Deployment targets

All of these point at 2023 cloud resources (account ids, project names, cluster names are hard-coded in the
scripts) that may no longer exist. Never run a deploy, `secrets`, `push`, or cloud `setup` script unless the
user asks for that specific run.

- `notes/`, `notes-unsec/` → Fly.io. In `notes/`: `make secrets-fly` pushes `api/private/production.env` via `flyctl secrets set`; then `make production-deploy-fly` (which runs `secrets-fly` first). In `notes-unsec/` the same targets are named `fly-secrets` and `production-deploy`. App config in `notes/api/fly.toml`; walkthrough in `notes/fly.md`.
- `my_notes_app/` → Firebase Hosting (CRA + Firestore/Auth emulators locally). `./firebase-deploy` selects the project, logs in if needed, builds, deploys. `src/FirebaseEnv.js` pulls all config from `REACT_APP_FIREBASE_*` env vars — CRA inlines these at build time, so a rebuild is required after changing `.env.*`. `npm` scripts wrap `./balked-npm-install`, a symlink-based lock that prevents the dev and test containers from running `npm install` simultaneously on the shared mount. The `*-fly` targets in its Makefile are leftovers from the notes copy (`cd api` — there is no `api/` here); ignore them.
- `aws/` → ECR + ECS Fargate. `aws/setup [all|app|configure|dockerfile|scripts]` is idempotent scaffolding that *generates* files into `aws/hello-world/` from heredocs: `push`, `deploy`, `register-task`, `register-task.json`, `Dockerfile.amazonlinux-node`, `setup.py`. Edit the heredocs in `setup`, not the generated files. Only `push`, `Dockerfile.amazonlinux-node` and `setup.py` are committed; the committed `aws-deploy`, `docker-login`, `run` and `tests` are older hand-written files that `setup` does not produce. `aws/run --test` builds and self-tests the amazonlinux-node image.
- `azure/` → Azure Functions (.NET 6 isolated, `SentimentAnalysisFunction.cs`, xunit + Moq). `azure/setup` creates the resource group / storage / function app, but is unfinished: `Location` is a `"..."` placeholder and it mixes `ops cloudbox az ...` with bare `az`. Build with `dotnet build` / test with `dotnet test` inside `ops cloudbox`.

## Other directories

- `container1`–`container4`: Docker teaching progression — baked image, devcontainer manifest copy, volume-mounted live reload, then `container4`'s CI harness. In `container4`, `. ./ci` defines `ci <cmd>` → `bin/<cmd>`; every script there is both sourceable (defines a function) and executable, and each implements a `--self-test` flag. `ci ci_test` discovers every script containing `self_test` and runs all of them.
- `devcontainers/`: vendored upstream Microsoft devcontainer image docs (`manifest.json` + `history/*.md`). Reference material only — nothing here builds it.
- `git-crypt.md` exists in three diverged copies (root, `notes/`, `notes-ci-sec/`). The root one is what `README.md` links; the others are course-era snapshots.

## Setup docs and branches

`windows.md`, `macos.md`, `git-crypt.md`, `notes/fly.md` are student onboarding docs. **The two OS setup docs
are the repo's primary use** — they are what still gets read every semester, as dev-laptop config baselines.
Treat them as the deliverable, not as commentary on the code:

- Keep them working, and keep changes conservative while a semester is in progress. A student may be halfway
  through the list: do not renumber steps, rename files they have already created, or change a command's
  effect. Typos, dead links and commands that no longer work are fair game.
- Steps 4–9 are duplicated verbatim between `macos.md` and `windows.md` on `main` (only the clipboard command
  and a few path words differ). A fix to one almost always belongs in the other.
- The prerequisites list appears three times (`README.md`, `macos.md`, `windows.md`); keep them in step.
- `bin/doctor` is the walkthrough's last step, so it is part of the deliverable. Its messages cite the docs
  ("see the install step in macos.md / windows.md") — when a doc step changes, check the matching message.
  A check for something optional must be `say_warn`, never `say_fail`: students are told to get every line
  to `[ ok ]`.

Branches:

- `main` carries the in-semester version. Fixes that current students need go here.
- `spring-27` holds the next-semester rewrite (steps 4–9 factored into a shared `common.md`, 1Password ssh
  agent, `gh auth login`, commit signing, `wsl --install`, VS Code, Codespaces fallback, a longer
  `bin/doctor`). Anything that reshapes the walkthrough goes there.
- The two branches forked at `b8686d9` and each has its own `CLAUDE.md`; the `spring-27` copy describes that
  branch's layout (`common.md`, the longer `doctor`) and has not received later edits to this one. A fix made on `main` to `macos.md`, `windows.md`, `README.md`, `bin/doctor` or this file
  has to be carried to `spring-27` by hand, where the same text may now live in `common.md`.
- At semester rollover `spring-27` becomes `main`; at that point drop the branch-specific wording here.
