
"use client";

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import React, { useState, useEffect } from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from '@/components/ui/sidebar';
import { ThemeToggleButton } from '@/components/theme/ThemeToggleButton';
import { useBranding } from '@/contexts/BrandingContext';
import {
  Home,
  ListChecks,
  BarChart3,
  Truck,
  UsersRound,
  Settings,
  LogOut,
  PanelLeft,
  Building,
  ListPlus,
  Layers,
  MapPin,
  PlusCircle,
  Shapes,
  FileCog,
  Building2,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';

interface BaseMenuItem {
  label: string;
  icon: React.ElementType;
}

interface RegularMenuItem extends BaseMenuItem {
  href: string;
  isSubmenuParent?: false;
  subItems?: never;
}

interface SubmenuParentItem extends BaseMenuItem {
  href?: string;
  isSubmenuParent: true;
  subItems: RegularMenuItem[];
}

type MenuItemType = RegularMenuItem | SubmenuParentItem;

const menuItems: MenuItemType[] = [
  { href: '/', label: 'Painel principal', icon: Home },
  { href: '/assets/add', label: 'Adicionar ativo', icon: PlusCircle },
  { href: '/assets', label: 'Consultar ativos', icon: ListChecks },
  {
    label: 'Cadastros',
    icon: ListPlus,
    isSubmenuParent: true,
    subItems: [
      { href: '/suppliers', label: 'Fornecedores', icon: Truck },
      { href: '/registrations/categories', label: 'Categorias de ativos', icon: Layers },
      { href: '/registrations/locations', label: 'Locais de ativos', icon: MapPin },
      { href: '/registrations/asset-models', label: 'Modelos de ativos', icon: Shapes },
    ],
  },
  { href: '/reports', label: 'Relatórios', icon: BarChart3 },
  { href: '/users', label: 'Gerenciar usuários', icon: UsersRound },
  {
    label: 'Configurações',
    icon: Settings,
    isSubmenuParent: true,
    subItems: [
      { href: '/settings', label: 'Dados da Empresa', icon: Building2 },
      { href: '/settings/import-rules', label: 'Regras de Importação', icon: FileCog },
    ],
  },
];

const getInitials = (name: string) => {
  if (!name) return "";
  const words = name.split(" ");
  if (words.length === 1) {
    return name.substring(0, 2).toUpperCase();
  }
  return words.map((word) => word[0]).join("").substring(0, 2).toUpperCase();
};


export function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { brandingConfig } = useBranding();
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const toggleSubmenu = (label: string) => {
    setOpenSubmenus(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const handleLogout = () => {
    localStorage.removeItem('userLoggedIn');
    localStorage.removeItem('adminLoggedIn');
    router.push('/admin/login');
  };

  if (pathname.startsWith('/admin')) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar className="border-r border-sidebar-border" collapsible="none">
        <SidebarHeader className="p-4 bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 overflow-hidden">
            <span className="font-semibold text-lg truncate">
              Zaldi Imo
            </span>
          </Link>
        </SidebarHeader>
        <SidebarContent className="p-2">
          <SidebarMenu>
            {menuItems.map((item) => {
              if (item.isSubmenuParent && item.subItems) {
                const isParentActive = isClient ? item.subItems.some(subItem => pathname.startsWith(subItem.href)) : false;
                const ParentIcon = item.icon;
                const isSubmenuOpen = openSubmenus[item.label] || false;

                return (
                  <SidebarMenuItem key={item.label}>
                    {item.href ? (
                       <Link href={item.href} legacyBehavior passHref>
                        <SidebarMenuButton
                          asChild={false}
                          isActive={isSubmenuOpen || isParentActive || (item.href && pathname.startsWith(item.href))}
                          className="w-full justify-start"
                          tooltip={{ children: item.label, side: 'right', align: 'center' }}
                          onClick={() => toggleSubmenu(item.label)}
                        >
                          <ParentIcon className="h-5 w-5 flex-shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </SidebarMenuButton>
                       </Link>
                    ) : (
                      <SidebarMenuButton
                        asChild={false}
                        isActive={isSubmenuOpen || isParentActive}
                        className="w-full justify-start"
                        tooltip={{ children: item.label, side: 'right', align: 'center' }}
                        onClick={() => toggleSubmenu(item.label)}
                      >
                        <ParentIcon className="h-5 w-5 flex-shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </SidebarMenuButton>
                    )}
                    {isSubmenuOpen && (
                      <SidebarMenuSub>
                        {item.subItems.map((subItem) => {
                          const SubIcon = subItem.icon;
                          return (
                            <SidebarMenuSubItem key={subItem.href}>
                              <Link href={subItem.href} legacyBehavior passHref>
                                <SidebarMenuSubButton
                                  asChild={false}
                                  isActive={pathname.startsWith(subItem.href)}
                                >
                                  <SubIcon className="h-5 w-5 flex-shrink-0" />
                                  <span className="truncate">{subItem.label}</span>
                                </SidebarMenuSubButton>
                              </Link>
                            </SidebarMenuSubItem>
                          );
                        })}
                      </SidebarMenuSub>
                    )}
                  </SidebarMenuItem>
                );
              } else if ('href' in item) {
                const Icon = item.icon;
                
                let isActive = false;
                if (isClient) {
                   if (item.href === "/") {
                    isActive = pathname === "/";
                  } else {
                     const isMoreSpecificItemActive = menuItems.some(
                      (otherItem) =>
                        otherItem.href &&
                        pathname.startsWith(otherItem.href) &&
                        otherItem.href.length > item.href!.length
                    );

                    isActive = pathname.startsWith(item.href) && !isMoreSpecificItemActive;
                  }
                }

                return (
                  <SidebarMenuItem key={item.href}>
                    <Link href={item.href} legacyBehavior passHref>
                      <SidebarMenuButton
                        asChild={false}
                        isActive={isActive}
                        className="w-full justify-start"
                        tooltip={{ children: item.label, side: 'right', align: 'center' }}
                      >
                        <Icon className="h-5 w-5 flex-shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </SidebarMenuButton>
                    </Link>
                  </SidebarMenuItem>
                );
              }
              return null;
            })}
          </SidebarMenu>
        </SidebarContent>
        <div className="p-2 mt-auto border-t border-sidebar-border">
            <ThemeToggleButton />
        </div>
      </Sidebar>

      <SidebarInset>
        <header className={cn(
            "sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:px-6"
        )}>
          <div className="sm:hidden">
            <SidebarTrigger>
              <PanelLeft />
            </SidebarTrigger>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="h-9 w-9 cursor-pointer">
                  <AvatarImage
                    src={brandingConfig.logoUrl || undefined}
                    alt={brandingConfig.companyName ? `${brandingConfig.companyName} Logo` : 'Logo da Empresa'}
                    data-ai-hint="company logo avatar"
                  />
                  <AvatarFallback>
                    {brandingConfig.companyName ? (
                      getInitials(brandingConfig.companyName)
                    ) : (
                      <Building className="h-5 w-5" />
                    )}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-grow p-4 sm:p-6 overflow-y-auto overflow-x-hidden">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
