"use client";

import { FileDown, FileSpreadsheet, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  exportToExcel,
  exportToPDF,
  RevenueReportData,
} from "@/helpers/export-utils";

interface RevenueExportProps {
  data: RevenueReportData | null;
  clinicName?: string;
  disabled?: boolean;
}

export function RevenueExport({
  data,
  clinicName = "Clínica",
  disabled = false,
}: RevenueExportProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = async () => {
    if (!data) {
      toast.error("Nenhum dado disponível para exportar");
      return;
    }

    try {
      setIsExporting(true);
      await new Promise((resolve) => setTimeout(resolve, 100)); // Pequeno delay para UI
      exportToPDF(data, clinicName);

      toast.success("Relatório PDF exportado com sucesso!");
    } catch (error) {
      console.error("Erro ao exportar PDF:", error);
      toast.error("Não foi possível exportar o relatório em PDF");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = async () => {
    if (!data) {
      toast.error("Nenhum dado disponível para exportar");
      return;
    }

    try {
      setIsExporting(true);
      await new Promise((resolve) => setTimeout(resolve, 100)); // Pequeno delay para UI
      exportToExcel(data, clinicName);

      toast.success("Relatório Excel exportado com sucesso!");
    } catch (error) {
      console.error("Erro ao exportar Excel:", error);
      toast.error("Não foi possível exportar o relatório em Excel");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        onClick={handleExportPDF}
        disabled={disabled || isExporting || !data}
        variant="outline"
        size="sm"
        className="text-sm"
      >
        {isExporting ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <FileDown className="mr-2 h-4 w-4" />
        )}
        Exportar PDF
      </Button>

      <Button
        onClick={handleExportExcel}
        disabled={disabled || isExporting || !data}
        variant="outline"
        size="sm"
        className="text-sm"
      >
        {isExporting ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <FileSpreadsheet className="mr-2 h-4 w-4" />
        )}
        Exportar Excel
      </Button>
    </div>
  );
}
