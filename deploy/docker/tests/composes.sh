#!/bin/bash
# set -o errexit
# set -x

generate_compose_file() {
    local version=$1
    check_appsmith_edition
    cat <<EOF >${docker_compose_path}
services:
    appsmith:
        image: index.docker.io/appsmith/appsmith-$edition:$version
        container_name: $container_name
        ports:
            - "80:80"
            - "443:443"
        volumes:
            - ${stacks_path}:/appsmith-stacks
        environment:
            - APPSMITH_CLOUD_SERVICES_BASE_URL=https://release-cs.appsmith.com
        restart: unless-stopped
EOF
}

compose_appsmith_version() {
    local version=$1
    generate_compose_file $version
    docker compose up -d
}

compose_appsmith_latest() {
    local version=latest
    check_appsmith_edition

    generate_compose_file $version
    docker compose pull &&
        docker compose up -d
}

compose_appsmith_local() {
    local version=latest
    check_appsmith_edition

    cat <<EOF >${docker_compose_path}
services:
    appsmith:
        image: appsmith/appsmith-local-$edition:$version
        container_name: $container_name
        ports:
            - "80:80"
            - "443:443"
        volumes:
            - ${stacks_path}:/appsmith-stacks
        environment:
            - APPSMITH_CLOUD_SERVICES_BASE_URL=https://release-cs.appsmith.com
        restart: unless-stopped
EOF

    docker compose up -d

    # return container name
    echo "$container_name"
}

cleanup() {
    echo "Starting fresh. Cleaning up the environment."
    docker rm -f $container_name || true
    sudo rm -rf ${stacks_path} || true
}

check_appsmith_edition() {
    export edition=ce
    if [[ "$(git remote get-url origin)" == *appsmithorg/appsmith-ee* ]]; then
        export edition=ee
    fi
    echo "Edition: $edition"
}

container_name="appsmith-docker-test"
# mkdir -p /tmp/$container_name
stacks_path="/tmp/$container_name-stacks"
docker_compose_path="docker-compose.yml"
