FROM node:18-alpine

# Creamos el directorio de la app
WORKDIR /app

# Copiamos solo los archivos de dependencias primero (optimiza la caché de Docker)
COPY package*.json ./

# Instalamos solo las dependencias de producción
RUN npm install --production

# Copiamos el resto del código (la carpeta src)
COPY . .

# Exponemos el puerto que usas en tu .env
EXPOSE 3000

# Iniciamos la app usando el script de tu package.json
CMD ["npm", "start"]