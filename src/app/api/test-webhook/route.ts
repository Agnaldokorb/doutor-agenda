import { NextResponse } from "next/server";

export async function GET() {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;

  return NextResponse.json({
    webhookUrl,
    hasWebhookUrl: !!webhookUrl,
    allEnvVars: Object.keys(process.env).filter(
      (key) => key.includes("N8N") || key.includes("WEBHOOK"),
    ),
  });
}
