#!/bin/bash
# set -o errexit
# set -x

compose_appsmith_version() {
    local version=$1
    check_appsmith_repo
    cat <<EOF >docker-compose.yml
services:
    appsmith:
        image: index.docker.io/appsmith/appsmith-$edition:$version

        container_name: appsmith
        ports:
            - "80:80"
            - "443:443"
        volumes:
            - /tmp/stacks-postgresupgrade:/appsmith-stacks
        environment:
            - APPSMITH_CLOUD_SERVICES_BASE_URL=https://release-cs.appsmith.com
        restart: unless-stopped
EOF

    docker compose up -d
}

compose_appsmith_latest() {
    local version=latest
    check_appsmith_repo
    cat <<EOF >docker-compose.yml
services:
    appsmith:
        image: index.docker.io/appsmith/appsmith-$edition:$version
        container_name: appsmith
        ports:
            - "80:80"
            - "443:443"
        volumes:
            - /tmp/stacks-postgresupgrade:/appsmith-stacks
        environment:
            - APPSMITH_CLOUD_SERVICES_BASE_URL=https://release-cs.appsmith.com
        restart: unless-stopped
EOF

    docker compose pull &&
        docker compose up -d
}

compose_appsmith_local() {
    local version=latest
    check_appsmith_repo
    cat <<EOF >docker-compose.yml
services:
    appsmith:
        image: appsmith/appsmith-local-$edition:$version
        container_name: appsmith
        ports:
            - "80:80"
            - "443:443"
        volumes:
            - /tmp/stacks-postgresupgrade:/appsmith-stacks
        environment:
            - APPSMITH_CLOUD_SERVICES_BASE_URL=https://release-cs.appsmith.com
        restart: unless-stopped
EOF

    docker compose up -d
}

cleanup() {
    echo "Starting fresh. Cleaning up the environment."
    docker compose rm -fsv appsmith
    sudo rm -rf /tmp/stacks-postgresupgrade/
}

check_appsmith_repo() {
    export edition=ce
    if [[ "$(git remote get-url origin)" == *appsmithorg/appsmith-ee* ]]; then
        export edition=ee
    fi
}