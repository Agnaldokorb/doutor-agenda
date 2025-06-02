"use client";

import "dayjs/locale/pt-br";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import {
  EditIcon,
  EyeIcon,
  LoaderIcon,
  ShieldIcon,
  TrashIcon,
  UserPlusIcon,
  UsersIcon,
} from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { deleteUser } from "@/actions/delete-user";
import { getClinicUsers } from "@/actions/get-clinic-users";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
import EditUserForm from "./edit-user-form";

// Configurar dayjs
dayjs.extend(relativeTime);
dayjs.locale("pt-br");

type User = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  userType: "admin" | "doctor" | "atendente";
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  doctorInfo: {
    id: string;
    specialty: string | null;
  } | null;
};

export const UserManagementCard = ({
  forceCreateModal = false,
}: {
  forceCreateModal?: boolean;
}) => {
  const [showUserList, setShowUserList] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(forceCreateModal);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Action para buscar usuários da clínica
  const { execute: executeGetUsers } = useAction(getClinicUsers, {
    onSuccess: ({ data }) => {
      if (data?.users) {
        setUsers(data.users as User[]);
      }
      setIsLoading(false);
    },
    onError: ({ error }) => {
      console.error("Erro ao carregar usuários:", error);
      setIsLoading(false);
    },
  });

  // Action para deletar usuário
  const { execute: executeDeleteUser, isExecuting: isDeletingUser } = useAction(
    deleteUser,
    {
      onSuccess: ({ data }) => {
        toast.success(data?.message || "Usuário excluído com sucesso!");
        reloadUsers();
      },
      onError: ({ error }) => {
        toast.error(error.serverError || "Erro ao excluir usuário");
      },
    },
  );

  // Carregar usuários ao montar componente
  useEffect(() => {
    executeGetUsers();
  }, [executeGetUsers]);

  // Abrir modal quando forceCreateModal muda para true
  useEffect(() => {
    if (forceCreateModal) {
      setIsCreateModalOpen(true);
    }
  }, [forceCreateModal]);

  const reloadUsers = () => {
    setIsLoading(true);
    executeGetUsers();
  };

  const handleDeleteUser = (userId: string) => {
    executeDeleteUser({ userId });
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

  const getStatusBadge = (user: User) => {
    // Considera ativo se o email foi verificado
    const isActive = user.emailVerified;
    if (isActive) {
      return <Badge className="bg-green-100 text-green-800">Ativo</Badge>;
    }
    return <Badge className="bg-red-100 text-red-800">Inativo</Badge>;
  };

  const getDeleteAlertContent = (user: User) => {
    if (user.userType === "doctor") {
      return {
        title: "Excluir Médico",
        description: `Tem certeza que deseja excluir o médico ${user.name}? 
        
⚠️ ATENÇÃO: Esta ação irá também:
• Excluir TODAS as consultas agendadas com este médico
• Remover todos os dados relacionados permanentemente
• Esta ação não pode ser desfeita`,
      };
    }

    return {
      title: "Excluir Usuário",
      description: `Tem certeza que deseja excluir o usuário ${user.name}? Esta ação não pode ser desfeita.`,
    };
  };

  if (isLoading) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <UsersIcon className="h-5 w-5 text-green-600" />
            <CardTitle className="text-green-900">
              Gerenciamento de Usuários
            </CardTitle>
          </div>
          <CardDescription className="text-green-700">
            Gerencie médicos, administradores e atendentes do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <LoaderIcon className="mx-auto h-6 w-6 animate-spin text-green-600" />
              <p className="mt-2 text-sm text-gray-600">
                Carregando usuários...
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

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
                reloadUsers();
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
                {users.filter((u) => u.userType === "doctor").length}
              </p>
              <p className="text-xs text-green-700">Médicos</p>
            </div>
            <div className="rounded-lg border border-green-200 bg-white p-3 text-center">
              <p className="text-lg font-bold text-green-600">
                {users.filter((u) => u.userType === "admin").length}
              </p>
              <p className="text-xs text-green-700">Admins</p>
            </div>
            <div className="rounded-lg border border-green-200 bg-white p-3 text-center">
              <p className="text-lg font-bold text-green-600">
                {users.filter((u) => u.userType === "atendente").length}
              </p>
              <p className="text-xs text-green-700">Atendentes</p>
            </div>
            <div className="rounded-lg border border-green-200 bg-white p-3 text-center">
              <p className="text-lg font-bold text-green-600">
                {users.filter((u) => u.emailVerified).length}
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
              {users.length === 0 ? (
                <div className="py-4 text-center">
                  <p className="text-sm text-gray-500">
                    Nenhum usuário encontrado
                  </p>
                </div>
              ) : (
                (showUserList ? users : users.slice(0, 2)).map((user) => (
                  <div
                    key={user.id}
                    className="bg-green-25 flex items-center justify-between rounded-lg border border-green-100 p-3"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {user.name}
                        </p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                        {user.doctorInfo?.specialty && (
                          <p className="text-xs text-green-600">
                            {user.doctorInfo.specialty}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getUserTypeBadge(user.userType)}
                      {getStatusBadge(user)}
                      <div className="flex space-x-1">
                        {/* Botão Editar */}
                        <Dialog
                          open={editingUser?.id === user.id}
                          onOpenChange={(open) =>
                            setEditingUser(open ? user : null)
                          }
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-green-600 hover:bg-green-100"
                              title="Editar usuário"
                            >
                              <EditIcon className="h-3 w-3" />
                            </Button>
                          </DialogTrigger>
                          {editingUser && (
                            <EditUserForm
                              user={editingUser}
                              onSuccess={() => {
                                setEditingUser(null);
                                reloadUsers();
                              }}
                            />
                          )}
                        </Dialog>

                        {/* Botão Excluir */}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-red-600 hover:bg-red-100"
                              title="Excluir usuário"
                              disabled={isDeletingUser}
                            >
                              <TrashIcon className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                {getDeleteAlertContent(user).title}
                              </AlertDialogTitle>
                              <AlertDialogDescription className="whitespace-pre-line">
                                {getDeleteAlertContent(user).description}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteUser(user.id)}
                                className="bg-red-600 hover:bg-red-700"
                                disabled={isDeletingUser}
                              >
                                {isDeletingUser ? (
                                  <>
                                    <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                                    Excluindo...
                                  </>
                                ) : (
                                  "Excluir"
                                )}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                ))
              )}
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
                reloadUsers();
              }}
            />
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
};
