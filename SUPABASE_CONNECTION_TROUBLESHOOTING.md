# Supabase Connection Troubleshooting

## Problema Identificado

❌ **ERRO**: `ENOTFOUND db.elwtcyulkwjfmugrealq.supabase.co`

Este erro indica que o DNS não consegue resolver o hostname do Supabase, o que geralmente significa que o projeto está **pausado** ou **inativo**.

## Causa Mais Provável

### 🟡 Projeto Supabase Pausado/Inativo

Os projetos Supabase gratuitos são pausados automaticamente após períodos de inatividade. Isso é comum e facilmente resolvível.

## Soluções

### Solução 1: Reativar Projeto Supabase (RECOMENDADO)

1. **Acesse o Dashboard do Supabase**:

   - Vá para https://app.supabase.com
   - Faça login na sua conta

2. **Localize seu projeto**:

   - Procure pelo projeto `elwtcyulkwjfmugrealq`
   - Ele deve estar marcado como "Paused" ou "Inactive"

3. **Reative o projeto**:

   - Clique no projeto
   - Clique em "Resume" ou "Unpause"
   - Aguarde alguns minutos para a reativação completa

4. **Verifique a conexão**:
   - Acesse `/api/debug-db` para verificar se a conexão foi restabelecida

### Solução 2: Verificar Status do Projeto

Se o projeto não aparece como pausado:

1. **Verifique as configurações do banco**:

   - Vá em "Settings" > "Database"
   - Confirme se a string de conexão está correta

2. **Teste a conectividade**:
   - Use um cliente SQL externo (pgAdmin, DBeaver)
   - Tente conectar com as mesmas credenciais

### Solução 3: Criar Novo Projeto (se necessário)

Se o projeto foi deletado ou não pode ser recuperado:

1. **Crie um novo projeto Supabase**
2. **Execute as migrações do banco**:
   ```bash
   npm run db:push
   ```
3. **Atualize a variável `DATABASE_URL`** no arquivo `.env` com a nova URL

## Verificação Pós-Solução

Após resolver o problema, verifique:

1. **Teste de Conectividade**:

   ```bash
   curl https://med.novocode.com.br/api/debug-db
   ```

2. **Teste de Autenticação**:

   ```bash
   curl https://med.novocode.com.br/api/debug-auth
   ```

3. **Health Check**:
   ```bash
   curl https://med.novocode.com.br/api/health
   ```

## Prevenção

### Manter Projeto Ativo

Para evitar que o projeto seja pausado novamente:

1. **Configure um ping automatizado**:

   - Use cron jobs ou serviços como UptimeRobot
   - Acesse a aplicação regularmente

2. **Considere upgrade para plano pago**:
   - Projetos pagos não são pausados automaticamente
   - Oferecem melhor estabilidade e performance

### Monitoramento

Configure alertas para detectar problemas precocemente:

1. **Health Check Endpoint**: `/api/health`
2. **Database Debug**: `/api/debug-db`
3. **Auth Debug**: `/api/debug-auth`

## Informações Técnicas

- **Hostname atual**: `db.elwtcyulkwjfmugrealq.supabase.co`
- **Projeto ID**: `elwtcyulkwjfmugrealq`
- **Região**: Não especificada (provavelmente us-east-1)
- **Pool Status**: 0 conexões ativas (indicativo de projeto pausado)

## Próximos Passos

1. ✅ **IMEDIATO**: Reativar projeto no dashboard Supabase
2. ✅ **VERIFICAR**: Testar endpoints de debug após reativação
3. ✅ **CONFIGURAR**: Monitoramento para evitar pausas futuras
4. ✅ **CONSIDERAR**: Upgrade para plano pago se necessário

---

**Status**: 🔄 Aguardando reativação do projeto Supabase  
**Última atualização**: 04/06/2025  
**Prioridade**: ALTA (aplicação inoperante)
