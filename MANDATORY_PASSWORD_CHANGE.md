# Alteração Obrigatória de Senha para Médicos

## Visão Geral

Esta funcionalidade implementa uma regra de segurança que obriga médicos a alterarem sua senha no primeiro login ou quando determinado pelo administrador.

## Como Funciona

### 1. Criação de Novos Médicos

- Quando um novo médico é criado, o campo `mustChangePassword` é automaticamente definido como `true`
- A senha padrão é `123456789`
- O médico será redirecionado para a página de alteração de senha no primeiro login

### 2. Middleware de Segurança

- O middleware verifica se o usuário precisa alterar a senha antes de acessar qualquer página protegida
- Se `mustChangePassword = true`, redireciona automaticamente para `/change-password`
- Após alterar a senha, o campo é definido como `false` e o usuário pode acessar o sistema normalmente

### 3. Layouts Específicos

- **Layout Protegido**: Verifica autenticação básica
- **Layout do Médico**: Verifica se é médico E se precisa alterar senha
- **Página de Alteração**: Interface dedicada para alteração obrigatória

## Arquivos Modificados

### Schema do Banco

- `src/db/schema.ts`: Adicionado campo `mustChangePassword` na tabela `users`

### Actions

- `src/actions/change-password/index.ts`: Action para alterar senha e marcar como não obrigatória
- `src/actions/upsert-doctor/index.ts`: Marca novos médicos com `mustChangePassword = true`

### Componentes

- `src/app/(protected)/change-password/_components/change-password-form.tsx`: Formulário de alteração
- `src/app/(protected)/change-password/page.tsx`: Página dedicada

### Middleware

- `middleware.ts`: Verificação automática e redirecionamento

### Layouts

- `src/app/(protected)/layout.tsx`: Layout base protegido
- `src/app/(doctor)/layout.tsx`: Layout específico para médicos

## Fluxo de Uso

1. **Admin cria médico** → `mustChangePassword = true`
2. **Médico faz login** → Middleware detecta e redireciona para `/change-password`
3. **Médico altera senha** → `mustChangePassword = false`
4. **Médico é redirecionado** → Acesso normal ao sistema

## Segurança

- Senhas são criptografadas com bcrypt (salt rounds: 10)
- Validação de senha atual obrigatória
- Confirmação de nova senha obrigatória
- Mínimo de 6 caracteres para nova senha
- Redirecionamento automático impede bypass

## Script de Migração

Para médicos existentes, execute:

```bash
node scripts/update-existing-doctors.js
```

Este script marca todos os médicos existentes para alteração obrigatória de senha.

## Interface do Usuário

- Design responsivo com tema laranja/vermelho para indicar urgência
- Campos de senha com toggle de visibilidade
- Feedback visual durante o processo
- Mensagens de erro claras
- Informações contextuais sobre primeira vez no sistema

## Configurações

- Senha padrão: `123456789`
- Redirecionamento automático após alteração
- Validação em tempo real
- Prevenção de acesso sem alteração de senha
