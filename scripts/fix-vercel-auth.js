#!/usr/bin/env node

/**
 * Script para diagnosticar e corrigir problemas de autenticação na Vercel
 * Uso: node scripts/fix-vercel-auth.js
 */

const https = require("https");

const VERCEL_URL = process.argv[2] || process.env.NEXT_PUBLIC_APP_URL;

if (!VERCEL_URL) {
  console.error("❌ Erro: Forneça a URL da Vercel");
  console.log(
    "Uso: node scripts/fix-vercel-auth.js https://seu-app.vercel.app",
  );
  process.exit(1);
}

async function checkEndpoint(url) {
  return new Promise((resolve) => {
    const req = https.get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(data),
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data,
            error: "Invalid JSON",
          });
        }
      });
    });

    req.on("error", (error) => {
      resolve({ error: error.message });
    });

    req.setTimeout(10000, () => {
      req.abort();
      resolve({ error: "Timeout" });
    });
  });
}

async function diagnoseAuth() {
  console.log("🔍 Diagnosticando problemas de autenticação...\n");

  // 1. Verificar debug endpoint
  console.log("1. Verificando configuração...");
  const debugUrl = `${VERCEL_URL}/api/debug-auth`.replace(/([^:]\/)\/+/g, "$1");
  const debugResult = await checkEndpoint(debugUrl);

  if (debugResult.error) {
    console.log("❌ Erro ao acessar debug:", debugResult.error);
    return;
  }

  if (debugResult.status !== 200) {
    console.log("❌ Debug endpoint falhou:", debugResult.status);
    console.log("Data:", debugResult.data);
    return;
  }

  const debug = debugResult.data;
  console.log("✅ Debug endpoint funcionando\n");

  // 2. Verificar variáveis de ambiente
  console.log("2. Verificando variáveis de ambiente:");
  const env = debug.environment;

  console.log(`   NODE_ENV: ${env.NODE_ENV}`);
  console.log(`   NEXT_PUBLIC_APP_URL: ${env.NEXT_PUBLIC_APP_URL}`);
  console.log(
    `   BETTER_AUTH_SECRET: ${env.hasBetterAuthSecret ? "✅" : "❌"}`,
  );
  console.log(`   DATABASE_URL: ${env.hasDatabaseUrl ? "✅" : "❌"}`);
  console.log(`   GOOGLE_CLIENT_ID: ${env.hasGoogleClientId ? "✅" : "❌"}`);
  console.log(
    `   GOOGLE_CLIENT_SECRET: ${env.hasGoogleClientSecret ? "✅" : "❌"}`,
  );

  // 3. Verificar banco de dados
  console.log("\n3. Verificando banco de dados:");
  console.log(`   Conexão: ${debug.database.connectionTest}`);
  console.log(`   Tabelas: ${debug.database.tablesCheck}`);

  // 4. Diagnóstico
  console.log("\n📋 DIAGNÓSTICO:");

  const issues = [];

  if (!env.hasBetterAuthSecret) {
    issues.push("❌ BETTER_AUTH_SECRET não configurado");
  }

  if (!env.hasDatabaseUrl) {
    issues.push("❌ DATABASE_URL não configurado");
  }

  if (debug.database.connectionTest.includes("failed")) {
    issues.push("❌ Conexão com banco falhando");
  }

  if (debug.database.tablesCheck.includes("failed")) {
    issues.push("❌ Erro ao verificar tabelas");
  }

  if (debug.database.tablesCheck.includes("found 0")) {
    issues.push("❌ Tabelas do BetterAuth não existem");
  }

  if (issues.length === 0) {
    console.log("✅ Todas as configurações parecem estar corretas!");
    console.log("\n🔍 Verificando auth endpoint específico...");

    // Testar endpoint problemático
    const authUrl = `${VERCEL_URL}/api/auth/sign-in/social`.replace(
      /([^:]\/)\/+/g,
      "$1",
    );
    const authResult = await checkEndpoint(authUrl);

    if (authResult.status === 405) {
      console.log(
        "✅ Auth endpoint responde (method not allowed é normal para GET)",
      );
    } else if (authResult.error) {
      console.log("❌ Auth endpoint erro:", authResult.error);
    } else {
      console.log(`⚠️  Auth endpoint status: ${authResult.status}`);
    }
  } else {
    console.log("\n🚨 PROBLEMAS ENCONTRADOS:");
    issues.forEach((issue) => console.log(`   ${issue}`));

    console.log("\n🔧 SOLUÇÕES:");

    if (!env.hasBetterAuthSecret) {
      console.log("1. Adicione BETTER_AUTH_SECRET na Vercel:");
      console.log("   - Acesse Settings → Environment Variables");
      console.log("   - Adicione: BETTER_AUTH_SECRET=sua-chave-256-bits");
      console.log("   - Gere uma chave: openssl rand -base64 32");
    }

    if (!env.hasDatabaseUrl) {
      console.log("2. Adicione DATABASE_URL na Vercel:");
      console.log("   - Configure banco PostgreSQL (Neon/Supabase)");
      console.log("   - Adicione: DATABASE_URL=postgresql://...");
    }

    if (debug.database.connectionTest.includes("failed")) {
      console.log("3. Corrija a conexão com banco:");
      console.log("   - Verifique se DATABASE_URL está correta");
      console.log("   - Certifique-se que inclui ?sslmode=require");
    }

    if (
      debug.database.tablesCheck.includes("0") ||
      debug.database.tablesCheck.includes("failed")
    ) {
      console.log("4. Execute as migrations:");
      console.log(
        '   - Local: DATABASE_URL="sua-url-producao" npx drizzle-kit push',
      );
      console.log("   - Ou use o painel do seu provedor de banco");
    }

    console.log("\n📖 Documentação completa: DEPLOY_VERCEL.md");
  }
}

// Executar diagnóstico
diagnoseAuth().catch(console.error);
