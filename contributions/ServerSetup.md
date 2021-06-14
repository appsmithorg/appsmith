## Running Server Codebase

This document explains how you can setup a development environment for Appsmith server. As the server codebase is written in Java and is powered by Spring + WebFlux we need Java and Maven installed to build the code. In addition we also need one instance of MongoDB and Redis each to run Appsmith server. Lastly, we will set up IntelliJ IDEA to let you edit the code. Let's get those prerequisites installed on your machine.

>If you are not setting up a development environment you can get the Appsmith server up and running quickly with `Docker`. Please refer to the [Setup Guide](../app/server/README.md#run-locally-with-docker) on how to do that.

## Pre-requisites

Before you can start to hack on the Appsmith server, your machine should have the following installed:

- Java - OpenJDK 11.
- Maven - Version 3+ (preferably 3.6).
- A MongoDB database - Refer to the [Setting up a local MongoDB instance](#setting-up-a-local-mongodb-instance) section to setup a MongoDB instance using `Docker`.
- A Redis instance - Refer to the [Setting up a local Redis instance](#setting-up-a-local-redis-instance) section to setup a Redis instance using `Docker`.
- An IDE - We use IntelliJ IDEA as our primary IDE for backend development. To set it up, refer to the [Setting up IntelliJ IDEA](#setting-up-intellij-idea) section.

This document doesn't provide instructions to install Java and Maven because these vary between different operating systems and distributions. Please refer to the documentation of your operating system or package manager to install these. Next we will setup MondoDB and Redis using `Docker`.

### Setting up a local MongoDB instance

The following command will start a MongoDB docker instance locally:

```sh
docker run -p 127.0.0.1:27017:27017 --name appsmith-mongodb -e MONGO_INITDB_DATABASE=appsmith -v /path/to/store/data:/data/db mongo
```

Please change the `/path/to/store/data` to a valid path on your system. This is where MongoDB will persist it's data across runs of this container.

Note that this command doesn't set any username or password on the database so we make it accessible only from localhost using the `127.0.0.1:` part in the port mapping argument. Please refer to the documentation of this image to learn [how to set a username and password](https://hub.docker.com/_/mongo).

MongoDB will now be running on `mongodb://localhost:27017/appsmith`.

### Setting up a local Redis instance

The following command will start a Redis docker instance locally:

```sh
docker run -p 127.0.0.1:6379:6379 --name appsmith-redis redis
```

Redis will now be running on `redis://localhost:6379`.

With the prerequisites met, let's build the code.

## Building and running the code

1. Clone Appsmith repository.
2. Change your directory to `app/server`.
3. Run the following command: 

```sh
mvn clean compile
```  

This generates a bunch of classes required by IntelliJ for compiling the rest of the source code. Without this step, your IDE may complain about missing classes and will be unable to compile the code.

4. Create a copy of the `envs/dev.env.example` 

```sh
cp envs/dev.env.example .env
```

This command creates a `.env` file in the `app/server` folder. All run scripts pick up environment configuration from this file.

5. Ensure that the environment variables `APPSMITH_MONGODB_URI` and `APPSMITH_REDIS_URI` in the file `.env` point to your local running instances of MongoDB and Redis.

6. Run the following command to create the final JAR for the Appsmith server:

```
./build.sh
```
This command will create a `dist` folder which contains the final packaged jar along with multiple jars for plugins as well.

Note:
- If you want to skip tests, you can pass `-DskipTests` flag to the build cmd.
- On Ubuntu Linux environment docker needs root privilege, hence ./build.sh script needs to be run with root privilege as well.
- On Ubuntu Linux environment, the script may not be able to read .env file, so it is advised that you run the cmd like:
```
sudo APPSMITH_MONGODB_URI="mongodb://localhost:27017/appsmith" APPSMITH_REDIS_URL="redis://127.0.0.1:6379" APPSMITH_MAIL_ENABLED=false APPSMITH_ENCRYPTION_PASSWORD=abcd APPSMITH_ENCRYPTION_SALT=abcd ./build.sh
```
- If the volume containing docker's data root path (macOS: `~/Library/Containers/com.docker.docker/Data/vms/0/`, Ubuntu: `/var/lib/docker/`) has less than 2 GB of free space, then the script may fail with the following error: 
```
Check failed: Docker environment should have more than 2GB free disk space.
```
There are two ways to resolve this issue: (1) free up more space (2) change docker's data root path.


7. Start the Java server by running

```
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

Happy hacking.

## Need Assistance?
- If you are unable to resolve any issue while doing the setup, please feel free to ask questions on our [Discord channel](https://discord.com/invite/rBTTVJp) or initiate a [Github discussion](https://github.com/appsmithorg/appsmith/discussions) or send an email to `support@appsmith.com`. We'll be happy to help you. 
- In case you notice any discrepancy, please raise an issue on Github and/or send an email to support@appsmith.com.
