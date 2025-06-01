"use client";

import {
  UsersIcon,
  UserPlusIcon,
  ShieldIcon,
  EditIcon,
  TrashIcon,
  EyeIcon,
} from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";

import CreateUserForm from "./create-user-form";

export const UserManagementCard = () => {
  const [showUserList, setShowUserList] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Mock data - em produção viria de uma API
  const users = [
    {
      id: 1,
      name: "Dr. João Silva",
      email: "joao@clinica.com",
      type: "doctor",
      status: "active",
      lastLogin: "2 horas atrás",
    },
    {
      id: 2,
      name: "Admin Principal",
      email: "admin@clinica.com",
      type: "admin",
      status: "active",
      lastLogin: "1 hora atrás",
    },
    {
      id: 3,
      name: "Dra. Maria Santos",
      email: "maria@clinica.com",
      type: "doctor",
      status: "inactive",
      lastLogin: "1 semana atrás",
    },
    {
      id: 4,
      name: "Ana Atendente",
      email: "ana@clinica.com",
      type: "atendente",
      status: "active",
      lastLogin: "30 minutos atrás",
    },
  ];

  const getUserTypeLabel = (type: string) => {
    switch (type) {
      case "admin":
        return "Administrador";
      case "doctor":
        return "Médico";
      case "atendente":
        return "Atendente";
      default:
        return type;
    }
  };

  const getUserTypeBadge = (type: string) => {
    if (type === "admin") {
      return (
        <Badge className="bg-purple-100 text-purple-800">
          <ShieldIcon className="mr-1 h-3 w-3" />
          Admin
        </Badge>
      );
    }
    if (type === "atendente") {
      return (
        <Badge className="bg-blue-100 text-blue-800">
          <UsersIcon className="mr-1 h-3 w-3" />
          Atendente
        </Badge>
      );
    }
    return (
      <Badge className="bg-green-100 text-green-800">
        <UsersIcon className="mr-1 h-3 w-3" />
        Médico
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    if (status === "active") {
      return <Badge className="bg-green-100 text-green-800">Ativo</Badge>;
    }
    return <Badge className="bg-red-100 text-red-800">Inativo</Badge>;
  };

  return (
    <Card className="border-green-200 bg-green-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <UsersIcon className="h-5 w-5 text-green-600" />
            <CardTitle className="text-green-900">
              Gerenciamento de Usuários
            </CardTitle>
          </div>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="border-green-200 text-green-700 hover:bg-green-100"
              >
                <UserPlusIcon className="mr-1 h-3 w-3" />
                Criar Usuário
              </Button>
            </DialogTrigger>
            <CreateUserForm
              onSuccess={() => {
                setIsCreateModalOpen(false);
                // Aqui você poderia recarregar a lista de usuários
              }}
            />
          </Dialog>
        </div>
        <CardDescription className="text-green-700">
          Gerencie médicos, administradores e atendentes do sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Estatísticas */}
          <div className="grid grid-cols-4 gap-3">
            <div className="rounded-lg border border-green-200 bg-white p-3 text-center">
              <p className="text-lg font-bold text-green-600">
                {users.filter((u) => u.type === "doctor").length}
              </p>
              <p className="text-xs text-green-700">Médicos</p>
            </div>
            <div className="rounded-lg border border-green-200 bg-white p-3 text-center">
              <p className="text-lg font-bold text-green-600">
                {users.filter((u) => u.type === "admin").length}
              </p>
              <p className="text-xs text-green-700">Admins</p>
            </div>
            <div className="rounded-lg border border-green-200 bg-white p-3 text-center">
              <p className="text-lg font-bold text-green-600">
                {users.filter((u) => u.type === "atendente").length}
              </p>
              <p className="text-xs text-green-700">Atendentes</p>
            </div>
            <div className="rounded-lg border border-green-200 bg-white p-3 text-center">
              <p className="text-lg font-bold text-green-600">
                {users.filter((u) => u.status === "active").length}
              </p>
              <p className="text-xs text-green-700">Ativos</p>
            </div>
          </div>

          {/* Lista de Usuários */}
          <div className="rounded-lg border border-green-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="font-semibold text-green-900">
                Usuários Recentes
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowUserList(!showUserList)}
                className="text-green-700 hover:bg-green-100"
              >
                <EyeIcon className="mr-1 h-3 w-3" />
                {showUserList ? "Ocultar" : "Ver Todos"}
              </Button>
            </div>

            <div className="space-y-3">
              {(showUserList ? users : users.slice(0, 2)).map((user) => (
                <div
                  key={user.id}
                  className="bg-green-25 flex items-center justify-between rounded-lg border border-green-100 p-3"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {user.name}
                      </p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getUserTypeBadge(user.type)}
                    {getStatusBadge(user.status)}
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-green-600 hover:bg-green-100"
                      >
                        <EditIcon className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-red-600 hover:bg-red-100"
                      >
                        <TrashIcon className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Botão de Ação Único */}
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="flex w-full items-center space-x-2 border-green-200 text-green-700 hover:bg-green-100"
              >
                <UserPlusIcon className="h-4 w-4" />
                <span>Criar Novo Usuário</span>
              </Button>
            </DialogTrigger>
            <CreateUserForm
              onSuccess={() => {
                setIsCreateModalOpen(false);
                // Aqui você poderia recarregar a lista de usuários
              }}
            />
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
};
