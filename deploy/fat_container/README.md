
# Appsmith Fat Container

The fat container is a Docker image built with all the components required for Appsmith to run, within a single Docker container. Files in this directory make up for the scripts and template files needed for building the image.

You may choose to use the Appsmith cloud instance (at [app.appsmith.com](https://app.appsmith.com)) or start your own using thie fat-container.

## Appsmith Cloud

The fastest way to get started with appsmith is using our cloud-hosted version. It's as easy as

1. [Create an Account](https://app.appsmith.com/user/signup)
2. [Docs on Building a UI](https://docs.appsmith.com/core-concepts/dynamic-ui)

## Self Host

The following subsections describe how you can get started with _your own_ instance of Appsmith.

### 1. Prerequisites

Ensure `docker` and `docker-compose` are installed and available for starting containers:

- Install Docker: [https://docs.docker.com/engine/install/](https://docs.docker.com/engine/install/)
- Install Docker Compose: [https://docs.docker.com/compose/install/](https://docs.docker.com/compose/install/)

You may verify the installation by running `docker --version` and `docker-compose --version`. The output should roughly be something like below:

```sh
$ docker --version
Docker version 20.10.7, build f0df350
$ docker-compose --version
docker-compose version 1.29.2, build 5becea4c
```

### 2. Docker compose configuration

Create a folder called `appsmith` or some other, which will server as our installation folder. Inside this folder, create a `docker-compose.yml` file and copy the following content into it:

```yaml
version: "3"

services:
  appsmith:
    image: appsmith/appsmith-fat
    container_name: appsmith-fat
    ports:
      - "80:80"
      - "443:443"
      - "9001:9001"
    volumes:
      - ./stacks:/appsmith-stacks
    labels:
      com.centurylinklabs.watchtower.enable: "true"

  auto_update:
    image: containrrr/watchtower
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    # Update check interval in seconds.
    command: --interval 300 --label-enable --cleanup
```

After saving this file, `cd` to the folder that contains this file and run the following command to start Appsmith:

```sh
docker-compose up -d
```

This command may take a few minutes to download the docker image and initialize the application. Appsmith should soon be available at <http://localhost>.

You can check if application is running correctly by running `docker ps` or `docker-compose ps` (running `docker-compose` will require you to be in the directory containing the `docker-compose.yml` file to work).

```sh
$ docker ps
CONTAINER ID        IMAGE                             COMMAND                  CREATED             STATUS              PORTS                                      NAMES
3b8f2c9638d0        appsmith/appsmith          "/opt/appsmith/entrypoint.sh"   17 minutes ago      Up 17 minutes       0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp   appsmith
```

You can also use the Supervisord UI to monitor and manage the different processes _inside_ the fat container. This is available at <http://localhost:9001>.

<p>
  <img src="https://raw.githubusercontent.com/appsmithorg/appsmith/release/deploy/fat_container/images/appsmith_supervisord_ui.png" width="80%">
</p>

## Custom Domain

To make Appsmith available on a custom domain, please update your domain's DNS records to point to the instance running Appsmith. Most domain registrars / DNS-providers have documentation on how you can do this yourself.

* [GoDaddy](https://in.godaddy.com/help/create-a-subdomain-4080)
* [Amazon Route 53](https://aws.amazon.com/premiumsupport/knowledge-center/create-subdomain-route-53/)
* [Digital Ocean](https://www.digitalocean.com/docs/networking/dns/how-to/add-subdomain/)
* [NameCheap](https://www.namecheap.com/support/knowledgebase/article.aspx/9776/2237/how-to-create-a-subdomain-for-my-domain)
* [Domain.com](https://www.domain.com/help/article/domain-management-how-to-update-subdomains)

## Instance Management Utilities

The fat container includes an `appsmith` command to help with the management and maintenance of your instance. The following subsections describe what's available.

### Export database

The following command can be used to take a backup dump of Appsmith's database. This can be restored onto another instance using the import command (discussed below) to restore all data.

Before running this, ensure you are in the directory where `docker-compose.yml` is located.

```sh
docker-compose exec appsmith-fat appsmith export_db
```

The output file will be stored in the container directory `/appsmith-stacks/data/backup/appsmith-data.archive`. Thanks to the volume configuration in the `docker-compose.yml` file, it should be available on your host machine at `./stacks/data/backup/appsmith-data.archive`.

If your volume configuration is different or unavailable, you can use the following command to copy the archive file to your host disk:

```sh
docker-compose cp appsmith-fat:/appsmith-stacks/data/backup/appsmith-data.archive .
```

Note that you may want to save the `docker.env` file in addition to this archive file, if you intend to be able to reproduce this environment elsewhere, or in case of a disaster.

### Import database

The following command can restore backup archive, that was produced by the export command (discussed above).

First, copy the archive file into the container using the following command:

```sh
docker-compose cp ./appsmith-data.archive appsmith-fat:/appsmith-stacks/data/restore/
```

Second, run the following command to import data from this file:

```
docker-compose exec appsmith-fat appsmith import_db
```

## Troubleshooting

If you encounter any errors during this process, please reach out to [**support@appsmith.com**](mailto:support@appsmith.com) or join our [Discord Server](https://discord.com/invite/rBTTVJp) and reach out on the #support channel.
