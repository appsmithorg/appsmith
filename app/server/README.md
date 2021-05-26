# Appsmith Server

This is the server-side repository for the Appsmith framework.
For details on setting up your development machine, please refer to the [Setup Guide](../../contributions/ServerSetup.md). Alternatively, you can run the server using docker(see the instructions below). 

## Run locally with Docker 

You can run the server codebase in a docker container. This is the easiest way to get the server up and running if all you care about is contributing to the client codebase.

### What's in the box

* Appsmith server
* MongoDB
* Redis

### Pre-requisites

* [Docker](https://docs.docker.com/get-docker/)

### Steps for setup

1. Clone the Appsmith repository and `cd` into it
```sh
git clone https://github.com/appsmithorg/appsmith.git
cd appsmith
```
2. Change your directory to `app/server`
```sh
cd app/server
```
3. Create a copy of the `envs/docker.env.example`
```sh
cp envs/docker.env.example envs/docker.env
```
4. Start up the containers
```sh
docker-compose up -d
``` 
5. Have fun!
