REGISTRY_HOST=docker.io
USERNAME=s0j0hn
NAME=rusty-images

RELEASE_SUPPORT := $(shell dirname $(abspath $(lastword $(MAKEFILE_LIST))))/.make-release-support
IMAGE=$(REGISTRY_HOST)/$(USERNAME)/$(NAME)


VERSION=$(shell . $(RELEASE_SUPPORT) ; getVersion)
BASE_RELEASE=$(shell . $(RELEASE_SUPPORT) ; getRelease)

TAG=$(shell . $(RELEASE_SUPPORT); getTag)
TAG_WITH_LATEST=always

SHELL=/bin/bash

DOCKER_BUILD_CONTEXT=.
DOCKER_FILE_PATH=Dockerfile

.PHONY: pre-build docker-build post-build build release patch-release minor-release major-release tag check-status check-release showver \
	push pre-push do-push post-push showimage

build: pre-build docker-build post-build	## builds a new version of your container image

pre-build:


post-build:


pre-push:


post-push:


docker-build:
	docker build $(DOCKER_BUILD_ARGS) -t $(IMAGE):latest $(DOCKER_BUILD_CONTEXT) -f $(DOCKER_FILE_PATH)

.release:
	@echo "release=0.0.0" > .release
	@echo "tag=$(NAME)-0.0.0" >> .release
	@echo "tag_on_changes_in=." >> .release
	@echo INFO: .release created
	@cat .release


release: check-status check-release build push


push: pre-push do-push post-push

docker-push: docker-build
	docker push $(IMAGE):latest

snapshot: build push				## builds a new version of your container image, and pushes it to the registry

showver: .release				## shows the current release tag based on the workspace
	@. $(RELEASE_SUPPORT); getVersion

showimage: .release				## shows the container image name based on the workspace
	@echo $(IMAGE):$(VERSION)

tag-patch-release: VERSION := $(shell . $(RELEASE_SUPPORT); nextPatchLevel)
tag-patch-release: .release tag 		## increments the patch release level and create the tag without build

tag-minor-release: VERSION := $(shell . $(RELEASE_SUPPORT); nextMinorLevel)
tag-minor-release: .release tag 		## increments the minor release level and create the tag without build

tag-major-release: VERSION := $(shell . $(RELEASE_SUPPORT); nextMajorLevel)
tag-major-release: .release tag 		## increments the major release level and create the tag without build

patch-release: tag-patch-release release	## increments the patch release level, build and push to registry
	@echo $(VERSION)

minor-release: tag-minor-release release	## increments the minor release level, build and push to registry
	@echo $(VERSION)

major-release: tag-major-release release	## increments the major release level, build and push to registry
	@echo $(VERSION)


tag: TAG=$(shell . $(RELEASE_SUPPORT); getTag $(VERSION))
tag: check-status
	@. $(RELEASE_SUPPORT) ; ! tagExists $(TAG) || (echo "ERROR: tag $(TAG) for version $(VERSION) already tagged in git" >&2 && exit 1) ;
	@. $(RELEASE_SUPPORT) ; setRelease $(VERSION)
	git add .
	git commit -m "bumped to version $(VERSION)" ;
	git tag $(TAG) ;
	@ if [ -n "$(shell git remote -v)" ] ; then git push --tags ; else echo 'no remote to push tags to' ; fi

check-status:			## checks whether there are outstanding changes
	@. $(RELEASE_SUPPORT) ; ! hasChanges || (echo "ERROR: there are still outstanding changes" >&2 && showChanges >&2 && exit 1) ;

check-release: .release		## checks whether the workspace matches the tagged release in git
	@. $(RELEASE_SUPPORT) ; tagExists $(TAG) || (echo "ERROR: version not yet tagged in git. make [minor,major,patch]-release." >&2 && exit 1) ;
	@. $(RELEASE_SUPPORT) ; ! differsFromRelease $(TAG) || (echo "ERROR: current directory differs from tagged $(TAG). make [minor,major,patch]-release." && showDiffFromRelease >&2 ; exit 1)


help:           ## show this help.
	@fgrep -h "##" $(MAKEFILE_LIST) | grep -v fgrep | sed -e 's/\([^:]*\):[^#]*##\(.*\)/printf '"'%-20s - %s\\\\n' '\1' '\2'"'/' |bash