#! /bin/bash

set -e
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
IMAGE=${IMAGE:-localhost/tbt-frontend-npm:latest}
NODE_BASE_IMAGE=${NODE_BASE_IMAGE:-docker.io/library/node:21.6.2-bullseye}
NGINX_BASE_IMAGE=${NGINX_BASE_IMAGE:-docker.io/library/nginx:1.27.1-alpine3.20}
NPM_REGISTRY=${NPM_REGISTRY:-https://registry.npmmirror.com}
buildah --tls-verify=false build \
    --build-arg NODE_BASE_IMAGE=${NODE_BASE_IMAGE} \
    --build-arg NGINX_BASE_IMAGE=${NGINX_BASE_IMAGE} \
    --build-arg NPM_REGISTRY=${NPM_REGISTRY} \
    -f $SCRIPT_DIR/Dockerfile \
    -t $IMAGE $SCRIPT_DIR/../../..
