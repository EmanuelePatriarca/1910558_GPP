# Stage 1: Build the Angular application
FROM node:20-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build -- --configuration=production

# Stage 2: Serve the application with Nginx
FROM nginx:alpine

# Copy the custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built Angular application from the build stage
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
