# 🚀 Guia de Configuração - Resend (Substituto do SMTP)

O Resend é uma biblioteca moderna de email que resolve os problemas complexos do SMTP tradicional. É mais confiável, mais fácil de configurar e tem melhor entregabilidade.

## 📋 **Por que Migrar do SMTP para Resend?**

### ❌ **Problemas com SMTP Tradicional:**

- Erros de autenticação complexos (535 5.7.8)
- Configurações diferentes para cada provedor
- Problemas de firewall e TLS
- Senhas de aplicativo complicadas
- Rate limiting inconsistente

### ✅ **Vantagens do Resend:**

- **Zero configuração SMTP** - API HTTP simples
- **Entrega garantida** - 99%+ de entregabilidade
- **Setup em 2 minutos** - Apenas uma API key
- **Templates nativos** - HTML responsivo
- **Logs detalhados** - Rastreamento completo
- **Preço justo** - 100 emails/dia grátis

## 🔧 **Setup Passo a Passo**

### **1. Criar Conta no Resend**

1. Acesse: https://resend.com
2. **Clique em "Get Started"**
3. **Registre-se** com seu email
4. **Confirme** o email de verificação

### **2. Configurar Domínio (Recomendado)**

Para melhor entregabilidade, configure seu próprio domínio:

1. **No dashboard do Resend**, vá em "Domains"
2. **Clique em "Add Domain"**
3. **Digite seu domínio** (ex: `clinica.com`)
4. **Adicione os registros DNS** que aparecem:

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
Valor: "v=DMARC1; p=quarantine; rua=mailto:dmarc@seudominio.com"
```

5. **Aguarde verificação** (pode levar até 24h)

### **3. Gerar API Key**

1. **No dashboard**, vá em "API Keys"
2. **Clique em "Create API Key"**
3. **Digite um nome** (ex: "NovoCod Med Production")
4. **Selecione permissões**: "Send emails"
5. **Copie a API key** (começa com `re_`)

⚠️ **IMPORTANTE**: Guarde a API key em local seguro, ela só aparece uma vez!

### **4. Configurar Variáveis de Ambiente**

Adicione no seu `.env.local`:

```env
# Email - Resend
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
RESEND_FROM_EMAIL="noreply@med.novocode.com.br"
RESEND_FROM_NAME="NovoCod Med"
```

**Valores recomendados:**

- `RESEND_FROM_EMAIL`: Use `noreply@seudominio.com` (ou `onboarding@resend.dev` para teste)
- `RESEND_FROM_NAME`: Nome amigável da sua clínica

### **5. Testar Configuração**

1. **Reinicie o servidor** de desenvolvimento
2. **Acesse**: Configurações → Notificações
3. **Clique em "Testar Email"**
4. **Digite seu email** e selecione "connection"
5. **Verifique** se recebe "✅ Sucesso!"

## 📧 **Configurações de Email**

### **Para Teste (Domínio Resend):**

```env
RESEND_FROM_EMAIL="onboarding@resend.dev"
RESEND_FROM_NAME="NovoCod Med"
```

### **Para Produção (Seu Domínio):**

```env
RESEND_FROM_EMAIL="noreply@med.novocode.com.br"
RESEND_FROM_NAME="NovoCod Med"
```

## 🏷️ **Preços do Resend**

| Plano        | Emails/mês | Preço   | Ideal para               |
| ------------ | ---------- | ------- | ------------------------ |
| **Free**     | 3.000      | Grátis  | Testes e desenvolvimento |
| **Pro**      | 50.000     | $20/mês | Pequenas clínicas        |
| **Business** | 100.000    | $80/mês | Clínicas médias          |

💡 **Cálculo**: Uma clínica com 100 pacientes/mês enviando 3 emails cada = 300 emails/mês (Free é suficiente!)

## 🚫 **Remoção do SMTP Antigo (Opcional)**

Se o Resend estiver funcionando bem, você pode remover as configurações SMTP:

### **1. Remover Variáveis de Ambiente:**

```env
# Pode remover essas linhas do .env.local:
# SMTP_HOST=
# SMTP_PORT=
# SMTP_USER=
# SMTP_PASS=
# SMTP_ENCRYPTION_KEY=
```

### **2. Remover Dependências (Opcional):**

```bash
npm uninstall nodemailer
npm uninstall @types/nodemailer
```

### **3. Arquivar Arquivos Antigos:**

```bash
# Mover arquivos antigos para pasta de backup
mkdir src/lib/legacy-smtp
mv src/lib/smtp-service.ts src/lib/legacy-smtp/
mv src/lib/crypto.ts src/lib/legacy-smtp/
```

## 🔧 **Troubleshooting**

### **Erro: "RESEND_API_KEY é obrigatória"**

- ✅ Verifique se a variável está no `.env.local`
- ✅ Reinicie o servidor após adicionar a variável
- ✅ Certifique-se que a API key começa com `re_`

### **Erro: "Email não autorizado"**

- ✅ Use `onboarding@resend.dev` para testes
- ✅ Para produção, configure e verifique seu domínio
- ✅ Aguarde até 24h após configurar DNS

### **Emails não chegam:**

- ✅ Verifique a pasta de spam
- ✅ Confirme se o domínio está verificado
- ✅ Veja os logs no dashboard do Resend

### **Rate Limit:**

- ✅ Free: 100 emails/dia, 1 email/segundo
- ✅ Aguarde ou faça upgrade do plano
- ✅ Implemente delay entre emails se necessário

## 📊 **Monitoramento**

### **Dashboard do Resend:**

- **Emails enviados** em tempo real
- **Bounces e reclamações**
- **Logs detalhados** de cada email
- **Estatísticas** de entrega

### **Logs da Aplicação:**

```
✅ Serviço Resend inicializado com sucesso
📧 Enviando email via Resend para: paciente@email.com
✅ Email enviado com sucesso via Resend!
📬 Email ID: re_xxxxxxxxx
```

## 🆘 **Suporte**

- **Documentação oficial**: https://resend.com/docs
- **Discord da comunidade**: https://discord.gg/resend
- **Email de suporte**: support@resend.com

---

## ✅ **Migração Completa**

Após configurar o Resend:

1. ✅ **Instalar**: `npm install resend` ✓
2. ✅ **Configurar variáveis** de ambiente ✓
3. ✅ **Testar** envio de email ✓
4. ✅ **Verificar** logs de sucesso ✓
5. ✅ **Remover** configurações SMTP antigas (opcional)

**🎉 Parabéns! Você migrou com sucesso do SMTP problemático para o Resend!**
