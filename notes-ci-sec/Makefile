SHELL=/bin/bash
docker-compose.development.yml : docker-compose.template.yml config/development.env
	@while read -r line; do export "$${line:Q}"; done < config/development.env \
          && envsubst < "docker-compose.template.yml" > "docker-compose.development.yml"

.PHONY: development-up
development-up : docker-compose.development.yml
	docker-compose --file docker-compose.development.yml up \
	  --build --abort-on-container-exit --remove-orphans \
	  2> >(awk '{print "dev err: " $$0}' 1>&2) > >(awk '{print "dev out: " $$0}')

.PHONY: development-down
development-down : docker-compose.development.yml
	docker-compose --file docker-compose.development.yml down

.PHONY: development-down-volumes
development-down-volumes : docker-compose.development.yml
	docker-compose --file docker-compose.development.yml down --volumes

docker-compose.test.yml : docker-compose.template.yml config/test.env
	@while read -r line; do export "$${line:Q}"; done < config/test.env \
          && envsubst < "docker-compose.template.yml" > "docker-compose.test.yml"

.PHONY: test-up
test-up : docker-compose.test.yml
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

.PHONY: test
test : test-up

.PHONY: development
development : development-up

.PHONY: all
all :
	@( \
	  trap '$(MAKE) development-down test-down' HUP INT; \
	  nice $(MAKE) development-up & \
	  nice $(MAKE) test-up & \
	  wait; \
	)
