
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export default function AdminReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Relatórios Administrativos</h1>
          <p className="text-muted-foreground">
            Acesse relatórios sobre o uso do sistema, faturamento e outras métricas.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="mr-2 h-5 w-5 text-primary" />
            Relatórios do Sistema
          </CardTitle>
          <CardDescription>
            Esta seção está em desenvolvimento. Aqui você poderá visualizar dados e métricas importantes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Relatórios detalhados sobre empresas ativas, licenças emitidas,
            receita, e outras informações relevantes para a administração do Zaldi Imo estarão disponíveis aqui.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
