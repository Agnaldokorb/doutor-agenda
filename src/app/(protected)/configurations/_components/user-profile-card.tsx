"use client";

import { Loader2, Save, Shield, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProfileImageUploader } from "@/components/ui/profile-image-uploader";
import { authClient } from "@/lib/auth-client";

export const UserProfileCard = () => {
  const session = authClient.useSession();
  const user = session.data?.user;

  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    image: user?.image || "",
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleAvatarUpload = (url: string) => {
    setProfileData((prev) => ({ ...prev, image: url }));
    toast.success("Imagem de perfil atualizada!");
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // TODO: Implementar a atualização do perfil via API
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call

      toast.success("Perfil atualizado com sucesso!");
      setIsEditing(false);
    } catch {
      toast.error("Erro ao atualizar perfil");
    } finally {
      setIsSaving(false);
    }
  };

  const getUserTypeLabel = (userType: string) => {
    switch (userType) {
      case "admin":
        return "Administrador";
      case "doctor":
        return "Médico";
      case "atendente":
        return "Atendente";
      default:
        return userType;
    }
  };

  const getUserTypeBadge = (userType: string) => {
    const baseClasses =
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";

    switch (userType) {
      case "admin":
        return `${baseClasses} bg-purple-100 text-purple-800`;
      case "doctor":
        return `${baseClasses} bg-green-100 text-green-800`;
      case "atendente":
        return `${baseClasses} bg-blue-100 text-blue-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Card className="border-indigo-200 bg-indigo-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <User className="h-5 w-5 text-indigo-600" />
            <CardTitle className="text-indigo-900">Perfil do Usuário</CardTitle>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
            className="border-indigo-200 text-indigo-700 hover:bg-indigo-100"
            disabled={isSaving}
          >
            {isEditing ? "Cancelar" : "Editar"}
          </Button>
        </div>
        <CardDescription className="text-indigo-700">
          Gerencie suas informações pessoais e foto de perfil
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-6">
          {/* Foto de Perfil */}
          <div className="flex flex-col items-center space-y-4">
            <ProfileImageUploader
              onUploadComplete={handleAvatarUpload}
              currentImageUrl={profileData.image}
              fallbackText={user.name?.charAt(0) || "U"}
              disabled={!isEditing || isSaving}
            />
            {isEditing && (
              <p className="text-center text-xs text-indigo-600">
                Clique para alterar sua foto de perfil
              </p>
            )}
          </div>

          {/* Informações do Usuário */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Nome */}
              <div className="space-y-2">
                <Label
                  htmlFor="name"
                  className="text-sm font-medium text-indigo-900"
                >
                  Nome completo
                </Label>
                {isEditing ? (
                  <Input
                    id="name"
                    value={profileData.name}
                    onChange={(e) =>
                      setProfileData((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    className="border-indigo-200 focus:border-indigo-500"
                    disabled={isSaving}
                  />
                ) : (
                  <p className="rounded-md border border-indigo-100 bg-white px-3 py-2 text-sm text-gray-900">
                    {user.name}
                  </p>
                )}
              </div>

              {/* E-mail */}
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-medium text-indigo-900"
                >
                  E-mail
                </Label>
                {isEditing ? (
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) =>
                      setProfileData((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    className="border-indigo-200 focus:border-indigo-500"
                    disabled={isSaving}
                  />
                ) : (
                  <p className="rounded-md border border-indigo-100 bg-white px-3 py-2 text-sm text-gray-900">
                    {user.email}
                  </p>
                )}
              </div>
            </div>

            {/* Tipo de Usuário */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-indigo-900">
                Tipo de usuário
              </Label>
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-indigo-600" />
                <span className={getUserTypeBadge(user.userType)}>
                  {getUserTypeLabel(user.userType)}
                </span>
              </div>
            </div>

            {/* Data de criação */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-indigo-900">
                Membro desde
              </Label>
              <p className="rounded-md border border-indigo-100 bg-white px-3 py-2 text-sm text-gray-600">
                {new Date(user.createdAt).toLocaleDateString("pt-BR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          {/* Botões de Ação */}
          {isEditing && (
            <div className="flex space-x-3 border-t border-indigo-200 pt-4">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span>{isSaving ? "Salvando..." : "Salvar alterações"}</span>
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
