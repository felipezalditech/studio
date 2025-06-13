
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LogOut, ShieldCheck, LayoutDashboard } from 'lucide-react';
import { ThemeToggleButton } from '@/components/theme/ThemeToggleButton';


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

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
    // Evita renderizar qualquer coisa no servidor que dependa do localStorage
    // ou que possa causar um flash de conteúdo protegido.
    return null; 
  }

  if (!isAdminLoggedIn && pathname !== '/admin/login') {
    // Ainda verificando ou prestes a redirecionar, renderiza null para evitar flash
    return null;
  }
  
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }


  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 w-full border-b bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <ShieldCheck className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold">Zaldi Imo - Admin</span>
          </Link>
          <div className="flex items-center space-x-3">
            <ThemeToggleButton />
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </header>
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
