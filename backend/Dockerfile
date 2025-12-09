# backend/Dockerfile
FROM node:20

WORKDIR /app

# Copy package.json & package-lock.json first for caching
COPY package*.json ./
RUN npm install

# Copy all backend files including tests
COPY . .

EXPOSE 5000

CMD ["npm", "start"]