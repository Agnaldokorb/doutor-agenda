"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "next-safe-action/hooks";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { getPatientAppointments } from "@/actions/get-patient-appointments";
import { upsertMedicalRecord } from "@/actions/upsert-medical-record";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
  appointmentId: z.string().optional(),
  symptoms: z.string().trim().min(1, {
    message: "Sintomas são obrigatórios.",
  }),
  diagnosis: z.string().trim().min(1, {
    message: "Diagnóstico é obrigatório.",
  }),
  treatment: z.string().trim().min(1, {
    message: "Tratamento é obrigatório.",
  }),
  medication: z.string().trim().min(1, {
    message: "Medicação é obrigatória.",
  }),
  medicalCertificate: z.boolean(),
  certificateDays: z.number().min(0).max(365).optional(),
  observations: z.string().trim().optional(),
});

interface MedicalRecord {
  id: string;
  appointmentId?: string | null;
  symptoms: string;
  diagnosis: string;
  treatment: string;
  medication: string;
  medicalCertificate: boolean;
  certificateDays?: number | null;
  observations?: string | null;
}

interface UpsertMedicalRecordFormProps {
  patientId: string;
  doctorId: string;
  medicalRecord?: MedicalRecord;
  appointmentId?: string;
  onSuccess?: () => void;
}

const UpsertMedicalRecordForm = ({
  patientId,
  doctorId,
  medicalRecord,
  appointmentId,
  onSuccess,
}: UpsertMedicalRecordFormProps) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      appointmentId: undefined,
      symptoms: "",
      diagnosis: "",
      treatment: "",
      medication: "",
      medicalCertificate: false,
      certificateDays: 0,
      observations: "",
    },
  });

  // Buscar agendamentos do paciente
  const getPatientAppointmentsAction = useAction(getPatientAppointments, {
    onSuccess: (data) => {
      console.log("✅ Agendamentos do paciente carregados:", data);
    },
    onError: (error) => {
      console.error("❌ Erro ao carregar agendamentos:", error);
    },
  });

  const upsertMedicalRecordAction = useAction(upsertMedicalRecord, {
    onSuccess: (data) => {
      console.log("✅ Prontuário salvo:", data);
      toast.success(data.data?.message || "Prontuário salvo com sucesso!");
      onSuccess?.();
    },
    onError: (error) => {
      console.error("❌ Erro ao salvar prontuário:", error);
      toast.error("Erro ao salvar prontuário");
    },
  });

  const watchMedicalCertificate = form.watch("medicalCertificate");

  // Buscar agendamentos quando o componente montar
  useEffect(() => {
    getPatientAppointmentsAction.execute({ patientId });
  }, [patientId, getPatientAppointmentsAction]);

  // Resetar o formulário quando receber um prontuário para editar
  useEffect(() => {
    if (medicalRecord) {
      form.reset({
        appointmentId: medicalRecord.appointmentId || undefined,
        symptoms: medicalRecord.symptoms,
        diagnosis: medicalRecord.diagnosis,
        treatment: medicalRecord.treatment,
        medication: medicalRecord.medication,
        medicalCertificate: medicalRecord.medicalCertificate,
        certificateDays: medicalRecord.certificateDays || 0,
        observations: medicalRecord.observations || "",
      });
    } else {
      form.reset({
        appointmentId: appointmentId || undefined,
        symptoms: "",
        diagnosis: "",
        treatment: "",
        medication: "",
        medicalCertificate: false,
        certificateDays: 0,
        observations: "",
      });
    }
  }, [medicalRecord, appointmentId, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    await upsertMedicalRecordAction.execute({
      id: medicalRecord?.id,
      patientId,
      doctorId,
      ...values,
    });
  };

  const appointments =
    getPatientAppointmentsAction.result?.data?.appointments || [];
  // Filtrar apenas agendamentos que não estão concluídos ou cancelados
  const availableAppointments = appointments.filter(
    (apt) => apt.status !== "concluido" && apt.status !== "cancelado",
  );

  return (
    <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
      <DialogHeader>
        <DialogTitle>
          {medicalRecord ? "Editar Prontuário" : "Novo Prontuário"}
        </DialogTitle>
        <DialogDescription>
          {medicalRecord
            ? "Edite as informações do prontuário médico."
            : "Preencha as informações para criar um novo prontuário médico."}
        </DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Seleção de Agendamento (opcional) */}
          {availableAppointments.length > 0 && (
            <FormField
              control={form.control}
              name="appointmentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Relacionar a um agendamento (opcional)</FormLabel>
                  <Select
                    onValueChange={(value) =>
                      field.onChange(value || undefined)
                    }
                    value={field.value || ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um agendamento" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableAppointments.map((appointment) => (
                        <SelectItem key={appointment.id} value={appointment.id}>
                          {(() => {
                            const utcDate = new Date(appointment.date);
                            const localDate = new Date(
                              utcDate.getTime() - 3 * 60 * 60 * 1000,
                            );
                            return localDate.toLocaleDateString("pt-BR");
                          })()}{" "}
                          -{" "}
                          {(() => {
                            const utcDate = new Date(appointment.date);
                            const localDate = new Date(
                              utcDate.getTime() - 3 * 60 * 60 * 1000,
                            );
                            return localDate.toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            });
                          })()}{" "}
                          - Dr(a). {appointment.doctor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-muted-foreground text-sm">
                    Ao relacionar a um agendamento, ele será automaticamente
                    marcado como concluído.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Sintomas */}
            <FormField
              control={form.control}
              name="symptoms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sintomas *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva os sintomas apresentados pelo paciente..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Diagnóstico */}
            <FormField
              control={form.control}
              name="diagnosis"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Diagnóstico *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Diagnóstico médico..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tratamento */}
            <FormField
              control={form.control}
              name="treatment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tratamento *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tratamento recomendado..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Medicação */}
            <FormField
              control={form.control}
              name="medication"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Medicação *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Medicamentos prescritos..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Atestado Médico */}
          <div className="rounded-lg border p-4">
            <FormField
              control={form.control}
              name="medicalCertificate"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-y-0 space-x-3">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Emitir atestado médico</FormLabel>
                    <p className="text-muted-foreground text-sm">
                      Marque esta opção se deseja emitir um atestado médico para
                      o paciente.
                    </p>
                  </div>
                </FormItem>
              )}
            />

            {watchMedicalCertificate && (
              <div className="mt-4">
                <FormField
                  control={form.control}
                  name="certificateDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dias de afastamento</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={365}
                          placeholder="Número de dias"
                          value={field.value || ""}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </div>

          {/* Observações */}
          <FormField
            control={form.control}
            name="observations"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Observações (opcional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Observações adicionais sobre a consulta..."
                    className="min-h-[80px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <DialogFooter>
            <Button
              type="submit"
              disabled={upsertMedicalRecordAction.isExecuting}
              className="w-full sm:w-auto"
            >
              {upsertMedicalRecordAction.isExecuting
                ? "Salvando..."
                : medicalRecord
                  ? "Atualizar Prontuário"
                  : "Criar Prontuário"}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
};

export default UpsertMedicalRecordForm;
