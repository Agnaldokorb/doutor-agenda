"use client";

import { Camera, Loader2, Upload, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useUploadThing } from "@/lib/uploadthing";

interface ProfileImageUploaderProps {
  onUploadComplete?: (url: string) => void;
  currentImageUrl?: string;
  fallbackText?: string;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
}

export function ProfileImageUploader({
  onUploadComplete,
  currentImageUrl,
  fallbackText = "U",
  disabled = false,
  size = "md",
}: ProfileImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return { avatar: "h-16 w-16", button: "text-xs px-2 py-1" };
      case "lg":
        return { avatar: "h-32 w-32", button: "text-sm px-4 py-2" };
      default:
        return { avatar: "h-24 w-24", button: "text-sm px-3 py-2" };
    }
  };

  const sizeClasses = getSizeClasses();

  const { startUpload } = useUploadThing("profileImageUploader", {
    onClientUploadComplete: (res) => {
      if (res && res[0]) {
        const uploadedUrl = res[0].url;
        setPreviewUrl(uploadedUrl);
        onUploadComplete?.(uploadedUrl);
        toast.success("Imagem enviada com sucesso!");
      }
      setIsUploading(false);
      setUploadProgress(0);
    },
    onUploadError: (error) => {
      toast.error(`Erro ao enviar imagem: ${error.message}`);
      setIsUploading(false);
      setUploadProgress(0);
    },
    onUploadBegin: () => {
      setIsUploading(true);
      setUploadProgress(10);
    },
    onUploadProgress: (progress) => {
      setUploadProgress(progress);
    },
  });

  const validateFile = useCallback((file: File): boolean => {
    // Validar tipo de arquivo
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione apenas arquivos de imagem");
      return false;
    }

    // Validar tamanho do arquivo (4MB)
    if (file.size > 4 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 4MB");
      return false;
    }

    // Validar dimensões mínimas (opcional)
    const img = new Image();
    img.onload = () => {
      if (img.width < 50 || img.height < 50) {
        toast.warning("Recomendamos imagens com pelo menos 50x50 pixels");
      }
    };
    img.src = URL.createObjectURL(file);

    return true;
  }, []);

  const handleFileSelect = useCallback(
    async (file: File) => {
      if (!validateFile(file)) return;

      // Criar preview local imediatamente
      const localPreview = URL.createObjectURL(file);
      setPreviewUrl(localPreview);

      try {
        await startUpload([file]);
      } catch {
        toast.error("Erro ao fazer upload da imagem");
        setIsUploading(false);
        setUploadProgress(0);
        setPreviewUrl(null);
        // Limpar o preview local em caso de erro
        URL.revokeObjectURL(localPreview);
      }
    },
    [startUpload, validateFile],
  );

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect],
  );

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragOver(false);

      const files = Array.from(event.dataTransfer.files);
      const imageFile = files.find((file) => file.type.startsWith("image/"));

      if (imageFile) {
        handleFileSelect(imageFile);
      } else {
        toast.error("Por favor, solte apenas arquivos de imagem");
      }
    },
    [handleFileSelect],
  );

  const handleDragOver = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragOver(true);
    },
    [],
  );

  const handleDragLeave = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragOver(false);
    },
    [],
  );

  const clearPreview = useCallback(() => {
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const displayUrl = previewUrl || currentImageUrl;

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Avatar com drag and drop */}
      <div
        className={`group relative cursor-pointer transition-all duration-200 ${
          isDragOver ? "scale-105" : ""
        } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={!disabled ? triggerFileInput : undefined}
      >
        <Avatar
          className={`${sizeClasses.avatar} transition-all duration-200 ${
            isDragOver ? "ring-opacity-50 ring-4 ring-blue-500" : ""
          }`}
        >
          <AvatarImage src={displayUrl} alt="Profile" />
          <AvatarFallback className="text-lg font-semibold">
            {fallbackText}
          </AvatarFallback>
        </Avatar>

        {/* Overlay para upload */}
        {!disabled && (
          <div className="bg-opacity-0 group-hover:bg-opacity-40 absolute inset-0 flex items-center justify-center rounded-full bg-black transition-all duration-200">
            <div className="opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <Camera className="h-6 w-6 text-white" />
            </div>
          </div>
        )}

        {/* Botão de remover preview */}
        {previewUrl && !isUploading && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              clearPreview();
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 absolute -top-2 -right-2 rounded-full p-1 transition-all duration-200 hover:scale-110"
            disabled={disabled}
          >
            <X className="h-3 w-3" />
          </button>
        )}

        {/* Loading overlay */}
        {isUploading && (
          <div className="bg-background/90 absolute inset-0 flex flex-col items-center justify-center rounded-full">
            <Loader2 className="text-primary h-6 w-6 animate-spin" />
            <span className="text-muted-foreground mt-1 text-xs">
              {uploadProgress}%
            </span>
          </div>
        )}
      </div>

      {/* Progress bar simples */}
      {isUploading && (
        <div className="w-full max-w-xs">
          <div className="bg-secondary h-2 rounded-full">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-muted-foreground mt-1 text-center text-xs">
            Enviando imagem... {uploadProgress}%
          </p>
        </div>
      )}

      {/* Controles */}
      <div className="flex flex-col items-center space-y-2">
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            className={`${sizeClasses.button} cursor-pointer`}
            disabled={disabled || isUploading}
            onClick={triggerFileInput}
          >
            <Upload className="mr-2 h-4 w-4" />
            {isUploading ? "Enviando..." : "Escolher imagem"}
          </Button>

          {displayUrl && !isUploading && (
            <Button
              variant="outline"
              size="sm"
              className={sizeClasses.button}
              disabled={disabled}
              onClick={clearPreview}
            >
              <X className="mr-1 h-3 w-3" />
              Remover
            </Button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled || isUploading}
        />

        <div className="text-center">
          <Badge variant="secondary" className="text-xs">
            Máx. 4MB
          </Badge>
          <p className="text-muted-foreground mt-1 text-xs">
            JPG, PNG, GIF, WebP • Arraste ou clique para enviar
          </p>
        </div>
      </div>
    </div>
  );
}
