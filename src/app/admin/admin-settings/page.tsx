
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Configurações Administrativas</h1>
          <p className="text-muted-foreground">
            Gerencie configurações globais do sistema Zaldi Imo.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="mr-2 h-5 w-5 text-primary" />
            Configurações do Painel
          </CardTitle>
          <CardDescription>
            Esta seção está em desenvolvimento. Opções de configuração do sistema para administradores.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Configurações como tipos de planos de licença, integrações,
            parâmetros do sistema e outras opções administrativas estarão disponíveis aqui.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
