# Use uma imagem oficial do Node.js como base
FROM node:18-alpine

# Instale dependências do sistema necessárias
RUN apk add --no-cache python3 make g++ git

# Instale dependências do sistema necessárias
RUN apk add --no-cache python3 make g++

# Defina o diretório de trabalho dentro do contêiner
WORKDIR /app

# Copie os arquivos package.json e package-lock.json para o diretório de trabalho
COPY package*.json ./

# Instale as dependências do backend
RUN npm ci --omit=dev

# Copie os arquivos package.json do cliente
COPY client/package*.json ./client/

# Instale as dependências do frontend
RUN cd client && npm ci --omit=dev

# Copie o código fonte
COPY . .

# Construa o frontend React
RUN cd client && npm run build

# Crie diretórios necessários
RUN mkdir -p uploads/welcome uploads/periodic server/auth

# Defina permissões corretas
RUN chown -R node:node /app
USER node

# Exponha a porta
EXPOSE 3000

# Comando de saúde para verificar se a aplicação está funcionando
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Defina o comando para iniciar a aplicação
CMD ["node", "server/app.js"]