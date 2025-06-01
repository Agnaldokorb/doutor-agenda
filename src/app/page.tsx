import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

export default async function HomePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/authentication");
  }

  // Redirecionar baseado no tipo de usuário
  if (session.user.userType === "doctor") {
    redirect("/doctor-dashboard");
  } else {
    redirect("/dashboard");
  }
}
