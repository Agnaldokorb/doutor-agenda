import { UTApi } from "uploadthing/server";

export const utapi = new UTApi({
  token: process.env.UPLOADTHING_TOKEN,
});

/**
 * Extrai a chave do arquivo a partir de uma URL do UploadThing
 * @param url URL completa do arquivo no UploadThing
 * @returns Chave do arquivo ou null se não for uma URL válida
 */
export function extractFileKeyFromUrl(url: string): string | null {
  try {
    // URL do UploadThing tem o formato: https://utfs.io/f/{fileKey}
    const match = url.match(/\/f\/([^\/\?]+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * Exclui um arquivo do UploadThing usando sua URL
 * @param url URL completa do arquivo
 * @returns Promise<boolean> true se excluído com sucesso
 */
export async function deleteFileByUrl(url: string): Promise<boolean> {
  try {
    const fileKey = extractFileKeyFromUrl(url);
    if (!fileKey) {
      console.warn("Não foi possível extrair a chave do arquivo da URL:", url);
      return false;
    }

    await utapi.deleteFiles(fileKey);
    console.log("Arquivo excluído com sucesso:", fileKey);
    return true;
  } catch (error) {
    console.error("Erro ao excluir arquivo:", error);
    return false;
  }
}

/**
 * Exclui múltiplos arquivos do UploadThing usando suas URLs
 * @param urls Array de URLs dos arquivos
 * @returns Promise<{ success: number, failed: number }> Estatísticas de exclusão
 */
export async function deleteFilesByUrls(
  urls: string[],
): Promise<{ success: number; failed: number }> {
  const stats = { success: 0, failed: 0 };

  for (const url of urls) {
    const deleted = await deleteFileByUrl(url);
    if (deleted) {
      stats.success++;
    } else {
      stats.failed++;
    }
  }

  return stats;
}

/**
 * Lista todos os arquivos do UploadThing
 * @returns Promise com informações dos arquivos
 */
export async function listAllFiles() {
  try {
    const files = await utapi.listFiles();
    return files;
  } catch (error) {
    console.error("Erro ao listar arquivos:", error);
    return null;
  }
}

/**
 * Renomeia um arquivo no UploadThing
 * @param url URL do arquivo atual
 * @param newName Novo nome para o arquivo
 * @returns Promise<boolean> true se renomeado com sucesso
 */
export async function renameFileByUrl(
  url: string,
  newName: string,
): Promise<boolean> {
  try {
    const fileKey = extractFileKeyFromUrl(url);
    if (!fileKey) {
      console.warn("Não foi possível extrair a chave do arquivo da URL:", url);
      return false;
    }

    await utapi.renameFiles({
      fileKey,
      newName,
    });

    console.log("Arquivo renomeado com sucesso:", fileKey, "->", newName);
    return true;
  } catch (error) {
    console.error("Erro ao renomear arquivo:", error);
    return false;
  }
}

/**
 * Obtém informações detalhadas de um arquivo
 * @param url URL do arquivo
 * @returns Promise com informações do arquivo ou null
 */
export async function getFileInfo(url: string) {
  try {
    const fileKey = extractFileKeyFromUrl(url);
    if (!fileKey) {
      return null;
    }

    const files = await utapi.listFiles();
    return files.files.find((file) => file.key === fileKey) || null;
  } catch (error) {
    console.error("Erro ao obter informações do arquivo:", error);
    return null;
  }
}
