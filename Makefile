# Latest commit hash
GIT_SHA=$(shell git rev-parse HEAD)

build:
	docker build . --build-arg GIT_SHA=$(GIT_SHA) -t fatcontainer

build-arm:
	docker buildx build . --build-arg GIT_SHA=$(GIT_SHA) -t fatcontainer
