"use client";

import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";

interface DoctorLayoutProps {
  children: React.ReactNode;
}

const DoctorLayout = ({ children }: DoctorLayoutProps) => {
  const router = useRouter();
  const session = authClient.useSession();

  // Verificações de autenticação e autorização
  if (!session.data?.user) {
    router.push("/authentication");
    return null;
  }

  // Verificar se o usuário é médico
  if (session.data.user.userType !== "doctor") {
    router.push("/dashboard"); // Redireciona para dashboard de admin
    return null;
  }

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/authentication");
        },
      },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">
                Portal do Médico
              </h1>
              <span className="text-sm text-gray-500">
                {session.data.user.clinic?.name}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Dr(a). {session.data.user.name}
              </span>
                <button
                onClick={handleSignOut}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Sair
                </button>
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
};

export default DoctorLayout;
