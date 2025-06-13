
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, FileText, BarChart3 } from 'lucide-react';
import { useRouter } from 'next/navigation'; // Import useRouter

export default function AdminDashboardPage() {
  const router = useRouter(); // Initialize router

  // Placeholder functions - in a real app, these would navigate or open modals
  const handleManageCompanies = () => {
    // router.push('/admin/companies'); // Example navigation
    alert("Gerenciar Empresas (funcionalidade futura)");
  };

  const handleManageLicenses = () => {
    // router.push('/admin/licenses'); // Example navigation
    alert("Gerenciar Licenças (funcionalidade futura)");
  };

  const handleViewReports = () => {
    // router.push('/admin/reports'); // Example navigation
    alert("Visualizar Relatórios (funcionalidade futura)");
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Painel de Gestão de Licenças</h1>
          <p className="text-muted-foreground">Gerencie empresas, licenças e configurações do sistema.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">
              Gerenciar Empresas Clientes
            </CardTitle>
            <Building2 className="h-6 w-6 text-primary" />
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              Adicione, visualize e edite informações das empresas que utilizam o Zaldi Imo.
            </CardDescription>
            <Button onClick={handleManageCompanies} className="w-full">
              Acessar Empresas
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">
              Gerenciar Licenças de Uso
            </CardTitle>
            <FileText className="h-6 w-6 text-primary" />
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              Crie, atualize e controle o status das licenças para cada empresa cliente.
            </CardDescription>
            <Button onClick={handleManageLicenses} className="w-full">
              Acessar Licenças
            </Button>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">
              Relatórios do Sistema
            </CardTitle>
            <BarChart3 className="h-6 w-6 text-primary" />
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              Visualize dados de uso, faturamento e outras métricas importantes.
            </CardDescription>
            <Button onClick={handleViewReports} className="w-full" variant="outline">
              Ver Relatórios
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Atividade Recente</CardTitle>
          <CardDescription>(Placeholder para logs de atividades administrativas)</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Nenhuma atividade recente para exibir.</p>
        </CardContent>
      </Card>

    </div>
  );
}
