
"use client";

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { ThemeToggleButton } from '@/components/theme/ThemeToggleButton';
import { BrandingModal } from '@/components/branding/BrandingModal';
import { useBranding } from '@/contexts/BrandingContext';
import {
  Home,
  ListChecks,
  BarChart3,
  Truck,
  UsersRound,
  Settings,
  LogOut,
  Briefcase,
  PanelLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button'; // Added for ThemeToggleButton wrapper
import { cn } from '@/lib/utils';

interface MenuItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

const menuItems: MenuItem[] = [
  { href: '/', label: 'Painel Principal', icon: Home },
  { href: '/assets', label: 'Consultar Ativos', icon: ListChecks },
  { href: '/reports', label: 'Relatórios', icon: BarChart3 },
  { href: '/suppliers', label: 'Fornecedores', icon: Truck },
  { href: '/users', label: 'Gerenciar Usuários', icon: UsersRound },
  { href: '/settings', label: 'Configurações', icon: Settings },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { brandingConfig } = useBranding();

  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar className="border-r border-sidebar-border" collapsible="icon">
        <SidebarHeader className="p-4 bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 overflow-hidden">
            {brandingConfig.logoUrl ? (
              <Image
                src={brandingConfig.logoUrl}
                alt={`${brandingConfig.companyName || 'Zaldi Imo'} Logo`}
                width={28}
                height={28}
                className="rounded-sm object-contain flex-shrink-0"
                data-ai-hint="company logo"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null; 
                  target.src = 'https://placehold.co/28x28.png';
                }}
              />
            ) : (
              <Briefcase className="h-7 w-7 flex-shrink-0" />
            )}
            <span className="font-semibold text-lg truncate">
              {brandingConfig.companyName || 'Zaldi Imo'}
            </span>
          </Link>
           {/* SidebarTrigger for desktop icon collapse - visible when collapsible=icon and sidebar is expanded */}
          <SidebarTrigger className="text-sidebar-primary-foreground hover:bg-sidebar-primary/90 data-[state=open]:hidden group-data-[state=expanded]:block group-data-[collapsible=offcanvas]:hidden hidden sm:flex" />
        </SidebarHeader>
        <SidebarContent className="p-2">
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href} legacyBehavior passHref>
                  <SidebarMenuButton
                    asChild={false}
                    isActive={pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))}
                    className="w-full justify-start"
                    tooltip={{ children: item.label, side: 'right', align: 'center' }}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-2 border-t border-sidebar-border">
           <SidebarMenu>
            <SidebarMenuItem className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
              <ThemeToggleButton />
            </SidebarMenuItem>
             <SidebarMenuItem>
                <SidebarMenuButton className="w-full justify-start" tooltip={{ children: 'Sair', side: 'right', align: 'center' }}>
                    <LogOut className="h-5 w-5 flex-shrink-0" />
                    <span className="truncate">Sair</span>
                </SidebarMenuButton>
             </SidebarMenuItem>
           </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className={cn(
            "sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:px-6",
            "sm:justify-end" // On sm screens and up, only BrandingModal will be on the right
        )}>
          {/* SidebarTrigger for mobile/tablet - always visible on smaller screens */}
          <div className="sm:hidden">
            <SidebarTrigger>
              <PanelLeft />
            </SidebarTrigger>
          </div>
          
          {/* Spacer for larger screens to push BrandingModal to the right */}
          <div className="hidden sm:flex flex-1" />

          <div className="flex items-center gap-2">
            <BrandingModal />
          </div>
        </header>
        <main className="flex-grow p-4 sm:p-6 overflow-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
