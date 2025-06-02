# Implementação de Fuso Horário UTC-3 (Brasília)

## Resumo

Este documento descreve a implementação da conversão correta de fuso horário entre UTC (banco de dados) e UTC-3 (interface do usuário) no sistema de agendamentos médicos.

## Problema

O sistema estava salvando e exibindo horários inconsistentemente:

- **Banco de dados**: Armazenando em UTC
- **Interface**: Exibindo horários locais sem conversão adequada
- **Formulários**: Não convertendo adequadamente entre UTC-3 e UTC

## Solução Implementada

### 1. Arquivo Utilitário (`src/helpers/timezone.ts`)

Criado conjunto de funções para centralizar conversões:

```typescript
// Conversões básicas
convertUTCToUTCMinus3(utcDate: Date): Date
convertUTCMinus3ToUTC(localDate: Date): Date

// Formatações para exibição
formatUTCTimeToLocal(utcDate: Date): string
formatUTCDateOnly(utcDate: Date): string
extractTimeSlotFromUTCDate(utcDate: Date): string
```

### 2. Atualizações nos Componentes

#### API de Horários Ocupados (`src/app/api/appointments/booked-slots/route.ts`)

- ✅ Busca agendamentos usando range de datas UTC correto
- ✅ Converte horários UTC para UTC-3 na resposta

#### Action de Agendamento (`src/actions/upsert-appointment/index.ts`)

- ✅ Converte horário local (UTC-3) para UTC antes de salvar
- ✅ Usa funções utilitárias para conversão

#### Tabela de Agendamentos (`src/app/(protected)/appointments/_components/table-columns.tsx`)

- ✅ Exibe datas convertidas de UTC para UTC-3

#### Dashboard (`src/app/(protected)/dashboard/page.tsx`)

- ✅ Converte horários de agendamentos para exibição local

#### Formulário de Agendamento (`src/app/(protected)/appointments/_components/upsert-appointment-form.tsx`)

- ✅ Extrai horários de agendamentos existentes convertendo UTC para UTC-3
- ✅ Envia dados no formato correto (UTC-3) para a action

#### Dashboard do Médico (`src/app/(doctor)/doctor-dashboard/page.tsx`)

- ✅ Exibe horários convertidos para UTC-3

#### Páginas de Prontuário

- ✅ Formulário de prontuário médico exibe horários em UTC-3
- ✅ Página do paciente exibe horários de agendamentos em UTC-3

### 3. Fluxo de Dados

```
┌─────────────────┐    UTC-3 → UTC    ┌──────────────┐
│   Interface     │ ────────────────→ │ Banco de     │
│   (UTC-3)       │                   │ Dados (UTC)  │
│                 │ ←──────────────── │              │
└─────────────────┘    UTC → UTC-3    └──────────────┘
```

**Salvando:**

1. Usuário seleciona horário em UTC-3
2. Sistema converte para UTC
3. Salva no banco de dados

**Exibindo:**

1. Busca dados do banco (UTC)
2. Converte para UTC-3
3. Exibe para o usuário

### 4. Arquivos Modificados

```
src/
├── helpers/
│   └── timezone.ts (NOVO)
├── app/
│   ├── api/appointments/booked-slots/route.ts
│   ├── (protected)/
│   │   ├── appointments/_components/
│   │   │   ├── table-columns.tsx
│   │   │   └── upsert-appointment-form.tsx
│   │   └── dashboard/page.tsx
│   └── (doctor)/
│       ├── doctor-dashboard/page.tsx
│       └── patient/[patientId]/
│           ├── page.tsx
│           └── _components/upsert-medical-record-form.tsx
└── actions/
    └── upsert-appointment/index.ts
```

### 5. Benefícios

- ✅ **Consistência**: Todos os horários são exibidos no fuso correto (UTC-3)
- ✅ **Precisão**: Agendamentos são salvos corretamente em UTC
- ✅ **Manutenibilidade**: Funções utilitárias centralizadas
- ✅ **Escalabilidade**: Fácil adaptação para outros fusos horários

### 6. Testes Recomendados

1. **Criar agendamento**: Verificar se horário selecionado corresponde ao exibido
2. **Editar agendamento**: Verificar se horários carregam corretamente
3. **Visualizar agendamentos**: Verificar exibição em todas as telas
4. **Horários ocupados**: Verificar se API retorna horários corretos

### 7. Observações Importantes

- O banco de dados continua armazenando em UTC (padrão internacional)
- Todas as interfaces exibem horários em UTC-3 (horário de Brasília)
- As funções utilitárias podem ser reutilizadas em futuras funcionalidades
- A implementação é compatível com Horário de Verão (quando aplicável)

## Conclusão

A implementação garante que todos os horários sejam tratados consistentemente no sistema, com conversões automáticas entre UTC (armazenamento) e UTC-3 (exibição), seguindo as melhores práticas de desenvolvimento web.
