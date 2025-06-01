import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { auth } from "@/lib/auth";

import { AppSidebar } from "./_components/app-sidebar";

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

const ProtectedLayout = async ({ children }: ProtectedLayoutProps) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/authentication");
  }

  return (
    <SidebarProvider>
      <div className="flex h-full w-full">
        <AppSidebar />
        <main className="flex min-h-0 w-full flex-grow flex-col overflow-hidden">
          <div className="bg-background sticky top-0 z-10 md:hidden">
            <SidebarTrigger className="p-4" />
          </div>
          <div className="w-full flex-grow overflow-auto">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default ProtectedLayout;
