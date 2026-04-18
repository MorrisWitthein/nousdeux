# ---- Build stage ----
FROM node:20-alpine AS build
WORKDIR /app

# VITE_* vars are baked into the bundle at build time, not runtime
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL

COPY package*.json ./
RUN npm ci --ignore-scripts

COPY . .
RUN npm run build

# ---- Serve stage ----
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
