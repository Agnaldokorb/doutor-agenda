"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderIcon, SaveIcon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const editUserSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  userType: z.enum(["admin", "doctor", "atendente"], {
    errorMap: () => ({ message: "Tipo de usuário inválido" }),
  }),
  specialty: z.string().optional(),
});

type EditUserFormData = z.infer<typeof editUserSchema>;

interface User {
  id: string;
  name: string;
  email: string;
  userType: "admin" | "doctor" | "atendente";
  doctorInfo: {
    id: string;
    specialty: string | null;
  } | null;
}

interface EditUserFormProps {
  user: User;
  onSuccess?: () => void;
}

const EditUserForm = ({ user, onSuccess }: EditUserFormProps) => {
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      name: user.name,
      email: user.email,
      userType: user.userType,
      specialty: user.doctorInfo?.specialty || "",
    },
  });

  const watchUserType = form.watch("userType");

  const onSubmit = async (data: EditUserFormData) => {
    setIsSaving(true);
    try {
      // TODO: Implementar server action para atualizar usuário
      console.log("Dados para atualização:", data);
      
      // Simular API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      toast.success("Usuário atualizado com sucesso!");
      onSuccess?.();
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error);
      toast.error("Erro ao atualizar usuário");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Editar Usuário</DialogTitle>
        <DialogDescription>
          Altere as informações do usuário {user.name}.
        </DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Nome */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome completo *</FormLabel>
                  <FormControl>
                    <Input placeholder="Digite o nome completo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail *</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Digite o e-mail"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Tipo de usuário */}
          <FormField
            control={form.control}
            name="userType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de usuário *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="doctor">Médico</SelectItem>
                    <SelectItem value="atendente">Atendente</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Campos específicos para médico */}
          {watchUserType === "doctor" && (
            <div className="space-y-4 rounded-lg border border-green-200 bg-green-50 p-4">
              <h3 className="font-medium text-green-900">
                Informações do Médico
              </h3>

              {/* Especialidade */}
              <FormField
                control={form.control}
                name="specialty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Especialidade *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Cardiologia, Dermatologia"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="text-sm text-green-700">
                <p>
                  💡 <strong>Nota:</strong> Para atualizar horários, valores e
                  outros dados específicos do médico, utilize a seção de médicos.
                </p>
              </div>
            </div>
          )}

          {/* Botões */}
          <div className="flex space-x-3 border-t pt-4">
            <Button type="submit" disabled={isSaving} className="flex-1">
              {isSaving ? (
                <>
                  <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <SaveIcon className="mr-2 h-4 w-4" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </DialogContent>
  );
};

export default EditUserForm; 