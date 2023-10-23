SHELL=/bin/bash
FLYCTL=$(shell which flyctl || echo '$HOME/.fly/bin/flyctl')

# make .development files by processing .template files with .env.development substitutions
%.development : %.template .env.development
	export PLATFORM=$$(./platform); \
	while read -r line; do export "$${line:Q}"; done < .env.development \
		&& envsubst < "$<" > "$@"

# make .test files by processing .template files with .env.test substitutions
%.test : %.template .env.test
	export PLATFORM=$$(./platform); \
	while read -r line; do export "$${line:Q}"; done < .env.test \
		&& envsubst < "$<" > "$@"

.PHONY: development-up
development-up : docker-compose.yml.development Dockerfile.development Dockerfile.db.development firebase.json.development
	docker-compose --file docker-compose.yml.development up \
	  --build --abort-on-container-exit --remove-orphans \
	  2> >(awk '{print "dev err: " $$0}' 1>&2) > >(awk '{print "dev out: " $$0}')

.PHONY: development-down
development-down : docker-compose.yml.development
	docker-compose --file docker-compose.yml.development down || true

.PHONY: development-down-volumes
development-down-volumes : docker-compose.yml.development
	docker-compose --file docker-compose.yml.development down --volumes || true

.PHONY: test-up
test-up : docker-compose.yml.test Dockerfile.test Dockerfile.db.test firebase.json.test
	docker-compose --file docker-compose.yml.test up \
	  --build --abort-on-container-exit --remove-orphans \
	  2> >(awk '{print "test err: " $$0}' 1>&2) > >(awk '{print "test out: " $$0}')

.PHONY: test-down
test-down : docker-compose.yml.test
	docker-compose --file docker-compose.yml.test down || true

.PHONY: test-down-volumes
test-down-volumes : docker-compose.yml.test
	docker-compose --file docker-compose.yml.test down --volumes || true

.PHONY: down
down : development-down test-down

.PHONY: clean
clean : development-down-volumes test-down-volumes
	find . \( -name '*~' -o  -name '*#' \) -print0 | xargs -0 /bin/rm -rf

.PHONY: test
test : test-up

.PHONY: development
development : development-up

.PHONY: up
up:
	@( \
	  trap '$(MAKE) down' HUP INT EXIT; \
          $(MAKE) down || $(MAKE) clean ; \
	  nice $(MAKE) development-up & \
	  nice $(MAKE) test-up & \
	  wait; \
	)

.PHONY: all
all : up

.PHONY: secrets-fly
secrets-fly:
	( cd api && $(FLYCTL) secrets set $$(cat .env.production ) )

production-launch-fly : secrets-fly
	( cd api && $(FLYCTL) launch )

production-deploy-fly : secrets-fly
	( cd api && $(FLYCTL) deploy )

