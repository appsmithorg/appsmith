## Running Client Codebase
Appsmith's client (UI/frontend) uses the ReactJS library and Typescript. The application also uses libraries like react-redux and redux-saga for workflows. We use VS Code Editor as our primary editor

### Pre-requisites:

On your development machine, please ensure that:

1. You have `docker` installed in your system. If not, please visit: [https://docs.docker.com/get-docker/](https://docs.docker.com/get-docker/)
2. You have `mkcert` installed. Please visit: [https://github.com/FiloSottile/mkcert#installation](https://github.com/FiloSottile/mkcert#installation) for details. For `mkcert` to work with Firefox you may require the `nss` utility to be installed. Details are in the link above.
3. You have `envsubst` installed. use `brew install gettext` on MacOS. Linux machines usually have this installed.
4. You have cloned the repo in your local machine.

### Create local HTTPS certificates:

1. Run the following command from the project root.

```bash
cd app/client/docker && mkcert -install && mkcert "*.appsmith.com" && cd ../../..
```

This command will create 2 files in the `docker/` directory:

- `_wildcard.appsmith.com-key.pem`
- `_wildcard.appsmith.com.pem`

2. Add the domain `dev.appsmith.com` to `/etc/hosts`.
```bash
echo "127.0.0.1	dev.appsmith.com" | sudo tee -a /etc/hosts
```
Note:
- Please be careful when copying the above string as space between the ip and the string goes missing sometimes.
- Please check that the string has been copied properly by running
```
cat /etc/hosts | grep appsmith
```
3. Run cmd: `cp .env.example .env`

4. Run the script `start-https.sh` in order to start the nginx container that will proxy the frontend code on your local system.
```bash
cd app/client
./start-https.sh
```

#### WSL (Windows Subsystem for Linux)

- Because Docker Desktop for Windows does not support `host` network mode (https://docs.docker.com/network/host/), to run `start-https.sh` in WSL, in `start-https.sh`, remove the `--network host` option from the call to the `docker` command, then in `app/client/docker/templates/nginx-linux.conf.template`, replace all occurrences of `http://localhost:3000` with  `http://host.docker.internal:3000`.
- If you are accessing `dev.appsmith.com` from a browser in Windows, you will need to add `dev.appsmith.com` to Windows' `C:\Windows\System32\drivers\etc\hosts` instead of `/etc/hosts`. Alternately, you can install a desktop environment in WSL to open `dev.appsmith` from a browser in WSL.
```
127.0.0.1	dev.appsmith.com
```

### Steps to build & run the code:
1. Run `yarn`

Note:
- On Ubuntu Linux platform, please run the following cmd before step 2 below:
```
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p
```
2. Run `yarn start`

🎉 Your Appsmith client is now running on https://dev.appsmith.com.

    This URL must be opened with https and not have the port 3000 in it

#### Note:
- By default your client app points to the local api server - `http://host.docker.internal:8080` for MacOS or `http://localhost:8080` for Linux. Your page will load with errors if you don't have the api server running on your local system. To setup the api server on your local system please follow the instructions [here](https://github.com/appsmithorg/appsmith/blob/release/contributions/ServerSetup.md)
- In case you are unable to setup the api server on your local system, you can also use Appsmith's api server: https://release-api.appsmith.com. How to make this change is described in [this section](#if-you-would-like-to-hit-a-different-appsmith-server).

#### If yarn start throws mismatch node version error
This error occurs because the node version is not compatible with the app environment. In this case Node version manager can be used which allows multiple
node versions to be used in different projects. Check below for installation and usage details:
1. Install a node version manager. For eg: check [nvm](https://github.com/nvm-sh/nvm) or [fnm](https://github.com/Schniz/fnm).
2. In the root of the project, run `nvm use 10.16.3` or `fnm use 10.16.3`.

#### If you would like to hit a different Appsmith server:
- Change the API endpoint in the Nginx configuration files (`app/client/docker/templates/nginx-mac.conf.template` on MacOS or `app/client/docker/templates/nginx-linux.conf.template` on Linux). By default it points to your local instance i.e. `http://host.docker.internal:8080` for MacOS or `http://localhost:8080` for Linux. You need to replace all the occurances of the default ip with your preferred ip.
- Run `start-https.sh` script again.
- Run
```
yarn
yarn start
```


#### If you are unable to run docker:

1. Make the values in `nginx-mac.conf.template` empty. None of those properties are required.
2. `proxy_pass` value must be changed from `http://host.docker.internal:3000` to `http://localhost:3000`
3. Generate the certificates manually via `mkcert`. Check the command in `start-https-server.sh` file.
4. Change the value of the certificate location for keys `ssl_certificate` & `ssl_certificate_key` to the place where these certificates were generated.
5. If you ran `./start-https`, but containers failed to start (you have to check with `docker ps` since it fails silently). Some Linux distros (`Ubuntu` for example) have installed and running `apache2` webserver on port `80`. This can result in `Address already in use` error (you can check with `docker logs wildcard-nginx`). Simple solution for this is simply turning it off temporarily with `sudo systemctl stop apache2`. After that just run `./start-https` again.


## Need Assistance
- If you are unable to resolve any issue while doing the setup, please initiate a Github discussion or join our [discord server](https://discord.com/invite/rBTTVJp)
