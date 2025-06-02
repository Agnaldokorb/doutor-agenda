import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { PatternFormat } from "react-number-format";
import { toast } from "sonner";
import { z } from "zod";

import { upsertPatient } from "@/actions/upsert-patient";
import { Button } from "@/components/ui/button";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { ProfileImageUploader } from "@/components/ui/profile-image-uploader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { patientsTable } from "@/db/schema";

const formSchema = z.object({
  name: z.string().trim().min(1, {
    message: "Nome é obrigatório.",
  }),
  email: z.string().trim().email({
    message: "E-mail inválido.",
  }),
  avatarImageUrl: z.string().optional(),
  phone_number: z.string().trim().min(10, {
    message: "Número de telefone deve ter pelo menos 10 dígitos.",
  }),
  sex: z.enum(["male", "female"], {
    required_error: "Sexo é obrigatório.",
  }),
});

interface UpsertPatientFormProps {
  isOpen: boolean;
  patient?: typeof patientsTable.$inferSelect;
  onSuccess?: () => void;
}

const UpsertPatientForm = ({
  patient,
  onSuccess,
  isOpen,
}: UpsertPatientFormProps) => {
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(
    patient?.avatarImageUrl || undefined,
  );

  const form = useForm<z.infer<typeof formSchema>>({
    shouldUnregister: true,
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: patient?.name ?? "",
      email: patient?.email ?? "",
      avatarImageUrl: patient?.avatarImageUrl ?? "",
      phone_number: patient?.phone_number ?? "",
      sex: patient?.sex ?? "male",
    },
  });

  useEffect(() => {
    if (isOpen) {
      const resetValues = {
        name: patient?.name ?? "",
        email: patient?.email ?? "",
        avatarImageUrl: patient?.avatarImageUrl ?? "",
        phone_number: patient?.phone_number ?? "",
        sex: patient?.sex ?? "male",
      };

      form.reset(resetValues);
      setAvatarUrl(patient?.avatarImageUrl || undefined);
    }
  }, [isOpen, patient, form]);

  const upsertPatientAction = useAction(upsertPatient, {
    onSuccess: () => {
      toast.success("Paciente adicionado com sucesso.");
      onSuccess?.();
    },
    onError: (error) => {
      console.error("Erro:", error);

      // Verifica se há um erro do servidor
      if (error.error?.serverError) {
        toast.error(error.error.serverError);
        return;
      }

      // Verifica se há erros de validação
      if (error.error?.validationErrors) {
        const validationErrors = error.error.validationErrors;

        // Pega o primeiro erro de validação disponível
        const firstError =
          validationErrors._errors?.[0] ||
          validationErrors.name?._errors?.[0] ||
          validationErrors.email?._errors?.[0] ||
          validationErrors.phone_number?._errors?.[0] ||
          validationErrors.sex?._errors?.[0];

        if (firstError) {
          toast.error(firstError);
          return;
        }
      }

      // Mensagem genérica se nenhum erro específico for encontrado
      toast.error("Erro ao adicionar paciente.");
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    console.log("Valores do formulário:", values);

    if (!values.phone_number) {
      toast.error("Número de telefone é obrigatório");
      return;
    }

    upsertPatientAction.execute({
      ...values,
      id: patient?.id,
      avatarImageUrl: avatarUrl || "",
    });
  };

  const handleAvatarUpload = (url: string) => {
    setAvatarUrl(url);
    form.setValue("avatarImageUrl", url);
  };

  return (
    <DialogContent className="max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>
          {patient ? patient.name : "Adicionar paciente"}
        </DialogTitle>
        <DialogDescription>
          {patient
            ? "Edite as informações desse paciente."
            : "Adicione um novo paciente."}
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Campo de Upload de Imagem */}
          <FormItem>
            <FormLabel>Foto de Perfil</FormLabel>
            <FormControl>
              <ProfileImageUploader
                onUploadComplete={handleAvatarUpload}
                currentImageUrl={avatarUrl}
                fallbackText={patient?.name?.charAt(0) || "P"}
                disabled={upsertPatientAction.isExecuting}
              />
            </FormControl>
          </FormItem>

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-mail</FormLabel>
                <FormControl>
                  <Input type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número de telefone</FormLabel>
                <FormControl>
                  <PatternFormat
                    value={field.value}
                    onValueChange={(values) => {
                      field.onChange(values.value || "");
                    }}
                    format={
                      field.value &&
                      field.value.replace(/\D/g, "").length === 11
                        ? "(##) #####-####"
                        : "(##) ####-####"
                    }
                    mask="_"
                    customInput={Input}
                    placeholder="(11) 99999-9999"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sex"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sexo</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o sexo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="male">Masculino</SelectItem>
                    <SelectItem value="female">Feminino</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <DialogFooter>
            <Button type="submit" disabled={upsertPatientAction.isPending}>
              {upsertPatientAction.isPending
                ? "Salvando..."
                : patient
                  ? "Salvar"
                  : "Adicionar"}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
};

export default UpsertPatientForm;
