# Etapa 1: Construcción (Build)
FROM node:20-alpine AS build
WORKDIR /app

# Copiamos archivos de dependencias
COPY package*.json ./
RUN npm install

# Copiamos el resto del código y generamos el dist
COPY . .
RUN npm run build -- --configuration production

# Etapa 2: Servidor de archivos (Runtime)
FROM nginx:alpine
# CORRECCIÓN: Usamos 'ngproyecto' que es el nombre en tu angular.json
COPY --from=build /app/dist/ngproyecto/browser /usr/share/nginx/html

# Exponemos el puerto interno
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

# Etapa 2: Servidor de archivos (Runtime)
FROM nginx:alpine
# Copiamos la nueva configuración
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiamos los archivos de la app
COPY --from=build /app/dist/ngproyecto/browser /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
