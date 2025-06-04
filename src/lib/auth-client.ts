import { customSessionClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import { auth } from "./auth";

// Determinar a URL base correta
const getBaseURL = () => {
  // Em produção
  if (process.env.NODE_ENV === "production") {
    // Se NEXT_PUBLIC_APP_URL está definida, use ela
    if (process.env.NEXT_PUBLIC_APP_URL) {
      return process.env.NEXT_PUBLIC_APP_URL;
    }

    // Fallback para detectar automaticamente no browser
    if (typeof window !== "undefined") {
      return window.location.origin;
    }

    // Último fallback para produção
    return "https://med.novocode.com.br";
  }

  // Desenvolvimento
  return "http://localhost:3000";
};

export const authClient = createAuthClient({
  baseURL: getBaseURL(),
  plugins: [customSessionClient<typeof auth>()],
});
