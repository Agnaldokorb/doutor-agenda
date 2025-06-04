# Troubleshooting SSL - Banco de Dados PostgreSQL

## ✅ Problema Resolvido: "self-signed certificate in certificate chain"

Este erro ocorria quando o banco PostgreSQL estava configurado para usar SSL, mas o Node.js não confiava nos certificados utilizados.

## Solução Implementada

### Configuração SSL Automática e Simplificada

O arquivo `src/db/index.ts` agora usa uma lógica simplificada que funciona para todos os cenários:

```typescript
function getSSLConfig() {
  const databaseUrl = process.env.DATABASE_URL!;

  // Se estiver em produção, sempre usar SSL seguro
  if (process.env.NODE_ENV === "production") {
    return {
      rejectUnauthorized: true,
      require: true,
    };
  }

  // Em desenvolvimento, sempre aceitar certificados auto-assinados se SSL for necessário
  if (databaseUrl.includes("://") && !databaseUrl.includes("localhost")) {
    return {
      rejectUnauthorized: false, // Aceita certificados auto-assinados
      require: true,
    };
  }

  // Para localhost em desenvolvimento, SSL desabilitado
  return false;
}
```

### ✅ Como Funciona

- **Produção**: SSL seguro obrigatório com verificação de certificados
- **Desenvolvimento + Banco Remoto**: SSL com certificados auto-assinados aceitos
- **Desenvolvimento + Localhost**: SSL desabilitado

### URLs de Conexão Suportadas

**✅ Desenvolvimento Local (sem SSL):**

```
DATABASE_URL=postgresql://user:password@localhost:5432/database
```

**✅ Neon.tech (com SSL auto-assinado):**

```
DATABASE_URL=postgresql://user:password@host.neon.tech:5432/database?sslmode=require
```

**✅ Supabase (com SSL auto-assinado):**

```
DATABASE_URL=postgresql://user:password@host.supabase.co:5432/database?sslmode=require
```

**✅ AWS RDS (com SSL auto-assinado):**

```
DATABASE_URL=postgresql://user:password@host.amazonaws.com:5432/database?sslmode=require
```

**✅ Qualquer banco remoto em desenvolvimento:**

```
DATABASE_URL=postgresql://user:password@qualquer-host.com:5432/database
```

## Status Atual

✅ **Servidor funcionando perfeitamente**  
✅ **Página de autenticação carregando sem erros**  
✅ **Banco de dados conectado com SSL adequado**  
✅ **BetterAuth funcionando corretamente**

## Comandos Úteis

```bash
# Testar se o servidor está funcionando
Invoke-WebRequest -Uri "http://localhost:3000/api/health" -Method GET

# Testar página de autenticação
Invoke-WebRequest -Uri "http://localhost:3000/authentication" -Method GET

# Reiniciar servidor após mudanças
npm run dev
```

## Troubleshooting Futuro

### Se o erro SSL voltar a aparecer:

1. **Verifique se a configuração foi mantida** em `src/db/index.ts`
2. **Confirme que está em desenvolvimento**: `NODE_ENV=development`
3. **Reinicie o servidor**: `npm run dev`

### Para outros erros de conexão:

**Erro: "connection terminated unexpectedly"**

- Verifique se o banco está rodando
- Confirme se a URL de conexão está correta
- Teste com `psql` diretamente

**Erro: "password authentication failed"**

- Verifique usuário e senha na DATABASE_URL
- Confirme se o usuário tem permissões necessárias

**Erro: "database does not exist"**

- Crie o banco: `createdb nome_do_banco`
- Execute as migrações: `npm run db:push`

## Segurança em Produção

⚠️ **IMPORTANTE**: Em produção, **NUNCA** use `rejectUnauthorized: false`. A configuração atual:

- ✅ Usa SSL seguro em produção (`NODE_ENV=production`)
- ✅ Aceita certificados auto-assinados apenas em desenvolvimento
- ✅ Mantém a segurança adequada para cada ambiente
