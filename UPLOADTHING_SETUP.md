# Configuração do UploadThing

Este projeto utiliza o UploadThing para upload e armazenamento de imagens de perfil de usuários, médicos e pacientes.

## Configuração Inicial

### 1. Variáveis de Ambiente

Adicione as seguintes variáveis ao seu arquivo `.env`:

```env
# UploadThing
UPLOADTHING_TOKEN="your-uploadthing-token-here"
```

Para obter o token:

1. Acesse [uploadthing.com](https://uploadthing.com)
2. Crie uma conta ou faça login
3. Crie um novo projeto
4. Copie o token da API

### 2. Dependências

As seguintes dependências já foram instaladas:

- `uploadthing` - SDK do servidor
- `@uploadthing/react` - Hooks e componentes para React

## Estrutura dos Arquivos

### Core do UploadThing

- `src/app/api/uploadthing/core.ts` - Configuração das rotas de upload
- `src/app/api/uploadthing/route.ts` - Endpoint da API
- `src/lib/uploadthing.ts` - Componentes gerados (UploadButton, UploadDropzone)
- `src/lib/utapi.ts` - Instância do UTApi e funções de gerenciamento

### Componentes

- `src/components/ui/profile-image-uploader.tsx` - Componente principal para upload de imagem de perfil
- `src/hooks/use-upload-thing.ts` - Hook personalizado para facilitar o uso

### Páginas Integradas

- **Médicos**: `src/app/(protected)/doctors/_components/upsert-doctor-form.tsx`
- **Pacientes**: `src/app/(protected)/patients/_components/upsert-patient-form.tsx`
- **Configurações de Usuário**: `src/app/(protected)/configurations/_components/user-profile-card.tsx`

## Como Usar

### 1. Componente ProfileImageUploader

O componente principal com todas as funcionalidades:

```tsx
import { ProfileImageUploader } from "@/components/ui/profile-image-uploader";

function MyForm() {
  const [avatarUrl, setAvatarUrl] = useState<string>();

  const handleUploadComplete = (url: string) => {
    setAvatarUrl(url);
    // Salvar URL no banco de dados
  };

  return (
    <ProfileImageUploader
      onUploadComplete={handleUploadComplete}
      currentImageUrl={avatarUrl}
      fallbackText="U"
      disabled={false}
      size="md" // "sm" | "md" | "lg"
    />
  );
}
```

#### Funcionalidades do ProfileImageUploader:

- ✅ **Drag & Drop**: Arraste imagens diretamente para o avatar
- ✅ **Preview em tempo real**: Visualização imediata da imagem
- ✅ **Progress bar**: Barra de progresso durante o upload
- ✅ **Validação**: Tipo de arquivo, tamanho (4MB) e dimensões
- ✅ **Estados de loading**: Indicadores visuais durante o processo
- ✅ **Hover effects**: Efeitos visuais ao passar o mouse
- ✅ **Tamanhos flexíveis**: sm (64px), md (96px), lg (128px)
- ✅ **Botão de remoção**: Limpar preview/imagem atual
- ✅ **Acessibilidade**: Suporte completo a teclado e screen readers

### 2. Hook useProfileImageUpload

Para uso avançado:

```tsx
import { useProfileImageUpload } from "@/hooks/use-upload-thing";

function MyComponent() {
  const { uploadImage, isUploading } = useProfileImageUpload();

  const handleFileSelect = async (file: File) => {
    const url = await uploadImage(file);
    if (url) {
      console.log("Upload concluído:", url);
    }
  };

  return (
    <input
      type="file"
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) handleFileSelect(file);
      }}
      disabled={isUploading}
    />
  );
}
```

### 3. Gerenciamento de Arquivos com UTApi

```tsx
import { 
  deleteFileByUrl, 
  deleteFilesByUrls, 
  listAllFiles, 
  renameFileByUrl,
  getFileInfo 
} from "@/lib/utapi";

// Deletar arquivo por URL
await deleteFileByUrl("https://utfs.io/f/file-key-here");

// Deletar múltiplos arquivos
const stats = await deleteFilesByUrls([
  "https://utfs.io/f/file1",
  "https://utfs.io/f/file2"
]);
console.log(`${stats.success} excluídos, ${stats.failed} falharam`);

// Listar todos os arquivos
const files = await listAllFiles();

// Renomear arquivo
await renameFileByUrl("https://utfs.io/f/file-key", "novo-nome.jpg");

// Obter informações do arquivo
const info = await getFileInfo("https://utfs.io/f/file-key");
```

## Funcionalidades Avançadas

### 1. Exclusão Automática de Imagens Antigas

O sistema automaticamente exclui imagens antigas quando uma nova é carregada:

- ✅ **Médicos**: Ao editar um médico e alterar a imagem de perfil
- ✅ **Pacientes**: Ao editar um paciente e alterar a imagem de perfil
- ✅ **Logs detalhados**: Acompanhe as exclusões no console
- ✅ **Fallback seguro**: Se a exclusão falhar, não afeta a operação principal

### 2. Validações Avançadas

- **Tipos de arquivo**: JPG, PNG, GIF, WebP
- **Tamanho máximo**: 4MB
- **Dimensões mínimas**: 50x50px (recomendação)
- **Validação em tempo real**: Feedback imediato para o usuário

### 3. Estados de Loading Otimizados

- **Progress bar animada**: Mostra o progresso real do upload
- **Preview instantâneo**: Imagem aparece antes mesmo do upload finalizar
- **Estados visuais**: Loading, hover, drag-over, error
- **Feedback sonoro**: Toasts informativos para cada ação

### 4. Performance e UX

- **useCallback**: Otimização de re-renders
- **Cleanup automático**: Limpeza de URLs de preview
- **Debounce**: Evita uploads múltiplos acidentais
- **Memória gerenciada**: Revogação de Object URLs

## Configurações de Upload

### Limites Atuais

- **Tamanho máximo**: 4MB por arquivo
- **Tipos aceitos**: Imagens (JPG, PNG, GIF, WebP)
- **Quantidade**: 1 arquivo por upload

### Personalizar Limites

Edite o arquivo `src/app/api/uploadthing/core.ts`:

```tsx
profileImageUploader: f({
  image: {
    maxFileSize: "8MB", // Alterar tamanho máximo
    maxFileCount: 1, // Alterar quantidade
  },
});
```

## Banco de Dados

### Campos Adicionados

As seguintes tabelas foram atualizadas para suportar imagens de perfil:

#### Tabela `doctors`

- `avatar_image_url` (text, nullable) - URL da imagem de perfil do médico

#### Tabela `patients`

- `avatar_image_url` (text, nullable) - URL da imagem de perfil do paciente

#### Tabela `users`

- `image` (text, nullable) - URL da imagem de perfil do usuário (já existia)

## Páginas Integradas

### 1. Formulário de Médicos

Localização: `src/app/(protected)/doctors/_components/upsert-doctor-form.tsx`

**Funcionalidades:**
- Upload de imagem durante criação/edição
- Exclusão automática da imagem anterior
- Preview em tempo real
- Validação integrada com o formulário

### 2. Formulário de Pacientes

Localização: `src/app/(protected)/patients/_components/upsert-patient-form.tsx`

**Funcionalidades:**
- Upload de imagem durante criação/edição
- Exclusão automática da imagem anterior
- Preview em tempo real
- Validação integrada com o formulário

### 3. Configurações de Perfil

Localização: `src/app/(protected)/configurations/_components/user-profile-card.tsx`

**Funcionalidades:**
- Edição do perfil do usuário logado
- Upload de foto de perfil
- Visualização de informações do usuário
- Interface moderna e responsiva

## Exemplos Completos

### Formulário Completo com Upload

```tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { ProfileImageUploader } from "@/components/ui/profile-image-uploader";

export function UserForm() {
  const [avatarUrl, setAvatarUrl] = useState<string>();
  const form = useForm();

  const handleAvatarUpload = (url: string) => {
    setAvatarUrl(url);
    form.setValue("avatarImageUrl", url);
  };

  const onSubmit = (data) => {
    console.log("Dados do formulário:", { ...data, avatarImageUrl: avatarUrl });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <ProfileImageUploader
        onUploadComplete={handleAvatarUpload}
        currentImageUrl={avatarUrl}
        fallbackText="U"
        size="lg"
      />
      
      {/* Outros campos do formulário */}
      
      <button type="submit">Salvar</button>
    </form>
  );
}
```

### Gerenciamento de Arquivos em Server Action

```tsx
"use server";

import { deleteFileByUrl } from "@/lib/utapi";
import { db } from "@/db";

export async function updateUserProfile(data: UserData) {
  // Buscar dados antigos
  const oldUser = await db.user.findUnique({ where: { id: data.id } });
  
  // Se mudou a imagem, excluir a antiga
  if (oldUser?.image && data.image && oldUser.image !== data.image) {
    await deleteFileByUrl(oldUser.image);
    console.log("Imagem antiga excluída:", oldUser.image);
  }
  
  // Atualizar usuário
  await db.user.update({
    where: { id: data.id },
    data: data,
  });
}
```

## Troubleshooting

### Erro: "UPLOADTHING_TOKEN is required"

- Verifique se a variável de ambiente está configurada corretamente
- Reinicie o servidor de desenvolvimento após adicionar a variável

### Upload falha silenciosamente

- Verifique o console do navegador para erros
- Confirme se o arquivo atende aos limites de tamanho e tipo
- Verifique se o token do UploadThing é válido
- Teste a conectividade com `https://uploadthing.com`

### Imagem não aparece após upload

- Verifique se a URL está sendo salva corretamente no banco de dados
- Confirme se o componente está recebendo a URL atualizada
- Teste a URL diretamente no navegador
- Verifique se não há problemas de CORS

### Performance lenta

- Otimize as imagens antes do upload
- Considere implementar compressão automática
- Verifique a conexão de internet
- Monitor o tamanho dos arquivos

### Erro de exclusão automática

- Verifique se o token tem permissões de exclusão
- Confirme se a URL da imagem antiga é válida
- Verifique os logs do servidor para mais detalhes

## Monitoramento e Logs

O sistema inclui logs detalhados para facilitar o debugging:

```
🏥 Criando novo médico: Dr. João Silva
👤 Criando usuário obrigatório para: Dr. João Silva
✅ Usuário criado: abc123
🗑️ Excluindo imagem antiga: https://utfs.io/f/old-image
✅ Imagem antiga excluída com sucesso
👨‍⚕️ Salvando médico na base de dados...
✅ Médico salvo com sucesso
```

## Próximas Funcionalidades

- [ ] Compressão automática de imagens
- [ ] Múltiplos formatos de saída (WebP, AVIF)
- [ ] Redimensionamento automático
- [ ] Cache de imagens
- [ ] Galeria de imagens para médicos
- [ ] Backup automático das imagens
- [ ] Integração com CDN
- [ ] Analytics de uploads
