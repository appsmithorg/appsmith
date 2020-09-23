# Contributing to Appsmith

Thank you for your interest in Appsmith and taking the time to contribute on this project. 🙌 
Appsmith is a project by developers for developers and there are a lot of ways you can contribute. 
Feel free to propose changes to this document in a pull request.

### Table of contents
- Code of conduct
- How can I contribute?
- Git Workflow
- Setting up local development
- Running tests

## How can I contribute?
There are many ways in which we/one can to contribute to Appsmith. All contributions are highly appreciated.

- Beta testing
- Raise Issues / Feature Requests
- Improve the Documentation
- Code contribution
    - Introduce New Widgets
    - Introduce New Database Integrations
    - Introduce New SAAS Integrations
    
## Code of conduct

Read our [Code of Conduct](CODE_OF_CONDUCT.md) before contributing

## Git Workflow

We use [Github Flow](https://guides.github.com/introduction/flow/index.html), so all code changes happen through pull requests. 

Pull requests are the best way to propose changes to the codebase and get them reviewed by maintainers.

1. Fork the repo and create your branch from `release`.
2. If you've added code that should be tested, add tests. If it's a client-side change, tests must be added via Cypress/Jest. For server-side changes, please add JUnit tests.
3. If you've changed any APIs, please call this out in the pull request. Also, don't forget to add/modify integration tests via Cypress to ensure that changes are backwards compatible.
4. At all times, ensure the test suite passes. We will not be able to accept your change if the test suite doesn't pass.
5. Create an issue referencing the pull request. This ensures that we can track the bug being fixed or feature being added easily.


## 👨‍💻 Setting up local development

### Client
Appsmith's client (UI/frontend) uses the ReactJS library and Typescript. The application also uses libraries like react-redux and redux-saga for workflows.
 
##### Pre-requisites:

On your development machine, please ensure that:

1. You have `docker` installed in your system. If not, please visit: [https://docs.docker.com/get-docker/](https://docs.docker.com/get-docker/)
2. You have `mkcert` installed. Please visit: [https://github.com/FiloSottile/mkcert#installation](https://github.com/FiloSottile/mkcert#installation) for details. For `mkcert` to work with firefox you may require the `nss` utility to be installed. Details are in the link above.
3. You have `envsubst` installed. use `brew install gettext` on macOS. Linux machines usually have this installed.
4. You have cloned the repo in your local machine.

##### Create local HTTPS certificates:

1. Run the following command from the project root.

```bash
cd app/client/docker && mkcert -install && mkcert "*.appsmith.com" && cd ..
```

This command will end up creating 2 files in the `docker/` directory:

- `_wildcard.appsmith.com-key.pem`
- `_wildcard.appsmith.com.pem`

2. Copy the `.env.example` file and rename the new file to `.env` in the same directory. Populate the entries in the `.env` file with values to enable/toggle features.

3. Run the script `start-https.sh` in order to start the nginx container that will proxy the frontend code on your local system.

##### Steps to build & run the code:

1. Add a domain like `dev.appsmith.com` to `/etc/hosts`. 

```bash
echo "127.0.0.1	dev.appsmith.com" | sudo tee -a /etc/hosts
```

1. Run `cd app/client`
2. Run `yarn`
3. Run `yarn build` (optional)
4. Run `yarn start` if you are hitting [https://release-api.appsmith.com](https://release-api.appsmith.com) (Staging environment) as your API backend.
5. If you are hitting any other API endpoint, 
    - Please run:

    ```shell script
    REACT_APP_ENVIRONMENT=DEVELOPMENT HOST=dev.appsmith.com craco start
    ```

    - Change the API endpoint in the Nginx configuration available in `docker/templates/nginx-linux.conf.template` or `docker/templates/nginx-mac.conf.template`. You will have to run `start-https.sh` script again after making the change.

6. Go to [https://dev.appsmith.com](https://dev.appsmith.com) on your browser

#### If you are unable to run docker:

1. Make the values in `nginx-mac.conf.template` empty. None of those properties are required.
2. `proxy_pass` value must be changed from `http://host.docker.internal:3000` to `http://localhost:3000`
3. Generate the certificates manually via `mkcert`. Check the command in `start-https-server.sh` file.
4. Change the value of the certificate location for keys `ssl_certificate` & `ssl_certificate_key` to the place where these certificates were generated.

### Server
- We use the Spring framework in Java for all backend development.
- We use `maven` as our build tool.
- We use pf4j as a library for plugins.
- We use MongoDB for our database.

1. After cloning the repository, change your directory to `app/server`

2. Run the command  
```bash
  mvn clean compile
```  
  
This generates a bunch of classes required by IntelliJ for compiling the rest of the source code. Without this step, your IDE may complain about missing classes and will be unable to compile the code.

3. Create a copy of the `envs/dev.env.example` 

    ```shell script
    cp envs/dev.env.example .env
    ```

This command creates a `.env` file in the `app/server` folder. All run scripts pick up environment configuration from this file.

4. Modify the property values in the file `.env` to point to your local running instance of MongoDB and Redis.

5. In order to create the final JAR for the Appsmith server, run the command:
```
./build.sh
```

This command will create a `dist` folder which contains the final packaged jar along with multiple jars for the binaries for plugins as well.

6. Start the Java server by running

```
./scripts/start-dev-server.sh
```
By default, the server will start on port 8080.

7. When the server starts, it automatically runs migrations on MongoDB and will populate it with some initial required data.

8. You can check the status of the server by hitting the endpoint: [http://localhost:8080](http://localhost:8080) on your browser. By default you should see an blank page.

## 🧪 Running tests

##### Client
1. In order to run the Cypress integration tests, run:
```bash
  yarn run test
```

2. In order to run the Jest unit tests, run:
```bash
  yarn run test:unit
```

##### Server
1. Ensure that you have Redis running on your local system.

2. Run the command to execute tests
```bash
  mvn clean package
```
