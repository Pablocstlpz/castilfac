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
# Copiamos el dist generado en la etapa anterior a la carpeta de nginx
COPY --from=build /app/dist/castilfac/browser /usr/share/nginx/html

# Exponemos el puerto interno
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
