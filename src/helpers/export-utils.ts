import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

import { formatCurrencyInCents } from "./currency";

export interface RevenueReportData {
  summary: {
    totalRevenue: number;
    totalPayments: number;
    totalPatients: number;
    totalDoctors: number;
    averageTransaction: number;
  };
  timeSeries: Array<{
    date: string;
    totalRevenue: number;
    transactionCount: number;
  }>;
  paymentMethods: Array<{
    paymentMethod: string;
    totalAmount: number;
    transactionCount: number;
  }>;
  topDoctors: Array<{
    id: string;
    name: string;
    specialty: string;
    revenue: number;
    appointments: number;
  }>;
  recentTransactions: Array<{
    paymentId: string;
    patientName: string;
    doctorName: string;
    paymentMethod: string;
    amount: number;
    appointmentDate: string;
    paymentDate: string;
  }>;
  filters: {
    startDate: string;
    endDate: string;
    paymentMethod?: string;
    period: string;
  };
}

const paymentMethodLabels = {
  dinheiro: "Dinheiro",
  cartao_credito: "Cartão de Crédito",
  cartao_debito: "Cartão de Débito",
  pix: "PIX",
  cheque: "Cheque",
  transferencia_eletronica: "Transferência Eletrônica",
};

export function exportToPDF(
  data: RevenueReportData,
  clinicName: string = "Clínica",
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;

  // Título
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Relatório de Faturamento", pageWidth / 2, 25, { align: "center" });

  // Subtítulo com período
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(
    `${clinicName} - ${format(new Date(data.filters.startDate), "dd/MM/yyyy", { locale: ptBR })} a ${format(new Date(data.filters.endDate), "dd/MM/yyyy", { locale: ptBR })}`,
    pageWidth / 2,
    35,
    { align: "center" },
  );

  let yPosition = 50;

  // Resumo Executivo
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Resumo Executivo", margin, yPosition);
  yPosition += 10;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const summaryData = [
    ["Faturamento Total", formatCurrencyInCents(data.summary.totalRevenue)],
    ["Total de Pagamentos", data.summary.totalPayments.toString()],
    ["Pacientes Atendidos", data.summary.totalPatients.toString()],
    ["Médicos Ativos", data.summary.totalDoctors.toString()],
    ["Ticket Médio", formatCurrencyInCents(data.summary.averageTransaction)],
  ];

  autoTable(doc, {
    startY: yPosition,
    head: [["Métrica", "Valor"]],
    body: summaryData,
    theme: "grid",
    headStyles: { fillColor: [34, 197, 94] },
    margin: { left: margin, right: margin },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 15;

  // Top Médicos
  if (data.topDoctors.length > 0) {
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Top Médicos por Faturamento", margin, yPosition);
    yPosition += 5;

    const doctorsData = data.topDoctors
      .slice(0, 10)
      .map((doctor, index) => [
        (index + 1).toString(),
        doctor.name,
        doctor.specialty,
        formatCurrencyInCents(doctor.revenue),
        doctor.appointments.toString(),
      ]);

    autoTable(doc, {
      startY: yPosition,
      head: [["#", "Médico", "Especialidade", "Faturamento", "Consultas"]],
      body: doctorsData,
      theme: "grid",
      headStyles: { fillColor: [139, 92, 246] },
      margin: { left: margin, right: margin },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;
  }

  // Métodos de Pagamento
  if (data.paymentMethods.length > 0) {
    // Verificar se precisa de nova página
    if (yPosition > 200) {
      doc.addPage();
      yPosition = 25;
    }

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Faturamento por Método de Pagamento", margin, yPosition);
    yPosition += 5;

    const paymentData = data.paymentMethods.map((method) => [
      paymentMethodLabels[
        method.paymentMethod as keyof typeof paymentMethodLabels
      ] || method.paymentMethod,
      formatCurrencyInCents(method.totalAmount),
      method.transactionCount.toString(),
      `${((method.totalAmount / data.summary.totalRevenue) * 100).toFixed(1)}%`,
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [["Método", "Valor Total", "Transações", "% do Total"]],
      body: paymentData,
      theme: "grid",
      headStyles: { fillColor: [59, 130, 246] },
      margin: { left: margin, right: margin },
    });
  }

  // Rodapé
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} - Página ${i} de ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.height - 10,
      { align: "center" },
    );
  }

  // Download do PDF
  const fileName = `relatorio-faturamento-${format(new Date(), "yyyy-MM-dd-HHmm")}.pdf`;
  doc.save(fileName);
}

export function exportToExcel(
  data: RevenueReportData,
  clinicName: string = "Clínica",
) {
  const workbook = XLSX.utils.book_new();

  // Aba 1: Resumo Executivo
  const summaryData = [
    ["Relatório de Faturamento", ""],
    [`${clinicName}`, ""],
    [
      `Período: ${format(new Date(data.filters.startDate), "dd/MM/yyyy")} a ${format(new Date(data.filters.endDate), "dd/MM/yyyy")}`,
      "",
    ],
    ["", ""],
    ["Métrica", "Valor"],
    ["Faturamento Total", formatCurrencyInCents(data.summary.totalRevenue)],
    ["Total de Pagamentos", data.summary.totalPayments],
    ["Pacientes Atendidos", data.summary.totalPatients],
    ["Médicos Ativos", data.summary.totalDoctors],
    ["Ticket Médio", formatCurrencyInCents(data.summary.averageTransaction)],
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Resumo");

  // Aba 2: Evolução Temporal
  if (data.timeSeries.length > 0) {
    const timeSeriesData = [
      ["Data", "Faturamento", "Nº Transações"],
      ...data.timeSeries.map((item) => [
        format(new Date(item.date), "dd/MM/yyyy"),
        item.totalRevenue / 100, // Converter para valor real
        item.transactionCount,
      ]),
    ];

    const timeSeriesSheet = XLSX.utils.aoa_to_sheet(timeSeriesData);
    XLSX.utils.book_append_sheet(
      workbook,
      timeSeriesSheet,
      "Evolução Temporal",
    );
  }

  // Aba 3: Top Médicos
  if (data.topDoctors.length > 0) {
    const doctorsData = [
      [
        "Posição",
        "Médico",
        "Especialidade",
        "Faturamento",
        "Consultas",
        "Ticket Médio",
      ],
      ...data.topDoctors.map((doctor, index) => [
        index + 1,
        doctor.name,
        doctor.specialty,
        doctor.revenue / 100, // Converter para valor real
        doctor.appointments,
        doctor.appointments > 0
          ? doctor.revenue / doctor.appointments / 100
          : 0,
      ]),
    ];

    const doctorsSheet = XLSX.utils.aoa_to_sheet(doctorsData);
    XLSX.utils.book_append_sheet(workbook, doctorsSheet, "Top Médicos");
  }

  // Aba 4: Métodos de Pagamento
  if (data.paymentMethods.length > 0) {
    const paymentData = [
      ["Método de Pagamento", "Valor Total", "Nº Transações", "% do Total"],
      ...data.paymentMethods.map((method) => [
        paymentMethodLabels[
          method.paymentMethod as keyof typeof paymentMethodLabels
        ] || method.paymentMethod,
        method.totalAmount / 100, // Converter para valor real
        method.transactionCount,
        ((method.totalAmount / data.summary.totalRevenue) * 100).toFixed(2) +
          "%",
      ]),
    ];

    const paymentSheet = XLSX.utils.aoa_to_sheet(paymentData);
    XLSX.utils.book_append_sheet(
      workbook,
      paymentSheet,
      "Métodos de Pagamento",
    );
  }

  // Aba 5: Transações Recentes
  if (data.recentTransactions.length > 0) {
    const transactionsData = [
      [
        "Data Pagamento",
        "Paciente",
        "Médico",
        "Método",
        "Valor",
        "Data Consulta",
      ],
      ...data.recentTransactions.map((transaction) => [
        format(new Date(transaction.paymentDate), "dd/MM/yyyy HH:mm"),
        transaction.patientName,
        transaction.doctorName,
        paymentMethodLabels[
          transaction.paymentMethod as keyof typeof paymentMethodLabels
        ] || transaction.paymentMethod,
        transaction.amount / 100, // Converter para valor real
        format(new Date(transaction.appointmentDate), "dd/MM/yyyy HH:mm"),
      ]),
    ];

    const transactionsSheet = XLSX.utils.aoa_to_sheet(transactionsData);
    XLSX.utils.book_append_sheet(workbook, transactionsSheet, "Transações");
  }

  // Download do Excel
  const fileName = `relatorio-faturamento-${format(new Date(), "yyyy-MM-dd-HHmm")}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}
