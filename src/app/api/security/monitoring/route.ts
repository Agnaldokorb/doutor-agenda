import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { generateSecurityReport,runSecurityMonitoring } from "@/helpers/security-monitor";
import { auth } from "@/lib/auth";

/**
 * API para monitoramento de segurança em tempo real
 * GET /api/security/monitoring - Executa monitoramento completo
 * GET /api/security/monitoring?report=true - Gera relatório de segurança
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!session.user.clinic?.id) {
      return NextResponse.json(
        { error: "Clinic not found" },
        { status: 400 }
      );
    }

    // Verificar se o usuário tem permissão (apenas admins)
    if (session.user.userType !== "admin") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const isReport = searchParams.get('report') === 'true';
    const days = parseInt(searchParams.get('days') || '7');

    if (isReport) {
      // Gerar relatório de segurança
      const report = await generateSecurityReport(session.user.clinic.id, days);
      
      return NextResponse.json({
        success: true,
        type: 'security_report',
        data: report,
        timestamp: new Date().toISOString(),
      });
    } else {
      // Executar monitoramento em tempo real
      const alerts = await runSecurityMonitoring(session.user.clinic.id);
      
      return NextResponse.json({
        success: true,
        type: 'security_monitoring',
        alerts,
        summary: {
          totalAlerts: alerts.length,
          criticalAlerts: alerts.filter(a => a.severity === 'critical').length,
          highAlerts: alerts.filter(a => a.severity === 'high').length,
          mediumAlerts: alerts.filter(a => a.severity === 'medium').length,
          lowAlerts: alerts.filter(a => a.severity === 'low').length,
        },
        timestamp: new Date().toISOString(),
      });
    }

  } catch (error) {
    console.error('❌ Erro na API de monitoramento:', error);
    
    return NextResponse.json(
      { 
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/security/monitoring - Força execução de monitoramento
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!session.user.clinic?.id) {
      return NextResponse.json(
        { error: "Clinic not found" },
        { status: 400 }
      );
    }

    // Verificar se o usuário tem permissão (apenas admins)
    if (session.user.userType !== "admin") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    // Executar monitoramento forçado
    console.log(`🔍 [FORCED MONITORING] Executando monitoramento forçado para clínica: ${session.user.clinic.id}`);
    
    const alerts = await runSecurityMonitoring(session.user.clinic.id);
    
    return NextResponse.json({
      success: true,
      message: "Monitoramento executado com sucesso",
      alerts,
      summary: {
        totalAlerts: alerts.length,
        criticalAlerts: alerts.filter(a => a.severity === 'critical').length,
        highAlerts: alerts.filter(a => a.severity === 'high').length,
        mediumAlerts: alerts.filter(a => a.severity === 'medium').length,
        lowAlerts: alerts.filter(a => a.severity === 'low').length,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Erro ao forçar monitoramento:', error);
    
    return NextResponse.json(
      { 
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
} 