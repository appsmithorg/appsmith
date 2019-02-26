# Go parameters

BINARY_NAME=internal-tools-server
BINARY_UNIX=$(BINARY_NAME)_unix

GOCMD=go
GOBUILD=$(GOCMD) build -o dist/${BINARY_NAME}
GOCLEAN=$(GOCMD) clean
GOTEST=$(GOCMD) test
GOGET=$(GOCMD) get

all: test build
build: 
		$(GOBUILD) -v
test: 
		$(GOTEST) -v ./...
clean: 
		$(GOCLEAN)
		rm -f dist
run: build
		./dist/$(BINARY_NAME)

# Cross compilation
build-linux:
		CGO_ENABLED=0 GOOS=linux GOARCH=amd64 $(GOBUILD) -o dist/$(BINARY_UNIX) -v
docker-build:
		docker run --rm -it -v "$(GOPATH)":/go -w /go/src/bitbucket.org/rsohlich/makepost golang:latest go build -o "dist/$(BINARY_UNIX)" -v