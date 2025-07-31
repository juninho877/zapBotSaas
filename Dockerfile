# Use uma imagem oficial do Node.js como base
FROM node:18-alpine

# Instale dependências do sistema necessárias para compilação
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git \
    build-base \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    musl-dev \
    giflib-dev \
    pixman-dev \
    pangomm-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    libwebp-dev \
    vips-dev \
    libpng-dev \
    zlib-dev \
    fontconfig-dev \
    libffi-dev \
    autoconf \
    pkgconfig

# Defina o diretório de trabalho dentro do contêiner
WORKDIR /app

# Copie os arquivos package.json e package-lock.json para o diretório de trabalho
COPY package*.json ./

# Instale as dependências do backend
RUN npm install --omit=dev

# Copie o código fonte
COPY . .

# Mude para o diretório do cliente e instale dependências
WORKDIR /app/client
RUN npm install

# Construa o frontend React
RUN CI=false npm run build

# Volte para o diretório raiz
WORKDIR /app

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