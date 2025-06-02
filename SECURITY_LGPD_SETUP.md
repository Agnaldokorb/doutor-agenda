# 🔒 Configuração de Segurança e Conformidade LGPD

## Doutor Agenda - Guia de Implementação Segura

### 📋 Visão Geral

Este documento descreve as configurações de segurança implementadas para garantir que todos os dados transitem criptografados e em conformidade com a Lei Geral de Proteção de Dados Pessoais (LGPD).

---

## 🔐 Configurações de Banco de Dados

### 1. String de Conexão SSL Obrigatória

Para produção, configure a `DATABASE_URL` com SSL obrigatório:

```bash
# ✅ CORRETO - Com SSL obrigatório para produção
DATABASE_URL="postgresql://usuario:senha@host:5432/database?sslmode=require&sslcert=cliente-cert.pem&sslkey=cliente-key.pem&sslrootcert=ca-cert.pem"

# Ou para provedores de nuvem:
DATABASE_URL="postgresql://usuario:senha@host:5432/database?sslmode=require"
```

### 2. Configurações de Segurança de Conexão

O sistema implementa:

- ✅ SSL/TLS obrigatório em produção
- ✅ Pool de conexões limitado (máx. 20)
- ✅ Timeout de conexão (10s)
- ✅ Timeout de idle (30s)

---

## 🌐 Headers de Segurança HTTP

### Headers Implementados

Todos os headers necessários para conformidade LGPD:

```javascript
// Headers de segurança obrigatórios
"X-Content-Type-Options": "nosniff"
"X-Frame-Options": "DENY"
"X-XSS-Protection": "1; mode=block"
"Referrer-Policy": "strict-origin-when-cross-origin"
"Permissions-Policy": "camera=(), microphone=(), geolocation=()"
"Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload"

// CSP rigoroso
"Content-Security-Policy": [políticas detalhadas de segurança]
```

### Cache de Dados Sensíveis

Para rotas com dados pessoais (`/patients`, `/appointments`, `/medical-records`):

```javascript
"Cache-Control": "no-store, no-cache, must-revalidate, private"
"Pragma": "no-cache"
"Expires": "0"
```

---

## 🔍 Sistema de Auditoria LGPD

### Logs Obrigatórios Implementados

Conforme Art. 37 da LGPD, todos os acessos são registrados:

1. **Acesso a Dados Pessoais**

   - Visualização de pacientes
   - Acesso a prontuários
   - Consulta de agendamentos

2. **Operações de Dados**

   - Criação de registros
   - Alterações de dados
   - Exclusões (soft delete)

3. **Configurações de Segurança**
   - Alterações de configuração
   - Mudanças de permissões
   - Alterações de senha

### Exemplo de Log de Auditoria

```json
{
  "userId": "user_123",
  "clinicId": "clinic_456",
  "action": "visualizar patient",
  "type": "data_access",
  "details": {
    "dataType": "patient",
    "recordId": "patient_789",
    "timestamp": "2024-01-15T10:30:00Z"
  },
  "success": true,
  "ipAddress": "192.168.1.100",
  "userAgent": "Mozilla/5.0..."
}
```

---

## 🔐 Configurações de Autenticação

### Cookies Seguros

```javascript
session: {
  cookieOptions: {
    httpOnly: true,              // Previne acesso via JavaScript
    secure: true,                // HTTPS obrigatório em produção
    sameSite: "lax",            // Proteção CSRF
    path: "/",                   // Escopo limitado
  }
}
```

### Rate Limiting

- ✅ Máximo 10 tentativas por minuto
- ✅ Proteção contra ataques de força bruta
- ✅ CSRF tokens obrigatórios

---

## 📊 Conformidade LGPD - Checklist

### ✅ Implementado

- [x] **Criptografia em trânsito** (HTTPS obrigatório)
- [x] **Criptografia em repouso** (SSL banco de dados)
- [x] **Logs de auditoria** (Art. 37 LGPD)
- [x] **Headers de segurança** (CSP, HSTS, etc.)
- [x] **Sanitização de logs** (dados sensíveis removidos)
- [x] **Política de privacidade** (implementada)
- [x] **Controle de acesso** (autenticação/autorização)
- [x] **Timeout de sessão** (configurável)
- [x] **Rate limiting** (proteção contra ataques)

### 🔄 Recomendações Adicionais

1. **Certificado SSL**

   ```bash
   # Verificar se HTTPS está ativo
   curl -I https://seudominio.com
   ```

2. **Backup Seguro**

   ```bash
   # Backups criptografados
   pg_dump --host=host --encrypt --output=backup.enc database
   ```

3. **Monitoramento**
   - Logs de segurança em tempo real
   - Alertas para acessos suspeitos
   - Monitoramento de conformidade

---

## 🚀 Deploy em Produção

### Variáveis de Ambiente Obrigatórias

```bash
# Base
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://seudominio.com

# Banco com SSL
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require

# Auth seguro
GOOGLE_CLIENT_ID=seu_client_id
GOOGLE_CLIENT_SECRET=seu_client_secret

# Email
SENDGRID_API_KEY=sua_chave_sendgrid
SENDGRID_FROM_EMAIL=noreply@seudominio.com
```

### Verificação de Segurança

```bash
# 1. Verificar SSL do banco
psql $DATABASE_URL -c "SHOW ssl;"

# 2. Verificar headers de segurança
curl -I https://seudominio.com

# 3. Teste de penetração básico
nmap -sV --script ssl-enum-ciphers seudominio.com
```

---

## 📞 Contato DPO (Data Protection Officer)

Para questões relacionadas à LGPD:

- **Email:** dpo@doutoragenda.com.br
- **Responsável:** Encarregado de Dados
- **Disponibilidade:** 24/7 para questões urgentes

---

## 📄 Documentação Legal

- [Política de Privacidade](/privacy-policy)
- [Termos de Uso](/terms-of-service)
- [Relatório de Conformidade LGPD](/lgpd-compliance)

---

**⚠️ IMPORTANTE:**
Todas as configurações acima são obrigatórias para compliance LGPD. A não implementação pode resultar em multas de até 2% do faturamento anual da empresa.
