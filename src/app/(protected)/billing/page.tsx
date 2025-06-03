import { CreditCard } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { PageContainer } from "@/components/ui/page-container";
import { auth } from "@/lib/auth";

import { BillingPageContent } from "./_components/billing-page-content";
import { BillingStatsCards } from "./_components/billing-stats-cards";
import { PendingAppointmentsList } from "./_components/pending-appointments-list";

const BillingPage = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/authentication");
  }

  if (!session.user.clinic) {
    redirect("/clinic-form");
  }

  // Verificar se o usuário tem permissão (admin ou atendente)
  if (!["admin", "atendente"].includes(session.user.userType)) {
    redirect("/dashboard");
  }

  return (
    <PageContainer>
      <div className="space-y-8">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 p-8 text-white shadow-xl">
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                  <CreditCard className="h-10 w-10 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Sistema de Cobrança</h1>
                  <p className="text-xl text-green-100">
                    Gerenciamento de pagamentos de consultas particulares
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 h-full w-1/3 bg-gradient-to-l from-white/10 to-transparent"></div>
        </div>

        {/* Conteúdo da página com integração */}
        <BillingPageContent />
      </div>
    </PageContainer>
  );
};

export default BillingPage;
