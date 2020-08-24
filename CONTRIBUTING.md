# Contributing to Appsmith

First off, thanks for your interest in Appsmith and taking the time to contribute on this project. 🙌 
Appsmith is a project by developers for developers and there are a lot of ways you can contribute. 
Feel free to propose changes to this document in a pull request.

### Table of contents
- [Code of conduct](CODE_OF_CONDUCT.md)
- [How can I contribute?](#how-can-i-contribute)
- [How to set up local development?](#how-to-set-up-local-development)
- [How to run tests?](#how-to-run-tests)

## How can I contribute?
There are many places ways can contribute to Appsmith and all types of contributions are highly appreciated.

- Beta testing
- Raise Issues
- Feature Requests
- Documentation
- Code contribution
    - Widgets
    - Datasources


## How to set up local development

### Client
Our frontend client is written in ReactJS and Typescript. State management is done via Redux and workflows 
are handled via Redux Saga.
 
##### Pre-requisites:

1. You have `docker` installed in your system. If not, please visit: [https://docs.docker.com/get-docker/](https://docs.docker.com/get-docker/)
2. You have `mkcert` installed. Please visit: [https://github.com/FiloSottile/mkcert#installation](https://github.com/FiloSottile/mkcert#installation) for details.
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

    - Change the API endpoint in the Nginx configuration available in `docker/templates/nginx-linux.conf.template` or `docker/templates/nginx-mac.conf.template`

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
2. Run `mvn clean compile`. This generates a bunch of classes required by IntelliJ for compiling the rest of the source code. 
3. Create a copy of the `envs/dev.env.example` 

    ```shell script
    cp envs/dev.env.example envs/dev.env
    ```

##### How to add new ACL permissions to OPA:

1. Update the relevant permission in `src/main/resources/public/appsmith/authz/acl.rego` file. 
2. Create a tar.gz bundle called `bundle.tar.gz`. The filename is important because this is the file that the OPA server queries for in order to get the new permissions. This should reside in the `public` folder.

    ```bash
    cd src/main/resources/public/
    tar -cvzf bundle.tar.gz appsmith
    ```

3. Restart the Java server to reflect the new bundle.tar.gz. Wait for a few minutes for OPA to query it again. Else, restart the OPA server as well (if you're in a hurry).
4. Ensure your user has the newly created permission before testing, either directly in the user's document or in one of the user's groups.

## How to run tests

##### Client
```bash
  yarn run test:ci
```
```bash
  yarn run test:unit
```
##### Server
TODO