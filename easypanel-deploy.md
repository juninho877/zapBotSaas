# Deploy no EasyPanel - WhatsApp Bot SaaS

## Pré-requisitos

1. Conta no EasyPanel
2. Repositório Git com o código (GitHub, GitLab, etc.)
3. Banco de dados MySQL configurado

## Passos para Deploy

### 1. Configurar o Banco de Dados

No EasyPanel, crie um serviço MySQL:
- Nome: `whatsapp-mysql`
- Versão: MySQL 8.0
- Database: `whatsapp_bot_saas`
- Username: `whatsapp_user`
- Password: `[sua_senha_segura]`

Após criar o MySQL, execute o script SQL para criar as tabelas:
```sql
-- Cole o conteúdo do arquivo database/schema.sql
```

### 2. Criar o Serviço da Aplicação

1. **Criar Novo Serviço**:
   - Tipo: `App`
   - Nome: `whatsapp-bot-saas`

2. **Configurar Source**:
   - Source Type: `Git`
   - Repository: `[seu-repositorio-git]`
   - Branch: `main`
   - Build Type: `Dockerfile`

3. **Configurar Variáveis de Ambiente**:
   ```
   NODE_ENV=production
   PORT=3000
   DB_HOST=[host-do-mysql-easypanel]
   DB_PORT=3306
   DB_USER=whatsapp_user
   DB_PASSWORD=[sua_senha_mysql]
   DB_NAME=whatsapp_bot_saas
   JWT_SECRET=[gere_um_jwt_secret_seguro]
   JWT_EXPIRES_IN=7d
   BOT_NAME=WhatsApp Bot SaaS
   BOT_VERSION=1.0.0
   MAX_FILE_SIZE=5242880
   ```

4. **Configurar Domínio**:
   - Adicione seu domínio personalizado ou use o subdomínio fornecido pelo EasyPanel

5. **Configurar Volumes** (Opcional):
   - `/app/uploads` - Para armazenar arquivos enviados
   - `/app/server/auth` - Para sessões do WhatsApp

### 3. Deploy

1. Clique em "Deploy"
2. Aguarde o build e deploy completar
3. Acesse a aplicação através do domínio configurado

### 4. Configuração Inicial

1. Acesse a aplicação
2. Faça login com as credenciais padrão:
   - Email: `admin@example.com`
   - Senha: `admin123`
3. Altere a senha do administrador
4. Crie novos usuários conforme necessário

## Variáveis de Ambiente Importantes

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `NODE_ENV` | Ambiente de execução | `production` |
| `PORT` | Porta da aplicação | `3000` |
| `DB_HOST` | Host do banco MySQL | `mysql.easypanel.host` |
| `DB_USER` | Usuário do banco | `whatsapp_user` |
| `DB_PASSWORD` | Senha do banco | `sua_senha_segura` |
| `DB_NAME` | Nome do banco | `whatsapp_bot_saas` |
| `JWT_SECRET` | Chave secreta JWT | `gere_uma_chave_aleatoria` |

## Monitoramento

A aplicação inclui:
- Health check endpoint: `/api/health`
- Logs detalhados via console
- WebSocket para atualizações em tempo real
- Dashboard com estatísticas do sistema

## Troubleshooting

### Problemas Comuns:

1. **Erro de conexão com banco**:
   - Verifique as variáveis de ambiente do banco
   - Confirme se o MySQL está rodando
   - Teste a conexão manualmente

2. **QR Code não aparece**:
   - Verifique se o WebSocket está funcionando
   - Confirme se as permissões de arquivo estão corretas

3. **Comandos não funcionam**:
   - Verifique se o bot tem permissões de admin no grupo
   - Confirme a configuração dos comandos no painel

### Logs:

Para visualizar logs no EasyPanel:
1. Acesse o serviço da aplicação
2. Vá para a aba "Logs"
3. Monitore erros e atividades

## Backup

Recomendações para backup:
1. **Banco de dados**: Configure backup automático do MySQL no EasyPanel
2. **Sessões WhatsApp**: As sessões são armazenadas em `/app/server/auth`
3. **Uploads**: Arquivos em `/app/uploads`

## Atualizações

Para atualizar a aplicação:
1. Faça push das alterações para o repositório Git
2. No EasyPanel, clique em "Redeploy"
3. Aguarde o novo build e deploy

## Suporte

- Documentação completa no README.md
- Logs detalhados disponíveis no painel
- Health check para monitoramento automático