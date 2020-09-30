## Running Client Codebase
Appsmith's client (UI/frontend) uses the ReactJS library and Typescript. The application also uses libraries like react-redux and redux-saga for workflows. We use VS Code Editor as our primary editor
 
### Pre-requisites:

On your development machine, please ensure that:

1. You have `docker` installed in your system. If not, please visit: [https://docs.docker.com/get-docker/](https://docs.docker.com/get-docker/)
2. You have `mkcert` installed. Please visit: [https://github.com/FiloSottile/mkcert#installation](https://github.com/FiloSottile/mkcert#installation) for details. For `mkcert` to work with firefox you may require the `nss` utility to be installed. Details are in the link above.
3. You have `envsubst` installed. use `brew install gettext` on macOS. Linux machines usually have this installed.
4. You have cloned the repo in your local machine.

### Create local HTTPS certificates:

1. Run the following command from the project root.

```bash
cd app/client/docker && mkcert -install && mkcert "*.appsmith.com" && cd ..
```

This command will create 2 files in the `docker/` directory:

- `_wildcard.appsmith.com-key.pem`
- `_wildcard.appsmith.com.pem`

2. Add the domain `dev.appsmith.com` to `/etc/hosts`.
```bash
echo "127.0.0.1	dev.appsmith.com" | sudo tee -a /etc/hosts
```

3. Run the script `start-https.sh` in order to start the nginx container that will proxy the frontend code on your local system.
```bash
cd app/client
./start-https.sh
```

### Steps to build & run the code:
1. Run `yarn`
2. Run `yarn start`

🎉 Your appsmith client is now running on https://dev.appsmith.com.

    This URL must be opened with https and not have the port 3000 in it

Your client is pointing to the cloud staging server https://release-api.appsmith.com

#### If you would like to hit a different appsmith server:
- Change the API endpoint in the Nginx configuration files (`app/client/docker/templates/nginx-linux.conf.template` or `app/client/docker/templates/nginx-mac.conf.template`). 
- Run `start-https.sh` script again.
- Run
```bash
REACT_APP_ENVIRONMENT=DEVELOPMENT HOST=dev.appsmith.com craco start
```
    

#### If you are unable to run docker:

1. Make the values in `nginx-mac.conf.template` empty. None of those properties are required.
2. `proxy_pass` value must be changed from `http://host.docker.internal:3000` to `http://localhost:3000`
3. Generate the certificates manually via `mkcert`. Check the command in `start-https-server.sh` file.
4. Change the value of the certificate location for keys `ssl_certificate` & `ssl_certificate_key` to the place where these certificates were generated.
