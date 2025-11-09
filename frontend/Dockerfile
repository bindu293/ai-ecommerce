# ---------- Build stage ----------
FROM node:18-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

# Pass API URL for Vite at build time
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

COPY . .
RUN npm run build

# ---------- Runtime stage (nginx) ----------
FROM nginx:alpine AS runtime

# Copy SPA-friendly nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]