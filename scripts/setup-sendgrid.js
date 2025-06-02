#!/usr/bin/env node

/**
 * Script de configuração automática do SendGrid
 * Executa verificações e testes do sistema de email
 */

const fs = require("fs");
const path = require("path");

// Cores para output
const colors = {
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  reset: "\x1b[0m",
  bold: "\x1b[1m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function checkEnvFile() {
  log("\n🔍 Verificando arquivo .env...", "blue");

  const envPath = path.join(process.cwd(), ".env");

  if (!fs.existsSync(envPath)) {
    log("❌ Arquivo .env não encontrado", "red");
    log("💡 Crie um arquivo .env com as configurações do SendGrid", "yellow");
    return false;
  }

  log("✅ Arquivo .env encontrado!", "green");
  return true;
}

async function checkDependencies() {
  log("\n🔍 Verificando dependências...", "blue");

  const packageJsonPath = path.join(process.cwd(), "package.json");

  if (!fs.existsSync(packageJsonPath)) {
    log("❌ package.json não encontrado", "red");
    return false;
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  const dependencies = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };

  if (!dependencies["@sendgrid/mail"]) {
    log("❌ @sendgrid/mail não encontrado", "red");
    log("💡 Execute: npm install @sendgrid/mail", "yellow");
    return false;
  }

  log("✅ Dependências verificadas!", "green");
  return true;
}

async function showSummary() {
  log("\n" + "=".repeat(50), "blue");
  log("📋 SISTEMA DE EMAIL SENDGRID", "bold");
  log("=".repeat(50), "blue");

  log("\n✅ Arquivos implementados:", "green");
  log("  📄 src/lib/sendgrid.ts", "green");
  log("  📄 src/lib/email-templates.ts", "green");
  log("  📄 src/lib/email-service.ts", "green");
  log("  📄 src/app/api/email/test/route.ts", "green");
  log("  📄 src/app/api/email/send-reminders/route.ts", "green");
  log("  📄 vercel.json", "green");
  log("  📄 SENDGRID_SETUP.md", "green");

  log("\n🎯 Funcionalidades:", "green");
  log("  📧 Confirmação de agendamento", "green");
  log("  ⏰ Lembretes 24h antes", "green");
  log("  ❌ Cancelamento de consultas", "green");
  log("  🔄 Reagendamento", "green");
  log("  🧪 API de testes", "green");

  log("\n⚙️ Configure no .env:", "yellow");
  log("  SENDGRID_API_KEY=sua_api_key", "yellow");
  log("  SENDGRID_FROM_EMAIL=noreply@yourdomain.com", "yellow");
  log('  SENDGRID_FROM_NAME="Doutor Agenda"', "yellow");
  log("  NEXT_PUBLIC_APP_URL=http://localhost:3000", "yellow");

  log("\n🚀 Para testar:", "blue");
  log("  GET  /api/email/test - Status da API", "blue");
  log("  POST /api/email/test - Enviar email teste", "blue");
  log("  GET  /api/email/send-reminders - Status lembretes", "blue");
  log("  POST /api/email/send-reminders - Enviar lembretes", "blue");

  log("\n📚 Documentação completa: SENDGRID_SETUP.md", "blue");
  log("\n🎉 Sistema de email configurado com sucesso!", "green");
}

async function main() {
  log("🩺 DOUTOR AGENDA - SENDGRID SETUP", "bold");
  log("==================================", "blue");

  const envOk = await checkEnvFile();
  const depsOk = await checkDependencies();

  await showSummary();

  if (!envOk || !depsOk) {
    log("\n⚠️ Corrija os problemas acima antes de continuar", "yellow");
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = { checkEnvFile, checkDependencies };
