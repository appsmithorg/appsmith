## Running Client Codebase

Appsmith's client (UI/frontend) uses the ReactJS library and Typescript. The application also uses libraries like react-redux and redux-saga for workflows. We use VS Code Editor as our primary editor


[![How to Setup Appsmith for Client Side Development](../static/images/client-yt-video-thumbnail.png)](https://www.youtube.com/watch?v=FwJlVWVx0X0)


### Pre-requisites:

On your development machine, please ensure that:

1. You have `docker` installed in your system. If not, please visit: [https://docs.docker.com/get-docker/](https://docs.docker.com/get-docker/)
1. You have `mkcert` installed. Please visit: [https://github.com/FiloSottile/mkcert#installation](https://github.com/FiloSottile/mkcert#installation) for details. For `mkcert` to work with Firefox you may require the `nss` utility to be installed. Details are in the link above.
1. You have `envsubst` installed. use `brew install gettext` on MacOS. Linux machines usually have this installed.
1. You have cloned the repo in your local machine.
1. You have yarn installed as a global npm package i.e. `npm install -g yarn`

### Create local HTTPS certificates:

1. Run the following command from the project root.

   ```bash
   cd app/client/docker && mkcert -install && mkcert "*.appsmith.com" && cd ../../..
   ```

   This command will create 2 files in the `docker/` directory:

   - `_wildcard.appsmith.com-key.pem`
   - `_wildcard.appsmith.com.pem`

1. Add the domain `dev.appsmith.com` to `/etc/hosts`.

   ```bash
   echo "127.0.0.1 dev.appsmith.com" | sudo tee -a /etc/hosts
   ```

   Note:

   - Please be careful when copying the above string as space between the ip and the string goes missing sometimes.
   - Please check that the string has been copied properly

   ```
   cat /etc/hosts | grep appsmith
   ```

1. Run cmd: `cp .env.example .env`

1. Run the script `start-https.sh` in order to start the nginx container that will proxy the frontend code on your local system.

   ```bash
   cd app/client
   ./start-https.sh
   ```

### Steps to build & run the code:

1. Run `yarn install`

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
- In case you are unable to setup the api server on your local system, you can also [use Appsmith's staging API server](#if-you-would-like-to-hit-a-different-appsmith-server).
- In case you are using a M1 chip Macbook please run the client with `yarn start-m1`.

#### If yarn start throws mismatch node version error

This error occurs because the node version is not compatible with the app environment. In this case Node version manager can be used which allows multiple
node versions to be used in different projects. Check below for installation and usage details:

1. Install a node version manager. For eg: check [nvm](https://github.com/nvm-sh/nvm) or [fnm](https://github.com/Schniz/fnm).
1. In the root of the project, run `nvm use 10.16.3` or `fnm use 10.16.3`.

#### If you would like to hit a different Appsmith server:

- You can pass the server url as an arg to the `start-https.sh` script.

    ```bash
    ./start-https.sh https://release.app.appsmith.com
    ```

- Run

    ```
    yarn
    yarn start
    ```

### Troubleshooting

#### I am on WSL and can't reach dev.appsmith.com

- You will need to add `dev.appsmith.com` to Windows' `C:\Windows\System32\drivers\etc\hosts` instead of `/etc/hosts`. Alternately, you can install a desktop environment in WSL to open `dev.appsmith.com` from a browser in WSL.

  ```
  127.0.0.1 dev.appsmith.com
  ```

- WSL network with windows can be brittle, make sure you can reach http://127.0.0.1:3000 from windows. If not, restarting wsl usually resolves the issue.

#### Docker container doesn't work

- You can check logs with `docker logs wildcard-nginx`
- If you see `Address already in use` errors, look for the service running on port 80 and 443 with `lsof -i tcp:80,443 | grep LISTEN` and stop the process.

  Example: Some Linux distros have `apache2` listening on 80. Stop them with `sudo systemctl stop apache2`

#### I want to add dev.appsmith.com conf to my local nginx without docker.

1. Copy `app/client/docker/templates/nginx-app.conf.template` over to your nginx sites directory.
1. You can remove or replace values for all the `sub_filter`. None of those properties are required.
1. Change `proxy_pass` value for client from `__APPSMITH_CLIENT_PROXY_PASS__` to `http://localhost:3000`
1. Replace all occurences of `__APPSMITH_SERVER_PROXY_PASS__` with `http://localhost:8080` (or the server you want to point to)
1. Generate the certificates manually via `mkcert`.
1. Change the value of the certificate location for keys `ssl_certificate` & `ssl_certificate_key` to the place where these certificates were generated.
1. Reload nginx! :tada:

## I still need help!

Please open a [Github issue](https://github.com/appsmithorg/appsmith/issues/new/choose) or join our [discord server](https://discord.com/invite/rBTTVJp)
