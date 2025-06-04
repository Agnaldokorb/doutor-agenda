import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import AuthenticationClient from "./components/authentication-client";

const AuthenticationPage = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session?.user) {
    redirect("/");
  }

  return <AuthenticationClient />;
};

export default AuthenticationPage;
