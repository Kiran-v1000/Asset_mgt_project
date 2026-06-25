# ---- Build stage ----
FROM node:22-alpine AS build
WORKDIR /app
ARG VITE_API_URL=http://localhost:4002/api/v1
ARG VITE_USE_MOCK=false
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_USE_MOCK=$VITE_USE_MOCK
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- Serve with nginx ----
FROM nginx:alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
