import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

import { ChangePasswordForm } from "./_components/change-password-form";

const ChangePasswordPage = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/authentication");
  }

  // Se o usuário não precisa alterar a senha, redireciona para dashboard
  if (!session.user.mustChangePassword) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-50 via-white to-red-50 px-4 py-12">
      <div className="w-full max-w-md">
        <ChangePasswordForm isObligatory={true} />
      </div>
    </div>
  );
};

export default ChangePasswordPage;
