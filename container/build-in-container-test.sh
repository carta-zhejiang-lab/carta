#! /bin/bash

set -e
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
mkdir -p /tmp/build/containers
podman run --rm \
    -v /tmp/build/containers:/var/lib/containers \
    -v $SCRIPT_DIR/../../../:/code \
    --privileged \
    -e NODE_BASE_IMAGE=m.zjvis.net/docker.io/library/node:21.6.2-bullseye \
    -e NGINX_BASE_IMAGE=m.zjvis.net/docker.io/library/nginx:1.27.1-alpine3.20 \
    -e IMAGE=localhost/tbt-frontend-npm:$(git rev-parse --short HEAD) \
    -it m.zjvis.net/quay.io/containers/buildah:v1.35.4 \
    bash /code/apps/mdf/container/build.sh
