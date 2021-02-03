### Change Log

#### 1. Environment variables

- `APPSMITH_DOMAIN`: the domain or subdomain on which you want to host appsmith (example.com / app.example.com).
- `APPSMITH_SSL_ENABLED`: the provision of an SSL certificate for your custom domain.
- `APPSMITH_SSL_EMAIL`: the email address to create SSL certificate.
- `APPSMITH_SSL_ENV`: the environment when creating a certificate.
- `PLATFORM`: the platform used to deploy Appsmith.

#### 2. Platforms

- Docker & docker-compose:

  - Update `docker-compose.yml` to not use `nginx.conf.template` mount volume.
  - `start-nginx.sh` will generate `default.conf` from `nginx.conf.template` (if have `# Version=2.0` will generate new flow, otherwise keep old flow).
  - `docker.env.sh` will have additional SSL configuration information fields: `APPSMITH_DOMAIN`, `APPSMITH_SSL_ENABLED`, `APPSMITH_SSL_EMAIL`, `APPSMITH_SSL_ENV`.

- Ansible:

  - Update `docker-compose.yml` to not use `nginx.conf.template` mount volume.
  - Remove task to copy nginx template to host.

- Heroku:

  - Update `Dockerfile` copy `nginx.conf.template` and `nginx-root.conf.template` from frontend image.
  - Update `bootstrap.sh` adapt to new `nginx.conf.template` (Version 2.0).

- K8s:

  - Remove mount `nginx.config.template` in `frontend-template.yaml`.
  - `appsmith-configmap.yaml` will have additional SSL configuration information fields: `APPSMITH_DOMAIN`, `APPSMITH_SSL_ENABLED`, `APPSMITH_SSL_EMAIL`, `APPSMITH_SSL_ENV`, `PLATFORM`.

- AWS AMI:

  - Remove download `nginx_app.conf.sh` in `first-time-setup.sh`.
  - `docker.env.sh` will have additional SSL configuration information fields: `APPSMITH_DOMAIN`, `APPSMITH_SSL_ENABLED`, `APPSMITH_SSL_EMAIL`, `APPSMITH_SSL_ENV`.
  - Move prompts:
    - `Enter the domain or subdomain on which you want to host appsmith (example.com / app.example.com):`
    - `Would you like to provision an SSL certificate for your custom domain / subdomain?`
    - `Enter email address to create SSL certificate: (Optional, but strongly recommended):`
    - `Do you want to create certificate in staging mode (which is used for dev purposes and is not subject to rate limits)?`

  from `init-letsencrypt.sh` to `configure-ssl.sh`.
