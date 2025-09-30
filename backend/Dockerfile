FROM node:18

WORKDIR /app

# Copia apenas package.json e package-lock.json primeiro (para cache do npm install)
COPY package*.json ./

RUN npm install

# Copia todo o código do backend
COPY . .

# Cria a pasta de uploads se não existir
RUN mkdir -p uploads

# Expõe a porta que o backend vai rodar
EXPOSE 3000

# Rodar o nodemon para dev
CMD ["npm", "run", "dev"]
