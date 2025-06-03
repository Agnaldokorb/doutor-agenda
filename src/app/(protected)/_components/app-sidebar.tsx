"use client";

import {
  BuildingIcon,
  CalendarDays,
  CreditCard,
  LayoutDashboard,
  LogOut,
  SettingsIcon,
  Stethoscope,
  TrendingUp,
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

  // Itens de cobrança disponíveis para admin e atendente
  const billingItems = [
    {
      title: "Cobrança",
      url: "/billing",
      icon: CreditCard,
    },
  ];

  // Itens de faturamento disponíveis apenas para admins
  const revenueItems = [
    {
      title: "Faturamento",
      url: "/revenue",
      icon: TrendingUp,
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
  const items = [...baseItems];

  // Adicionar cobrança para admin e atendente
  if (
    session.data?.user?.userType === "admin" ||
    session.data?.user?.userType === "atendente"
  ) {
    items.push(...billingItems);
  }

  // Adicionar faturamento apenas para admin
  if (session.data?.user?.userType === "admin") {
    items.push(...revenueItems);
  }

  // Adicionar configurações apenas para admin
  if (session.data?.user?.userType === "admin") {
    items.push(...adminItems);
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

  // Obter logo da clínica
  const clinicLogo = session.data?.user?.clinic?.logoUrl;
  const clinicName = session.data?.user?.clinic?.name || "Clínica";

  return (
    <Sidebar>
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center justify-center">
          {clinicLogo && !imageError ? (
            <Image
              src={clinicLogo}
              alt={`Logo da ${clinicName}`}
              width={136}
              height={28}
              className="object-contain"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex items-center space-x-2">
              <BuildingIcon className="h-6 w-6 text-blue-600" />
              <span className="text-lg font-semibold text-gray-900">
                {clinicName}
              </span>
            </div>
          )}
        </div>
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
                      {session.data?.user.name}
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
