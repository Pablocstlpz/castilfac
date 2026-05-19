# Etapa 1: construccion (build) del Angular
FROM node:20-alpine AS build
WORKDIR /app

# Copiamos archivos de dependencias y los instalamos primero (cache de Docker)
COPY package*.json ./
RUN npm install

# Copiamos el resto del codigo y generamos el dist en modo produccion
COPY . .
RUN npm run build -- --configuration production

# Etapa 2: servidor de archivos (runtime) con nginx
FROM nginx:alpine

# Copiamos nuestra configuracion de nginx (fallback de SPA, cache de assets, etc.)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiamos los archivos del build de Angular al document root de nginx
# OJO: en angular.json el nombre del proyecto sigue siendo "ngproyecto",
# por eso el path es /app/dist/ngproyecto/browser
COPY --from=build /app/dist/ngproyecto/browser /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
