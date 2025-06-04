# ✅ Checklist Deploy - NovoCod Med

## 🌐 Domínio: med.novocode.com.br

### **🚀 ANTES DO DEPLOY**

- [ ] ✅ **Build local funcionando** (`npm run build`)
- [ ] ✅ **Repositório no GitHub** atualizado
- [ ] ✅ **Conta Vercel** configurada

### **🗄️ BANCO DE DADOS**

- [ ] **Criar banco PostgreSQL**
  - [ ] [Neon.tech](https://neon.tech) (recomendado)
  - [ ] [Supabase](https://supabase.com) (alternativa)
- [ ] **Copiar connection string**
- [ ] **Testar conexão**

### **📧 RESEND EMAIL**

- [ ] **Conta Resend** criada
- [ ] **Domínio adicionado**: `med.novocode.com.br`
- [ ] **DNS configurado**:
  ```dns
  MX    @                  feedback-smtp.us-east-1.amazonses.com  10
  TXT   @                  "v=spf1 include:amazonses.com ~all"
  TXT   _dmarc             "v=DMARC1; p=quarantine; rua=mailto:dmarc@med.novocode.com.br"
  CNAME resend._domainkey  resend._domainkey.amazonses.com
  ```
- [ ] **API Key gerada**
- [ ] **Domínio verificado**

### **🚀 VERCEL DEPLOY**

- [ ] **Conectar repositório** no Vercel
- [ ] **Configurar variáveis de ambiente**:
  ```env
  BETTER_AUTH_SECRET=sua-chave-256-bits
  BETTER_AUTH_URL=https://med.novocode.com.br
  DATABASE_URL=postgresql://...
  RESEND_API_KEY=re_xxxxx
  RESEND_FROM_EMAIL=noreply@med.novocode.com.br
  RESEND_FROM_NAME=NovoCod Med
  UPLOADTHING_SECRET=sk_live_xxxxx
  UPLOADTHING_APP_ID=xxxxxxxx
  DPO_EMAIL=dpo@med.novocode.com.br
  NODE_ENV=production
  NEXT_PUBLIC_APP_URL=https://med.novocode.com.br
  ```
- [ ] **Deploy inicial**
- [ ] **Verificar build** sem erros

### **🌐 DOMÍNIO PERSONALIZADO**

- [ ] **Adicionar domínio** na Vercel: `med.novocode.com.br`
- [ ] **Configurar DNS**:
  ```dns
  A     @    76.76.19.61
  CNAME www  cname.vercel-dns.com
  ```
- [ ] **Aguardar propagação** (até 24h)
- [ ] **Verificar HTTPS** automático

### **🗄️ BANCO EM PRODUÇÃO**

- [ ] **Executar migrations**:
  ```bash
  # Local, com DATABASE_URL de produção temporária
  npx drizzle-kit push
  ```
- [ ] **Verificar todas as tabelas** criadas
- [ ] **Criar usuário admin inicial**

### **🧪 TESTES EM PRODUÇÃO**

- [ ] **Acesso ao site**: `https://med.novocode.com.br`
- [ ] **Login** funcionando
- [ ] **Cadastro** de clínica
- [ ] **Teste de email**:
  ```bash
  curl -X POST https://med.novocode.com.br/api/email/test \
    -H "Content-Type: application/json" \
    -d '{"type":"connection","email":"seu@email.com"}'
  ```
- [ ] **Upload** de arquivos
- [ ] **Criação** de agendamento
- [ ] **Logs** de segurança

### **🔒 SEGURANÇA FINAL**

- [ ] **Headers** configurados (vercel.json ✅)
- [ ] **HTTPS** ativo
- [ ] **Política privacidade** atualizada
- [ ] **DPO** configurado: `dpo@med.novocode.com.br`

### **📊 MONITORAMENTO**

- [ ] **Logs Vercel** funcionando
- [ ] **Métricas** de performance
- [ ] **Alertas** configurados

---

## 🎯 **COMANDOS RÁPIDOS**

### **Verificar Build Local**

```bash
npm run build
```

### **Testar Email**

```bash
curl -X POST https://med.novocode.com.br/api/email/test \
  -H "Content-Type: application/json" \
  -d '{"type":"connection","email":"teste@exemplo.com"}'
```

### **Verificar DNS**

```bash
nslookup med.novocode.com.br
```

---

## 🚨 **PROBLEMAS COMUNS**

| Problema          | Solução                               |
| ----------------- | ------------------------------------- |
| Build falha       | `npm run build` local primeiro        |
| Email não envia   | Verificar domínio no Resend           |
| Banco não conecta | Verificar DATABASE_URL                |
| 404 no domínio    | Aguardar propagação DNS               |
| Função timeout    | Verificar configuração no vercel.json |

---

## ✅ **DEPLOY CONCLUÍDO**

🎉 **Sistema rodando em**: https://med.novocode.com.br  
📧 **Emails funcionando** via Resend  
🗄️ **Banco** PostgreSQL ativo  
🔒 **Segurança** LGPD compliant  
📱 **Pronto para uso!**

---

**📞 Suporte:**

- **DPO**: dpo@med.novocode.com.br
- **Técnico**: [GitHub Issues](https://github.com/seu-repo/issues)
