REGISTRY_HOST=docker.io
USERNAME=s0j0hn
IMAGE=rusty-images

SHELL=/bin/bash

DOCKER_BUILD_CONTEXT=.
DOCKER_FILE_PATH=Dockerfile

.PHONY: docker-build docker-push


docker-build:
	docker build $(DOCKER_BUILD_ARGS) -t $(USERNAME)/$(IMAGE):latest $(DOCKER_BUILD_CONTEXT) -f $(DOCKER_FILE_PATH) --pull --no-cache

docker-push: docker-build
	docker push $(USERNAME)/$(IMAGE):latest


help:           ## show this help.
	@fgrep -h "##" $(MAKEFILE_LIST) | grep -v fgrep | sed -e 's/\([^:]*\):[^#]*##\(.*\)/printf '"'%-20s - %s\\\\n' '\1' '\2'"'/' |bash