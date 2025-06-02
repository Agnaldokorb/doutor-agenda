"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { authClient } from "@/lib/auth-client";

interface DoctorLayoutProps {
  children: React.ReactNode;
}

const DoctorLayout = ({ children }: DoctorLayoutProps) => {
  const router = useRouter();
  const session = authClient.useSession();

  useEffect(() => {
    // Só executar quando a sessão estiver carregada (não em loading)
    if (session.isPending) return;

    // Verificações de autenticação e autorização
    if (!session.data?.user) {
      router.push("/authentication");
      return;
    }

    // Verificar se o usuário é médico
    if (session.data.user.userType !== "doctor") {
      router.push("/dashboard"); // Redireciona para dashboard de admin
      return;
    }

    // Verificar se precisa alterar a senha
    if (session.data.user.mustChangePassword) {
      router.push("/change-password");
      return;
    }
  }, [session.data, session.isPending, router]);

  // Mostrar loading enquanto verifica a sessão
  if (session.isPending) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Mostrar loading enquanto verifica
  if (
    !session.data?.user ||
    session.data.user.userType !== "doctor" ||
    session.data.user.mustChangePassword
  ) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
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
          <div className="flex h-20 items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Logo da clínica */}
              {session.data.user.clinic?.logoUrl ? (
                <img
                  src={session.data.user.clinic.logoUrl}
                  alt={`Logo da ${session.data.user.clinic.name}`}
                  className="h-14 w-auto rounded object-contain transition-opacity hover:opacity-80"
                  onError={(e) => {
                    // Fallback se a imagem não carregar
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                // Fallback: ícone simples se não houver logo
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-lg bg-blue-100 transition-colors hover:bg-blue-200"
                  title={session.data.user.clinic?.name || "Clínica"}
                >
                  <span className="text-xl font-bold text-blue-600">
                    {session.data.user.clinic?.name?.[0]?.toUpperCase() || "C"}
                  </span>
                </div>
              )}
              <h1 className="text-xl font-semibold text-gray-900">
                Portal do Médico
              </h1>
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
