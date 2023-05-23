# Running Server Codebase



[![How to Setup Appsmith for Server Side Development](../static/images/server-yt-video-thumbnail.jpg)](https://www.youtube.com/watch?v=W2qbuUYGrQs)

<br />
This document explains how you can setup a development environment for Appsmith server.

There are two ways to run Appsmith server.

* [Using a Docker Image](#setup-with-docker)
* [Running the code locally](#local-setup)

## Setup with Docker

* You can run the server codebase in a docker container.

* This method is recommended if you just want to run the backend server for testing/contributing to frontend code. If you would like to make edits to the source code of server, use [local server method](#local-setup)

- ## What's in the docker container
    * Appsmith server
    * MongoDB database
    * Redis instance

* ## Pre-requisites

    * [Docker](https://docs.docker.com/get-docker/)

* ## Setup

    1. Clone the Appsmith repository and `cd` into it

        ```
        git clone https://github.com/appsmithorg/appsmith.git
        cd appsmith
        ```
    2. Change your directory to `app/server`
        ```console
        cd app/server
        ```
    3. Create a copy of the `envs/docker.env.example`
        ```console
        cp envs/docker.env.example envs/docker.env
        ```
    4. Start up the containers
        ```console
        docker-compose up -d
        ``` 
    5. Have fun!

# Local Setup

As the server codebase is written in Java and is powered by Spring + WebFlux we need Java and Maven installed to build the code. In addition we also need one instance of MongoDB and Redis each to run Appsmith server. Lastly, we will set up IntelliJ IDEA to let you edit the code. Let's get those prerequisites installed on your machine.

## MacOS/Unix Systems

### Pre-requisites
Before you can start to hack on the Appsmith server, your machine should have the following installed:

- Java - OpenJDK 17.
- Maven - Version 3+ (preferably 3.6).
- A MongoDB database - Refer to the [Setting up a local MongoDB instance](#setting-up-a-local-mongodb-instance) section to setup a MongoDB instance using `Docker`.
- A Redis instance - Refer to the [Setting up a local Redis instance](#setting-up-a-local-redis-instance) section to setup a Redis instance using `Docker`.
- An IDE - We use IntelliJ IDEA as our primary IDE for backend development. To set it up, refer to the [Setting up IntelliJ IDEA](#setting-up-intellij-idea) section.

This document doesn't provide instructions to install Java and Maven because these vary between different operating systems and distributions. Please refer to the documentation of your operating system or package manager to install these. Next we will setup MongoDB and Redis using `Docker`.


### Setting up a local MongoDB instance
* The following command will start a MongoDB docker instance locally:

    ```
    docker run -d -p 127.0.0.1:27017:27017 --name appsmith-mongodb --hostname=localhost -e MONGO_INITDB_DATABASE=appsmith -v /path/to/store/data:/data/db mongo --replSet rs0
    ```

* Please change the `/path/to/store/data` to a valid path on your system. This is where MongoDB will persist it's data across runs of this container.

* Note that this command doesn't set any username or password on the database so we make it accessible only from localhost using the `127.0.0.1:` part in the port mapping argument. Please refer to the documentation of this image to learn [how to set a username and password](https://hub.docker.com/_/mongo).

* MongoDB will now be running on `mongodb://localhost:27017/appsmith`.

    ### Enabling replica set for mongo
    *  <b>Mongo running inside docker</b>

        Please follow the below steps for enabling the replica set with mongo running inside the docker
        1. Connect to the mongo db running with a mongo shell. Use the below command
            ```
            mongosh
            ```
        2. Once you are inside the mongo shell run the below command. 
            ```
            rs.initiate({"_id": "rs0", "members" : [{"_id":0 , "host": "localhost:27017" }]})
            ```
    * <b>Standalone Mongo running on the system</b> (non-docker based mongo setup)
        - Upgrade the MongoDB version to 5.0 or higher
        - Close the mongoDB instance running in your local
        - Start the mongoDB in replica set mode and initiate the replica set
            
            ```
            mongod --port 27017 --dbpath <path/to/db> --replSet <replica-set-name> && mongo --eval “rs.initiate()”
            ```
        - One can use following commands to check replica set status: 
            ```
            mongo appsmith
            rs.status()
            ```
        - By this time you should have the mongo running with replica set

### Setting up a local Redis instance

- The following command will start a Redis docker instance locally:

    ```
    docker run -d -p 127.0.0.1:6379:6379 --name appsmith-redis redis
    ```

-  Redis will now be running on `redis://localhost:6379`.

<br />
With the prerequisites met, let's build the code.

### Building and running the code

1. Clone Appsmith repository.
2. Change your directory to `app/server`.
3. Run the following command:

    ```console
    mvn clean compile
    ```  

    This generates a bunch of classes required by IntelliJ for compiling the rest of the source code. Without this step, your IDE may complain about missing classes and will be unable to compile the code.

4. Setup Environment file
    - Create a copy of the `envs/dev.env.example`

        ```console
        cp envs/dev.env.example .env
        ```

        This command creates a `.env` file in the `app/server` folder. All run scripts pick up environment configuration from this file.

5. Ensure that the environment variables `APPSMITH_MONGODB_URI` and `APPSMITH_REDIS_URI` in the file `.env` point to your local running instances of MongoDB and Redis.

6.  **Update the replica set name with correct value in the mongo connection string in the [.env](#setup-environment-file) file.** The replica name is the same as passed [here](#setting-up-a-local-mongodb-instance)
    ```bash
    APPSMITH_MONGODB_URI="mongodb://localhost:27017/appsmith?replicaSet=<replica-set-name>"
    ```

7. Run the following command to create the final JAR for the Appsmith server:

    ```console
    ./build.sh -DskipTests
    ```
    - This command will create a `dist` folder which contains the final packaged jar along with multiple jars for plugins as well.
    - If you want to run the tests, you can remove `-DskipTests` flag from the build cmd.
    ### Debugging
    
    - If the volume containing docker's data root path (macOS: ```~/Library/Containers/com.docker.docker/Data/vms/0/```, Ubuntu: `/var/lib/docker/`) has less than 2 GB of free space, then the script may fail with the following error.
        
        ```console
        Check failed: Docker environment should have more than 2GB free disk space.
        ```
    - There are two ways to resolve this issue:
        - Free up more space
        - Change docker's data root path.
    - #### Linux/Ubuntu Environments
        - On Ubuntu Linux environment docker needs root privilege, hence `./build.sh` script needs to be run with root privilege as well.
        - On Ubuntu Linux environment, the script may not be able to read `.env` file, so it is advised that you run the cmd like:
            ```console
            sudo APPSMITH_MONGODB_URI="mongodb://localhost:27017/appsmith" APPSMITH_REDIS_URL="redis://127.0.0.1:6379" APPSMITH_MAIL_ENABLED=false APPSMITH_ENCRYPTION_PASSWORD=abcd APPSMITH_ENCRYPTION_SALT=abcd ./build.sh
            ```
    


8. Start the Java server by running
    ```console
    ./scripts/start-dev-server.sh
    ```

    - By default, the server will start on port 8080.

        - When the server starts, it automatically runs migrations on MongoDB and will populate it with some initial required data.

        - You can check the status of the server by hitting the endpoint: [http://localhost:8080/api/v1/users/me](http://localhost:8080/api/v1/users/me) on your browser.

## Local setup on Windows using WSL2

## Pre-requisites

Before you can start to hack on the Appsmith server, your machine should have the following installed:

- WSL2 with Linux distro (preferably Ubuntu LTS). Refer to [WSL2 installation on Windows](https://docs.microsoft.com/en-us/windows/wsl/install).
- Docker Desktop for Windows (must be with WSL backed/based engine). Refer to [Install Docker Desktop on Windows](https://docs.docker.com/desktop/windows/install/).
- An IDE - We use IntelliJ IDEA as our primary IDE for backend development.
- Java - OpenJDK 17 in WSL.
- Maven - Version 3+ (preferably 3.6) in WSL.

This document doesn't provide instructions to install Java and Maven because these vary between different operating systems and distributions. Please refer to the documentation of your operating system or package manager to install these.

Next we will setup MongoDB and Redis using `Docker`.

Note that as you have installed Docker Desktop with WSL based engine, you can execute all docker related setup using Windows terminal (CMD). All the docker containers will automatically be available on WSL.

### Setting up a local MongoDB instance

The following command will start a MongoDB docker instance locally:

```console
docker run -d -p 127.0.0.1:27017:27017 --name appsmith-mongodb --hostname=localhost -e MONGO_INITDB_DATABASE=appsmith -v /path/to/store/data:/data/db mongo mongod --replSet rs0
```

#### For Apple Silicon

For M1 chip change the base image to [arm64v8 variant](https://hub.docker.com/r/arm64v8/mongo/)

```console
docker run -d -p 127.0.0.1:27017:27017 --name appsmith-mongodb --hostname=localhost -e MONGO_INITDB_DATABASE=appsmith -v /path/to/store/data:/data/db arm64v8/mongo mongod --replSet rs0
```


Please change the `/path/to/store/data` to a valid path on your C drive (C:/) of your system (e.g. C:\mongodata). This is where MongoDB will persist it's data across runs of this container.

Note that this command doesn't set any username or password on the database so we make it accessible only from localhost using the `127.0.0.1:` part in the port mapping argument. Please refer to the documentation of this image to learn [how to set a username and password](https://hub.docker.com/_/mongo).

MongoDB will now be running on `mongodb://localhost:27017/appsmith`.

### Setting up a local Redis instance

The following command will start a Redis docker instance locally:

```console
docker run -d -p 127.0.0.1:6379:6379 --name appsmith-redis redis
```

#### For Apple Silicon

For M1 chip change the base image to [arm64v8 variant](https://hub.docker.com/r/arm64v8/redis/)

```console
docker run -d -p 127.0.0.1:6379:6379 --name appsmith-redis arm64v8/redis
```

Redis will now be running on `redis://localhost:6379`.


With the initial configuration met, let's build the code.

Note that you have to execute further steps into WSL terminal not in CMD.

### Setting up local file path for the git

To point to a custom Git Root where the git repositories will be persisted, update the env variable called APPSMITH_GIT_ROOT to point to your custom file path.

```console
APPSMITH_GIT_ROOT=./path/to/repo/directory 
```

## Building and running the code

1. Clone Appsmith repository.
2. Change your directory to `app/server`.
3. Run the following command:

```console
mvn clean compile
```  

This generates a bunch of classes required by IntelliJ for compiling the rest of the source code. Without this step, your IDE may complain about missing classes and will be unable to compile the code.

4. Create a copy of the `envs/dev.env.example`

```console
cp envs/dev.env.example .env
```

This command creates a `.env` file in the `app/server` folder. All run scripts pick up environment configuration from this file.

5. Ensure that the environment variables `APPSMITH_MONGODB_URI` and `APPSMITH_REDIS_URI` in the file `.env` point to your local running instances of MongoDB and Redis.

6. Run the following command to create the final JAR for the Appsmith server:

```console
./build.sh -DskipTests
```
This command will create a `dist` folder which contains the final packaged jar along with multiple jars for plugins as well.

Note:
- If you want to run the tests, you can remove `-DskipTests` flag from the build cmd.
- On Ubuntu Linux environment docker needs root privilege, hence ./build.sh script needs to be run with root privilege as well.
- On Ubuntu Linux environment, the script may not be able to read .env file, so it is advised that you run the cmd like:
```console
sudo APPSMITH_MONGODB_URI="mongodb://localhost:27017/appsmith" APPSMITH_REDIS_URL="redis://127.0.0.1:6379" APPSMITH_MAIL_ENABLED=false APPSMITH_ENCRYPTION_PASSWORD=abcd APPSMITH_ENCRYPTION_SALT=abcd ./build.sh
```
- If the volume containing docker's data root path (macOS: `~/Library/Containers/com.docker.docker/Data/vms/0/`, Ubuntu: `/var/lib/docker/`) has less than 2 GB of free space, then the script may fail with the following error:
```console
Check failed: Docker environment should have more than 2GB free disk space.
```
There are two ways to resolve this issue: (1) free up more space (2) change docker's data root path.


7. Start the Java server by running

```console
./scripts/start-dev-server.sh
```

By default, the server will start on port 8080.

8. When the server starts, it automatically runs migrations on MongoDB and will populate it with some initial required data.

9. You can check the status of the server by hitting the endpoint: [http://localhost:8080](http://localhost:8080) on your browser. By default you should see an HTTP 401 error.

Now the last bit, let's get your Intellij IDEA up and running.

## Setting up IntelliJ IDEA

To run the project from within the IDE, you will need to make use of the run configuration that is part of the repository. The run configuration uses the [EnvFile](https://plugins.jetbrains.com/plugin/7861-envfile) plugin to include environment variables in the path. Any and all tests can be run within the IDE by cloning this run configuration.

1. Install the plugin EnvFile from https://plugins.jetbrains.com/plugin/7861-envfile. This is required to load the environment configurations when the server starts.
2. Configure the Run/Debug configuration as shown in the screenshot below:
   <img width="1070" alt="Screenshot 2021-03-03 at 1 50 48 PM" src="https://user-images.githubusercontent.com/458946/109775553-a6dcf780-7c27-11eb-8bfe-a5e34e14a3f8.png">

For being able to run or debug plugins, two are especially important:

- VM Options: `-Dpf4j.mode=development -Dpf4j.pluginsDir=appsmith-plugins` .
- Working Directory: The folder that contains `appsmith-server`, `appsmith-plugins` etc.

Please note when setting **Working directory** option. If the path is not correct, plugins will fail to load and cannot fetch data from mongo, redis

3. Load your env file by going to the EnvFile Tab in the Run/Debug configuration settings for your server.
   <img width="1067" alt="Screenshot 2021-03-03 at 1 49 17 PM" src="https://user-images.githubusercontent.com/458946/109775238-451c8d80-7c27-11eb-98ad-61fc33082b63.png">

## Configuration settings for version 2021.1.2 (Community Edition) IntelliJ IDEA

After configuring settings as mentioned above, please also add the following to your IntelliJ IDEA setup.

1.  [Optional] As shown in the image below, please enable the **Store as Project** checkbox to run the application from the main class specified.
    <img width="1070" alt="intellij config_1" src="./images/intellij_config_1.png">

2. Please enable the **Always update snapshots** checkbox so that the most recent build is picked up.
   <img width="1070" alt="intellij config_2" src="./images/intellij_config_2.png">

Happy hacking ✌️

#### Note:
In case the server doesn't work with the above config, please try re-compiling the code using the steps

```console
mvn -B clean compile && ./build.sh -DskipTests
```
## Running Tests on Server

1. Ensure that you have Redis running on your local system.

2. Run the command to execute tests
```console
  cd app/server
  mvn clean package
```


## Need Assistance
- If you are unable to resolve any issue while doing the setup, please feel free to ask questions on our [Discord channel](https://discord.com/invite/rBTTVJp) or initiate a [Github discussion](https://github.com/appsmithorg/appsmith/discussions) or send an email to `support@appsmith.com`. We'll be happy to help you.
- In case you notice any discrepancy, please raise an issue on Github and/or send an email to support@appsmith.com.
