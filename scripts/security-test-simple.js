#!/usr/bin/env node

console.log("🔒 TESTE DE CONFIGURAÇÃO DE SEGURANÇA LGPD\n");

// Teste 1: Verificar variáveis de ambiente
console.log("📋 Testando configurações de ambiente...");

const requiredEnvVars = ["NODE_ENV", "NEXT_PUBLIC_APP_URL", "DATABASE_URL"];

const recommendedEnvVars = [
  "DPO_EMAIL",
  "SENDGRID_API_KEY",
  "GOOGLE_CLIENT_ID",
];

let envScore = 0;

console.log("\n✅ Variáveis obrigatórias:");
requiredEnvVars.forEach((envVar) => {
  if (process.env[envVar]) {
    console.log(`✅ ${envVar}: Configurado`);
    envScore++;
  } else {
    console.log(`❌ ${envVar}: AUSENTE`);
  }
});

console.log("\n⚠️  Variáveis recomendadas:");
recommendedEnvVars.forEach((envVar) => {
  if (process.env[envVar]) {
    console.log(`✅ ${envVar}: Configurado`);
  } else {
    console.log(`⚠️  ${envVar}: Recomendado`);
  }
});

// Teste 2: Verificar configuração SSL do banco
console.log("\n📊 Testando configuração do banco...");

if (process.env.DATABASE_URL) {
  if (process.env.DATABASE_URL.includes("sslmode=require")) {
    console.log("✅ SSL obrigatório configurado no banco");
  } else {
    console.log("⚠️  SSL não obrigatório - adicione ?sslmode=require");
  }

  if (process.env.DATABASE_URL.includes("postgresql://")) {
    console.log("✅ PostgreSQL detectado");
  } else {
    console.log("⚠️  Banco não identificado como PostgreSQL");
  }
} else {
  console.log("❌ DATABASE_URL não configurada");
}

// Teste 3: Verificar estrutura de arquivos de segurança
console.log("\n📂 Verificando arquivos de segurança...");

const fs = require("fs");
const path = require("path");

const securityFiles = [
  "SECURITY_LGPD_SETUP.md",
  "ENV_SECURITY_GUIDE.md",
  "DPO_DOCUMENTATION.md",
  "src/helpers/audit-logger.ts",
  "src/helpers/security-monitor.ts",
];

securityFiles.forEach((file) => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}: Presente`);
  } else {
    console.log(`❌ ${file}: AUSENTE`);
  }
});

// Teste 4: Verificar configuração do Next.js
console.log("\n⚙️  Verificando configuração do Next.js...");

try {
  const nextConfigPath = path.join(process.cwd(), "next.config.ts");
  if (fs.existsSync(nextConfigPath)) {
    const configContent = fs.readFileSync(nextConfigPath, "utf8");

    if (configContent.includes("headers()")) {
      console.log("✅ Headers de segurança configurados");
    } else {
      console.log("❌ Headers de segurança não encontrados");
    }

    if (configContent.includes("Strict-Transport-Security")) {
      console.log("✅ HSTS configurado");
    } else {
      console.log("❌ HSTS não configurado");
    }

    if (configContent.includes("X-Content-Type-Options")) {
      console.log("✅ Headers anti-XSS configurados");
    } else {
      console.log("❌ Headers anti-XSS não configurados");
    }
  } else {
    console.log("❌ next.config.ts não encontrado");
  }
} catch (error) {
  console.log("❌ Erro ao verificar next.config.ts:", error.message);
}

// Resumo final
const totalRequired = requiredEnvVars.length;
const envPercentage = Math.round((envScore / totalRequired) * 100);

console.log("\n📊 RESUMO DOS TESTES");
console.log("=".repeat(50));
console.log(
  `Variáveis obrigatórias: ${envScore}/${totalRequired} (${envPercentage}%)`,
);

if (envPercentage === 100) {
  console.log("🎉 CONFIGURAÇÃO BÁSICA COMPLETA!");
  console.log("✅ Sistema pronto para testes avançados");
} else if (envPercentage >= 70) {
  console.log("⚠️  CONFIGURAÇÃO PARCIAL");
  console.log("🔧 Configure as variáveis faltantes");
} else {
  console.log("❌ CONFIGURAÇÃO INCOMPLETA");
  console.log("🚨 Sistema não está pronto para produção");
}

console.log("\n📋 PRÓXIMOS PASSOS:");
console.log("1. Configure todas as variáveis de ambiente obrigatórias");
console.log("2. Adicione sslmode=require na DATABASE_URL");
console.log("3. Execute: npm run build para testar configurações");
console.log("4. Execute: npm run start para teste em produção");
console.log("5. Acesse /configurations/security-logs para verificar auditoria");

console.log("\n📞 SUPORTE LGPD:");
console.log("DPO Email: dpo@doutoragenda.com.br");
console.log("Documentação: SECURITY_LGPD_SETUP.md");

process.exit(envPercentage >= 70 ? 0 : 1);
