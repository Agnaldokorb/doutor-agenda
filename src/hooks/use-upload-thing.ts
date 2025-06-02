import { useState } from "react";
import { toast } from "sonner";

import { useUploadThing } from "@/lib/uploadthing";

export function useProfileImageUpload() {
  const [isUploading, setIsUploading] = useState(false);

  const { startUpload } = useUploadThing("profileImageUploader", {
    onClientUploadComplete: () => {
      toast.success("Imagem enviada com sucesso!");
      setIsUploading(false);
    },
    onUploadError: (error) => {
      toast.error(`Erro ao enviar imagem: ${error.message}`);
      setIsUploading(false);
    },
    onUploadBegin: () => {
      setIsUploading(true);
    },
  });

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      // Validar tipo de arquivo
      if (!file.type.startsWith("image/")) {
        toast.error("Por favor, selecione apenas arquivos de imagem");
        return null;
      }

      // Validar tamanho do arquivo (4MB)
      if (file.size > 4 * 1024 * 1024) {
        toast.error("A imagem deve ter no máximo 4MB");
        return null;
      }

      const result = await startUpload([file]);

      if (result && result[0]) {
        return result[0].url;
      }

      return null;
    } catch {
      toast.error("Erro ao fazer upload da imagem");
      setIsUploading(false);
      return null;
    }
  };

  return {
    uploadImage,
    isUploading,
  };
}
