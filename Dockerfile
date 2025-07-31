# Use uma imagem oficial do Node.js como base
FROM node:18-alpine AS base

# Instale dependências do sistema necessárias para compilação
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git \
    && rm -rf /var/cache/apk/*

# Stage para build do frontend
FROM base AS frontend-builder

# Defina o diretório de trabalho
WORKDIR /app/client

# Copie apenas os arquivos de dependências primeiro
COPY client/package*.json ./

# Instale dependências com cache otimizado
RUN npm ci --only=production --no-audit --no-fund \
    && npm cache clean --force

# Copie o código fonte do frontend
COPY client/ ./

# Construa o frontend
RUN npm run build \
    && rm -rf node_modules \
    && rm -rf src \
    && rm -rf public \
    && npm cache clean --force

# Stage para o backend
FROM base AS backend-builder

# Defina o diretório de trabalho
WORKDIR /app

# Copie apenas os arquivos de dependências do backend
COPY package*.json ./

# Instale dependências do backend
RUN npm ci --only=production --no-audit --no-fund \
    && npm cache clean --force

# Stage final
FROM node:18-alpine AS production

# Instale apenas as dependências mínimas necessárias
RUN apk add --no-cache \
    dumb-init \
    && rm -rf /var/cache/apk/*

# Crie usuário não-root
RUN addgroup -g 1001 -S nodejs \
    && adduser -S nextjs -u 1001

# Defina o diretório de trabalho
WORKDIR /app

# Copie as dependências do backend
COPY --from=backend-builder --chown=nextjs:nodejs /app/node_modules ./node_modules

# Copie o código do backend
COPY --chown=nextjs:nodejs server/ ./server/
COPY --chown=nextjs:nodejs package*.json ./

# Copie o build do frontend
COPY --from=frontend-builder --chown=nextjs:nodejs /app/client/build ./client/build

# Crie diretórios necessários
RUN mkdir -p uploads/welcome uploads/periodic server/auth \
    && chown -R nextjs:nodejs uploads server/auth

# Mude para usuário não-root
USER nextjs

# Exponha a porta
EXPOSE 3000

# Comando de saúde para verificar se a aplicação está funcionando
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Use dumb-init para gerenciar processos
ENTRYPOINT ["dumb-init", "--"]

# Defina o comando para iniciar a aplicação
CMD ["node", "server/app.js"]