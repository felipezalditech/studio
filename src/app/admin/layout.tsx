
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LogOut, ShieldCheck, LayoutDashboard, Building, KeyRound, BarChart3, Settings as SettingsIcon, Menu } from 'lucide-react';
import { ThemeToggleButton } from '@/components/theme/ThemeToggleButton';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area'; // Import ScrollArea

const adminMenuItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/companies', label: 'Empresas', icon: Building },
  { href: '/admin/licenses', label: 'Licenças', icon: KeyRound },
  { href: '/admin/admin-reports', label: 'Relatórios', icon: BarChart3 },
  { href: '/admin/admin-settings', label: 'Configurações', icon: SettingsIcon },
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    setIsAdminLoggedIn(false);
    router.replace('/admin/login');
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

  const NavLinks = ({ mobile = false }: { mobile?: boolean }) => (
    adminMenuItems.map((item) => (
      <Link href={item.href} key={item.label} passHref legacyBehavior>
        <Button
          variant={pathname.startsWith(item.href) ? 'secondary' : 'ghost'}
          className={`w-full justify-start text-sm ${mobile ? 'mb-1' : ''}`}
          onClick={() => mobile && setIsMobileMenuOpen(false)}
        >
          <item.icon className="mr-2 h-4 w-4" />
          {item.label}
        </Button>
      </Link>
    ))
  );

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 w-full border-b bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="md:hidden">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Abrir menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-0">
                  <div className="flex h-16 items-center border-b px-6">
                     <Link href="/admin/dashboard" className="flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
                        <ShieldCheck className="h-7 w-7 text-primary" />
                        <span className="text-lg font-bold">Zaldi Imo - Admin</span>
                      </Link>
                  </div>
                  <ScrollArea className="h-[calc(100vh-4rem)]">
                    <nav className="flex flex-col gap-1 p-4">
                      <NavLinks mobile />
                    </nav>
                  </ScrollArea>
                </SheetContent>
              </Sheet>
            </div>
            <Link href="/admin/dashboard" className="hidden md:flex items-center gap-2">
              <ShieldCheck className="h-7 w-7 text-primary" />
              <span className="text-xl font-bold">Zaldi Imo - Admin</span>
            </Link>
          </div>
          <div className="flex items-center space-x-3">
            <ThemeToggleButton />
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <div className="hidden md:block border-b bg-card">
        <nav className="container mx-auto flex items-center space-x-1 px-4 sm:px-6 lg:px-8 h-12">
          <NavLinks />
        </nav>
      </div>

      <main className="flex-1 container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
      <footer className="py-6 md:px-8 md:py-0 bg-card border-t">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 md:h-20 md:flex-row">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            Painel de Administração Zaldi Imo. © {new Date().getFullYear()} Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
