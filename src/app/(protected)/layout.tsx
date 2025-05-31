import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

import { AppSidebar } from "./_components/app-sidebar";

export default function Layout({ children }: { children: React.ReactNode }) {
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
}
