import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { auth } from "@/lib/auth";
import ResetPasswordClient from "./reset-password-client";

const ResetPasswordPage = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Se usuário já está logado, redirecionar
  if (session?.user) {
    redirect("/");
  }

  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <ResetPasswordClient />
    </Suspense>
  );
};

export default ResetPasswordPage;
