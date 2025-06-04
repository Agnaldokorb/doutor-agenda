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

### **Configurar Variáveis de Ambiente**

Na Vercel, vá em **Settings** → **Environment Variables** e adicione:

```env
# 🔐 AUTENTICAÇÃO
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

### **Fazer Deploy**

1. **Clique em Deploy**
2. **Aguarde** o build completar
3. **Acesse** o domínio temporário gerado

---

## 🌐 **4. Configurar Domínio Customizado**

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

## 🗄️ **5. Configurar Banco em Produção**

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
# Execute o script de criação de usuário
npm run create-admin
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

## 🔒 **6. Configurações de Segurança**

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

## 📧 **7. Testar Sistema em Produção**

### **Checklist de Testes**

1. ✅ **Login** funcionando
2. ✅ **Cadastro** de clínica
3. ✅ **Envio de emails** (teste)
4. ✅ **Upload** de arquivos
5. ✅ **Criação** de agendamentos
6. ✅ **Backup** e restore
7. ✅ **Segurança** (logs)

### **Comando de Teste**

```bash
# Testar emails em produção
curl -X POST https://med.novocode.com.br/api/email/test \
  -H "Content-Type: application/json" \
  -d '{"type":"connection","email":"seu-email@exemplo.com"}'
```

---

## 🔧 **8. Monitoramento**

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

## 🆘 **9. Troubleshooting**

### **Build Falhando**

```bash
# Verificar localmente
npm run build

# Ver detalhes do erro na Vercel
vercel logs
```

### **Banco não Conecta**

- ✅ Verificar URL de conexão
- ✅ SSL habilitado (`?sslmode=require`)
- ✅ Firewall liberado para IPs da Vercel

### **Emails não Enviam**

- ✅ Domínio verificado no Resend
- ✅ API Key válida
- ✅ DNS configurado corretamente

### **Variáveis de Ambiente**

```bash
# Verificar se estão configuradas
vercel env ls
```

---

## ✅ **10. Deploy Concluído**

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

## 📞 **Suporte**

**Problemas técnicos:**

- Vercel: [vercel.com/support](https://vercel.com/support)
- Resend: [resend.com/support](https://resend.com/support)

**Dúvidas sobre LGPD:**

- DPO: `dpo@med.novocode.com.br`

---

**🚀 NovoCod Med - Sistema de Gestão Médica**  
**🌐 https://med.novocode.com.br**
