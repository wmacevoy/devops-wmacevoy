SHELL=/bin/bash
FLYCTL=$(shell which flyctl || echo '$HOME/.fly/bin/flyctl')

Dockerfile.development : Dockerfile.template src/private/development.env
	while read -r line; do export "$${line:Q}"; done < src/private/development.env \
		&& envsubst < "$<" > "$@"

docker-compose.development.yml : docker-compose.template.yml src/private/development.env
	while read -r line; do export "$${line:Q}"; done < src/private/development.env \
		&& envsubst < "$<" > "$@"

.PHONY: development-up
development-up : docker-compose.development.yml Dockerfile.development
	docker-compose --file docker-compose.development.yml up \
	  --build --abort-on-container-exit --remove-orphans \
	  2> >(awk '{print "dev err: " $$0}' 1>&2) > >(awk '{print "dev out: " $$0}')

.PHONY: development-down
development-down : docker-compose.development.yml
	docker-compose --file docker-compose.development.yml down

.PHONY: development-down-volumes
development-down-volumes : docker-compose.development.yml
	docker-compose --file docker-compose.development.yml down --volumes

Dockerfile.test : Dockerfile.template src/private/test.env
	while read -r line; do export "$${line:Q}"; done < src/private/test.env \
		&& envsubst < "$<" > "$@"

docker-compose.test.yml : docker-compose.template.yml src/private/test.env
	while read -r line; do export "$${line:Q}"; done < src/private/test.env \
		&& envsubst < "$<" > "$@"

.PHONY: test-up
test-up : docker-compose.test.yml Dockerfile.test
	docker-compose --file docker-compose.test.yml up \
	  --build --abort-on-container-exit --remove-orphans \
	  2> >(awk '{print "test err: " $$0}' 1>&2) > >(awk '{print "test out: " $$0}')

.PHONY: test-down
test-down : docker-compose.test.yml
	docker-compose --file docker-compose.test.yml down

.PHONY: test-down-volumes
test-down-volumes : docker-compose.test.yml
	docker-compose --file docker-compose.test.yml down --volumes

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
	  trap '$(MAKE) development-down test-down' HUP INT; \
	  nice $(MAKE) development-up & \
	  nice $(MAKE) test-up & \
	  wait; \
	)

.PHONY: all
all : up

.PHONY: secrets-fly
secrets-fly:
	( cd api && $(FLYCTL) secrets set $$(cat private/production.env ) )

production-launch-fly : secrets-fly
	( cd api && $(FLYCTL) launch )

production-deploy-fly : secrets-fly
	( cd api && $(FLYCTL) deploy )

