
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LogOut, ShieldCheck, LayoutDashboard, Building, KeyRound, BarChart3, Settings as SettingsIcon, PanelLeft, Palette } from 'lucide-react';
import { ThemeToggleButton } from '@/components/theme/ThemeToggleButton';
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
import { cn } from '@/lib/utils';

interface BaseAdminMenuItem {
  label: string;
  icon: React.ElementType;
}

interface RegularAdminMenuItem extends BaseAdminMenuItem {
  href: string;
  isSubmenuParent?: false;
  subItems?: never;
}

interface SubmenuParentAdminItem extends BaseAdminMenuItem {
  href?: string; // Link opcional para o item pai
  isSubmenuParent: true;
  subItems: RegularAdminMenuItem[];
}

type AdminMenuItemType = RegularAdminMenuItem | SubmenuParentAdminItem;


const adminMenuItems: AdminMenuItemType[] = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/companies', label: 'Empresas', icon: Building },
  { href: '/admin/licenses', label: 'Licenças', icon: KeyRound },
  { href: '/admin/admin-reports', label: 'Relatórios', icon: BarChart3 },
  {
    label: 'Configurações',
    icon: SettingsIcon,
    isSubmenuParent: true,
    subItems: [
      { href: '/admin/admin-settings', label: 'Personalização', icon: Palette },
    ],
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setIsClient(true);
    const loggedIn = localStorage.getItem('adminLoggedIn') === 'true';
    setIsAdminLoggedIn(loggedIn);
    if (!loggedIn && pathname !== '/admin/login') {
      router.replace('/admin/login');
    }
  }, [router, pathname]);

  const handleLogout = () => {
    localStorage.removeItem('adminLoggedIn');
    localStorage.removeItem('userLoggedIn');
    setIsAdminLoggedIn(false);
    router.replace('/admin/login');
  };

  const toggleSubmenu = (label: string) => {
    setOpenSubmenus(prev => ({ ...prev, [label]: !prev[label] }));
  };

  if (!isClient) {
    return null;
  }

  if (!isAdminLoggedIn && pathname !== '/admin/login') {
    return null;
  }

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar className="border-r border-sidebar-border bg-sidebar text-sidebar-foreground" collapsible="none">
        <SidebarHeader className="p-4 bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-between">
          <Link href="/admin/dashboard" className="flex items-center gap-2 overflow-hidden">
            <ShieldCheck className="h-7 w-7 flex-shrink-0" />
            <span className="font-semibold text-lg truncate">
              Zaldi Imo - Admin
            </span>
          </Link>
        </SidebarHeader>
        <SidebarContent className="p-2">
          <SidebarMenu>
            {adminMenuItems.map((item) => {
              const ParentIcon = item.icon;
              if (item.isSubmenuParent && item.subItems) {
                const isParentActive = item.subItems.some(subItem => pathname.startsWith(subItem.href));
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
                return (
                  <SidebarMenuItem key={item.label}>
                    <Link href={item.href} legacyBehavior passHref>
                      <SidebarMenuButton
                        asChild={false}
                        isActive={pathname === item.href || (item.href !== "/admin/dashboard" && pathname.startsWith(item.href))}
                        className="w-full justify-start"
                        tooltip={{ children: item.label, side: 'right', align: 'center' }}
                      >
                        <ParentIcon className="h-5 w-5 flex-shrink-0" />
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
          <div className="sm:hidden"> {/* SidebarTrigger for mobile */}
            <SidebarTrigger>
              <PanelLeft />
            </SidebarTrigger>
          </div>
          <div className="flex-1" /> {/* Spacer */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </header>
        <main className="flex-grow p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
        <footer className="py-6 md:px-8 md:py-0 bg-card border-t">
            <div className="container mx-auto flex flex-col items-center justify-between gap-4 md:h-20 md:flex-row">
            <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                Painel de Administração Zaldi Imo. © {new Date().getFullYear()} Todos os direitos reservados.
            </p>
            </div>
        </footer>
      </SidebarInset>
    </SidebarProvider>
  );
}
