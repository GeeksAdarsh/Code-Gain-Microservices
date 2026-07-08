# ── Build stage ───────────────────────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# No VITE_API_URL needed: nginx serves the app and proxies /api to the backend,
# so the app's default base ('/api') just works.
RUN npm run build

# ── Runtime stage ─────────────────────────────────────────────────────────
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
