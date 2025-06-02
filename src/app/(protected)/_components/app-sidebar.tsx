"use client";

import {
  CalendarDays,
  LayoutDashboard,
  LogOut,
  SettingsIcon,
  Stethoscope,
  UsersRound,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";

export function AppSidebar() {
  const router = useRouter();
  const session = authClient.useSession();
  const pathname = usePathname();
  const [imageError, setImageError] = useState(false);

  // Itens base disponíveis para todos os usuários autenticados
  const baseItems = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Agendamentos",
      url: "/appointments",
      icon: CalendarDays,
    },
    {
      title: "Médicos",
      url: "/doctors",
      icon: Stethoscope,
    },
    {
      title: "Pacientes",
      url: "/patients",
      icon: UsersRound,
    },
  ];

  // Itens administrativos disponíveis apenas para admins
  const adminItems = [
    {
      title: "Configurações",
      url: "/configurations",
      icon: SettingsIcon,
    },
  ];

  // Combinar itens baseado no tipo de usuário
  const items =
    session.data?.user?.userType === "admin"
      ? [...baseItems, ...adminItems]
      : baseItems;

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
    <Sidebar>
      <SidebarHeader className="border-b p-4">
        <Image src="/logo.svg" alt="Doutor Agenda" width={136} height={28} />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg">
                  <Avatar>
                    {session.data?.user?.image && !imageError ? (
                      <AvatarImage
                        src={session.data.user.image}
                        alt={session.data?.user?.name || "Avatar do usuário"}
                        onError={() => setImageError(true)}
                      />
                    ) : (
                      <AvatarFallback>
                        {session.data?.user?.name?.[0] || "U"}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <p className="text-sm">
                      {session.data?.user?.clinic?.name}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {session.data?.user.email}
                    </p>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
