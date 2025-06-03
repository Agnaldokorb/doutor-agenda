import { NextResponse } from "next/server";

import { getHealthInsurancePlans } from "@/actions/get-health-insurance-plans";

export async function GET() {
  try {
    console.log("🏥 API - Buscando planos de saúde");

    const result = await getHealthInsurancePlans();
    console.log("🔍 API - Resultado bruto:", result);

    // next-safe-action encapsula o resultado em {data: resultado}
    const plans = result?.data;
    console.log("🔍 API - Plans extraídos:", plans);

    if (Array.isArray(plans)) {
      console.log(`✅ API - Encontrados ${plans.length} planos de saúde`);
      return NextResponse.json({
        success: true,
        plans: plans,
      });
    } else {
      console.log("❌ API - Resultado não é um array");
      return NextResponse.json(
        {
          success: false,
          plans: [],
          error: "Nenhum plano encontrado",
        },
        { status: 404 },
      );
    }
  } catch (error) {
    console.error("❌ API - Erro ao buscar planos de saúde:", error);
    return NextResponse.json(
      {
        success: false,
        plans: [],
        error: "Erro interno do servidor",
      },
      { status: 500 },
    );
  }
}
