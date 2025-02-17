ARG NODE_BASE_IMAGE=docker.io/library/node:21.6.2-bullseye
ARG NGINX_BASE_IMAGE=docker.io/library/nginx:1.27.1-alpine3.20
FROM $NODE_BASE_IMAGE as builder

COPY ./ ./

WORKDIR ./
ARG NPM_REGISTRY=https://registry.npmmirror.com
# RUN npm install -g pnpm@v8.15.4 --registry ${NPM_REGISTRY} \
#     && pnpm install --loglevel=debug --registry ${NPM_REGISTRY} \
#     && pnpm run build

FROM $NGINX_BASE_IMAGE
COPY ./container/nginx.conf /etc/nginx/nginx.conf
COPY --from=builder ./build /usr/share/nginx/html
