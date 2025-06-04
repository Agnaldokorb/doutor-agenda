# 🚀 Guia Completo - Deploy na Vercel

## NovoCod Med - med.novocode.com.br

Este guia contém todas as instruções para fazer o deploy do **NovoCod Med** na Vercel usando o domínio `med.novocode.com.br`.

---

## 📋 **Pré-requisitos**

✅ Conta na [Vercel](https://vercel.com)  
✅ Repositório no GitHub configurado  
✅ Banco PostgreSQL em produção (recomendado: [Neon](https://neon.tech) ou [Supabase](https://supabase.com))  
✅ Conta no [Resend](https://resend.com) para emails  
✅ Domínio `med.novocode.com.br` configurado

---

## 🗄️ **1. Configurar Banco de Dados**

### **Opção A: Neon (Recomendado)**

1. Acesse [neon.tech](https://neon.tech) e crie uma conta
2. **Crie um novo projeto** PostgreSQL
3. **Copie a connection string** que aparece
4. Exemplo: `postgresql://usuario:senha@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require`

### **Opção B: Supabase**

1. Acesse [supabase.com](https://supabase.com) e crie projeto
2. Vá em **Settings > Database**
3. **Copie a URI** da connection string

---

## 📧 **2. Configurar Resend para Produção**

### **Setup do Domínio**

1. **Login no Resend** → Dashboard
2. **Domains** → Add Domain
3. **Digite**: `med.novocode.com.br`
4. **Configure os registros DNS**:

```dns
Tipo: MX
Nome: @
Valor: feedback-smtp.us-east-1.amazonses.com
Prioridade: 10

Tipo: TXT
Nome: @
Valor: "v=spf1 include:amazonses.com ~all"

Tipo: TXT
Nome: _dmarc
Valor: "v=DMARC1; p=quarantine; rua=mailto:dmarc@med.novocode.com.br"

Tipo: CNAME
Nome: resend._domainkey
Valor: resend._domainkey.amazonses.com
```

5. **Aguarde verificação** (até 24h)
6. **Crie API Key** para produção

---

## 🚀 **3. Deploy na Vercel**

### **Conectar Repositório**

1. **Login na Vercel** → [vercel.com](https://vercel.com)
2. **Import Project** → Conecte com GitHub
3. **Selecione** o repositório do NovoCod Med
4. **Configure**:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./`
   - **Build Command**: `npm run build` (padrão)

### **⚠️ CONFIGURAÇÃO CRÍTICA: Variáveis de Ambiente**

Na Vercel, vá em **Settings** → **Environment Variables** e adicione **EXATAMENTE** estas variáveis:

```env
# 🔐 AUTENTICAÇÃO - ATENÇÃO: Use BETTER_AUTH_SECRET!
BETTER_AUTH_SECRET=sua-chave-secreta-256-bits-aqui
BETTER_AUTH_URL=https://med.novocode.com.br

# 🗄️ BANCO DE DADOS
DATABASE_URL=postgresql://usuario:senha@host:5432/db?sslmode=require

# 📧 EMAIL
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@med.novocode.com.br
RESEND_FROM_NAME=NovoCod Med

# 📁 UPLOADS
UPLOADTHING_SECRET=sk_live_xxxxxxxxxxxxxxxxxxxxxxxxx
UPLOADTHING_APP_ID=xxxxxxxxxxxxxxxx

# 🔒 SEGURANÇA
DPO_EMAIL=dpo@med.novocode.com.br
SECURITY_ENCRYPTION_KEY=sua-chave-de-criptografia

# 🌍 GERAL
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://med.novocode.com.br
```

### **🚨 ATENÇÃO: Problema Comum - Auth Secret**

**PROBLEMA**: Erro `{error: {...}, input: {...}}` ao criar conta

**CAUSA**: BetterAuth espera `BETTER_AUTH_SECRET` mas muitos guias usam `AUTH_SECRET`

**SOLUÇÃO**: Use `BETTER_AUTH_SECRET` (não `AUTH_SECRET`)

### **Fazer Deploy**

1. **Clique em Deploy**
2. **Aguarde** o build completar
3. **Acesse** o domínio temporário gerado

---

## 🐛 **4. Debug de Problemas**

### **Se der erro ao criar conta:**

1. **Acesse**: `https://seu-dominio.vercel.app/debug-auth.html`
2. **Teste** cada etapa:
   - Health Check
   - Conexão com Banco
   - Criação de Usuário
3. **Verifique logs** no dashboard da Vercel

### **Comandos de Debug:**

```bash
# Verificar variáveis na Vercel
vercel env ls

# Ver logs em tempo real
vercel logs

# Build local para testar
npm run build
```

---

## 🌐 **5. Configurar Domínio Customizado**

### **Na Vercel**

1. **Settings** → **Domains**
2. **Add Domain** → `med.novocode.com.br`
3. **Configure** os registros DNS:

```dns
Tipo: A
Nome: @
Valor: 76.76.19.61

Tipo: CNAME
Nome: www
Valor: cname.vercel-dns.com
```

### **Aguardar Propagação**

- DNS pode levar até 24h para propagar
- Use [dnschecker.org](https://dnschecker.org) para verificar

---

## 🗄️ **6. Configurar Banco em Produção**

### **Executar Migrations**

1. **Connect ao banco** de produção localmente:

```bash
# Adicione temporariamente a DATABASE_URL no .env.local
DATABASE_URL="sua-url-de-producao"

# Execute as migrations
npx drizzle-kit push
```

2. **Criar usuário admin inicial**:

```bash
# Use o debug para criar primeiro usuário
# Acesse: https://seu-dominio/debug-auth.html
```

### **Verificar Estrutura**

Certifique-se que todas as tabelas foram criadas:

- `users`
- `clinics`
- `doctors`
- `patients`
- `appointments`
- `medical_records`
- `security_configurations`
- `security_logs`

---

## 🔒 **7. Configurações de Segurança**

### **Headers de Segurança** ✅

Já configurados no `vercel.json`:

- X-Content-Type-Options
- X-Frame-Options
- X-XSS-Protection
- Referrer-Policy

### **HTTPS** ✅

Automático com Vercel + domínio customizado

### **LGPD Compliance** ✅

- DPO configurado: `dpo@med.novocode.com.br`
- Política de privacidade atualizada
- Logs de auditoria funcionando

---

## 📧 **8. Testar Sistema em Produção**

### **Checklist de Testes**

1. ✅ **Health Check**: `/api/health`
2. ✅ **Banco**: `/api/debug-db`
3. ✅ **Criação conta**: `/debug-auth.html`
4. ✅ **Login** funcionando
5. ✅ **Envio de emails** (teste)
6. ✅ **Upload** de arquivos
7. ✅ **Criação** de agendamentos
8. ✅ **Backup** e restore
9. ✅ **Segurança** (logs)

### **URLs de Debug**

```bash
# Health check da API
https://med.novocode.com.br/api/health

# Teste de banco
https://med.novocode.com.br/api/debug-db

# Debug completo
https://med.novocode.com.br/debug-auth.html

# Testar emails
curl -X POST https://med.novocode.com.br/api/email/test \
  -H "Content-Type: application/json" \
  -d '{"type":"connection","email":"seu-email@exemplo.com"}'
```

---

## 🔧 **9. Monitoramento**

### **Logs da Vercel**

- **Functions** → Ver logs em tempo real
- **Monitoring** → Métricas de performance
- **Analytics** → Estatísticas de uso

### **Alertas de Email**

Configure alertas para:

- Falhas de build
- Errors 500+
- Timeouts de função

---

## 🆘 **10. Troubleshooting**

### **❌ Erro: Auth Secret**

```
{error: {...}, input: {...}}
```

**Solução**:

- Verificar se `BETTER_AUTH_SECRET` está configurada
- Não usar `AUTH_SECRET` (variável antiga)
- Usar string de 256+ bits

### **❌ Build Falhando**

```bash
# Verificar localmente
npm run build

# Ver detalhes do erro na Vercel
vercel logs
```

### **❌ Banco não Conecta**

- ✅ Verificar URL de conexão
- ✅ SSL habilitado (`?sslmode=require`)
- ✅ Firewall liberado para IPs da Vercel

### **❌ Emails não Enviam**

- ✅ Domínio verificado no Resend
- ✅ API Key válida
- ✅ DNS configurado corretamente

### **❌ Função Timeout**

```json
// vercel.json
{
  "functions": {
    "src/app/api/auth/[...all]/route.ts": {
      "maxDuration": 30
    }
  }
}
```

---

## ✅ **11. Deploy Concluído**

Após seguir todos os passos:

🎉 **Sistema NovoCod Med** rodando em: `https://med.novocode.com.br`  
📧 **Emails** funcionando via Resend  
🗄️ **Banco** PostgreSQL em produção  
🔒 **Segurança** LGPD compliant  
📊 **Monitoramento** ativo

### **Próximos Passos**

1. **Treinamento** da equipe
2. **Backup** inicial dos dados
3. **Configuração** da clínica principal
4. **Marketing** e divulgação

---

## 🚨 **PROBLEMAS COMUNS E SOLUÇÕES**

| Problema                       | Causa                                        | Solução                        |
| ------------------------------ | -------------------------------------------- | ------------------------------ |
| `{error: {...}, input: {...}}` | `AUTH_SECRET` em vez de `BETTER_AUTH_SECRET` | Usar `BETTER_AUTH_SECRET`      |
| Build falha                    | Erro de TypeScript                           | `npm run build` local primeiro |
| Email não envia                | Domínio não verificado                       | Verificar domínio no Resend    |
| Banco não conecta              | SSL ou URL incorreta                         | Verificar `?sslmode=require`   |
| 404 no domínio                 | DNS não propagou                             | Aguardar propagação DNS        |
| Função timeout                 | Sem configuração                             | Verificar `vercel.json`        |

---

## 📞 **Suporte**

**Problemas técnicos:**

- Vercel: [vercel.com/support](https://vercel.com/support)
- Resend: [resend.com/support](https://resend.com/support)
- Debug: `https://seu-dominio/debug-auth.html`

**Dúvidas sobre LGPD:**

- DPO: `dpo@med.novocode.com.br`

---

**🚀 NovoCod Med - Sistema de Gestão Médica**  
**🌐 https://med.novocode.com.br**  
**🔧 Debug: https://med.novocode.com.br/debug-auth.html**
