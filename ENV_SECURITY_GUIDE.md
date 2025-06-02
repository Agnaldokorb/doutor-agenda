# 🔒 Guia de Configuração de Variáveis de Ambiente Seguras

## Doutor Agenda - Configurações de Produção LGPD

### 📋 Arquivo .env para Produção

Crie um arquivo `.env` com as seguintes configurações obrigatórias:

```bash
# === CONFIGURAÇÕES BÁSICAS ===
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://seudominio.com.br

# === BANCO DE DADOS (SSL OBRIGATÓRIO) ===
# Para produção, use SEMPRE sslmode=require
DATABASE_URL="postgresql://usuario:senha@host:5432/database?sslmode=require"

# Exemplos para diferentes provedores:
# Vercel Postgres: postgresql://user:pass@host:5432/db?sslmode=require
# Supabase: postgresql://user:pass@host:5432/db?sslmode=require
# AWS RDS: postgresql://user:pass@host:5432/db?sslmode=require&sslcert=rds-ca-2019-root.pem

# === AUTENTICAÇÃO ===
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# === EMAIL (SendGrid) ===
SENDGRID_API_KEY=SG.your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@seudominio.com.br
SENDGRID_FROM_NAME="Doutor Agenda"

# === UPLOAD DE ARQUIVOS (UploadThing) ===
UPLOADTHING_SECRET=sk_live_your-uploadthing-secret
UPLOADTHING_APP_ID=your-uploadthing-app-id

# === CONFIGURAÇÕES DE SEGURANÇA ===
AUTH_SECRET=sua-chave-secreta-super-forte-aqui

# === CONFIGURAÇÕES LGPD ===
DPO_EMAIL=dpo@seudominio.com.br
DPO_NAME="Nome do Encarregado"
PRIVACY_POLICY_VERSION=1.0

# === RATE LIMITING ===
RATE_LIMIT_MAX=10
RATE_LIMIT_WINDOW=60

# === CONFIGURAÇÕES DE PRODUÇÃO ===
SESSION_TIMEOUT_MINUTES=480
MAX_CONCURRENT_SESSIONS=5
FORCE_HTTPS=true
LOG_RETENTION_DAYS=90
ENABLE_AUDIT_LOGS=true
ENABLE_SECURITY_NOTIFICATIONS=true
```

---

## 🔐 Verificações Obrigatórias de Segurança

### 1. Verificar SSL do Banco de Dados

```bash
# Conectar e verificar SSL
psql "$DATABASE_URL" -c "SHOW ssl;"

# Deve retornar: ssl | on
```

### 2. Testar HTTPS

```bash
# Verificar headers de segurança
curl -I https://seudominio.com.br

# Deve incluir:
# Strict-Transport-Security: max-age=31536000
# X-Content-Type-Options: nosniff
# X-Frame-Options: DENY
```

### 3. Verificar Configurações do Banco

```sql
-- Conectar ao banco e verificar configurações SSL
SELECT name, setting FROM pg_settings WHERE name LIKE '%ssl%';

-- Verificar conexões ativas
SELECT * FROM pg_stat_ssl;
```

---

## 🚨 Checklist de Segurança LGPD

### ✅ Criptografia Obrigatória

- [ ] **HTTPS ativado** (certificado SSL válido)
- [ ] **Banco com SSL** (`sslmode=require`)
- [ ] **Headers de segurança** implementados
- [ ] **Cookies seguros** (httpOnly, secure, sameSite)

### ✅ Logs de Auditoria

- [ ] **Logs de acesso** a dados pessoais
- [ ] **Logs de modificação** de dados
- [ ] **Logs de configuração** de segurança
- [ ] **Retenção de logs** (90 dias mínimo)

### ✅ Controle de Acesso

- [ ] **Autenticação obrigatória**
- [ ] **Rate limiting** ativo
- [ ] **Timeout de sessão** configurado
- [ ] **CSRF protection** ativo

---

## 🔧 Comandos de Configuração

### Configurar SSL no PostgreSQL

```sql
-- Habilitar SSL no PostgreSQL
ALTER SYSTEM SET ssl = on;
ALTER SYSTEM SET ssl_cert_file = 'server.crt';
ALTER SYSTEM SET ssl_key_file = 'server.key';
SELECT pg_reload_conf();
```

### Gerar Chaves Seguras

```bash
# Gerar chave AUTH_SECRET
openssl rand -base64 32

# Gerar chave de criptografia para backups
openssl rand -base64 32
```

### Verificar Configurações

```bash
# Testar conexão com SSL
psql "postgresql://user:pass@host:5432/db?sslmode=require" -c "SELECT version();"

# Verificar headers HTTP
curl -H "Accept: application/json" -i https://seudominio.com.br/api/health
```

---

## 📊 Monitoramento de Conformidade

### Logs de Auditoria LGPD

```sql
-- Verificar logs de acesso a dados pessoais
SELECT
  type,
  action,
  COUNT(*) as total,
  DATE(created_at) as data
FROM security_logs
WHERE type = 'data_access'
AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY type, action, DATE(created_at)
ORDER BY data DESC;
```

### Relatório de Segurança

```sql
-- Relatório de atividades de segurança
SELECT
  u.email,
  sl.type,
  sl.action,
  sl.success,
  sl.created_at,
  sl.ip_address
FROM security_logs sl
JOIN users u ON sl.user_id = u.id
WHERE sl.created_at >= NOW() - INTERVAL '7 days'
ORDER BY sl.created_at DESC
LIMIT 100;
```

---

## ⚠️ Alertas Críticos

### Configurações que DEVEM estar ativas:

1. **SSL Obrigatório**: `sslmode=require` na DATABASE_URL
2. **HTTPS Forçado**: `FORCE_HTTPS=true`
3. **Logs de Auditoria**: `ENABLE_AUDIT_LOGS=true`
4. **Headers de Segurança**: Implementados no `next.config.ts`
5. **Rate Limiting**: Configurado no BetterAuth

### Sinais de Configuração Incorreta:

- ❌ Conexões HTTP em produção
- ❌ Banco sem SSL
- ❌ Ausência de logs de auditoria
- ❌ Headers de segurança faltando
- ❌ Cookies inseguros

---

## 📞 Suporte LGPD

Para questões de conformidade:

- **DPO Email**: dpo@doutoragenda.com.br
- **Documentação**: [SECURITY_LGPD_SETUP.md](./SECURITY_LGPD_SETUP.md)
- **Relatórios**: Disponíveis em `/configurations/security-logs`

---

**🔒 Lembre-se**: A conformidade LGPD é obrigatória e a não implementação pode resultar em multas significativas. Todas as configurações acima são essenciais para proteção de dados pessoais.
