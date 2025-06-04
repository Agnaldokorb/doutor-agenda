import { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { PageContainer } from "@/components/ui/page-container";
import { auth } from "@/lib/auth";

import { RevenueContent } from "./_components/revenue-content";

export const metadata: Metadata = {
  title: "Faturamento | NovoCod Med",
  description: "Relatórios detalhados de faturamento da clínica",
};

export default async function RevenuePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Verificar se o usuário está autenticado
  if (!session?.user) {
    redirect("/authentication");
  }

  // Verificar se o usuário é admin
  if (session.user.userType !== "admin") {
    redirect("/dashboard");
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Faturamento
          </h1>
          <p className="text-gray-500">
            Análise detalhada do faturamento da clínica com filtros avançados
          </p>
        </div>

        <RevenueContent />
      </div>
    </PageContainer>
  );
}
