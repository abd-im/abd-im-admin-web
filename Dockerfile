FROM node:24-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM nginx:stable-alpine
ENV ADMIN_API_TARGET=http://host.docker.internal:10009 \
    CHAT_API_TARGET=http://host.docker.internal:10008 \
    IM_API_TARGET=http://host.docker.internal:10002 \
    NGINX_ENVSUBST_FILTER="^(ADMIN_API_TARGET|CHAT_API_TARGET|IM_API_TARGET)$"
COPY deploy/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD wget -q -O /dev/null http://127.0.0.1/healthz || exit 1
