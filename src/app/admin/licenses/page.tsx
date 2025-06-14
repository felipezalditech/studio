
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { KeyRound } from "lucide-react";

export default function AdminLicensesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gerenciar Licenças</h1>
          <p className="text-muted-foreground">
            Visualize, adicione, edite e libere licenças de uso para as empresas clientes.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <KeyRound className="mr-2 h-5 w-5 text-primary" />
            Liberação e Gestão de Licenças
          </CardTitle>
          <CardDescription>
            Esta seção está em desenvolvimento. Aqui você poderá gerenciar as licenças do Zaldi Imo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Funcionalidades como listagem de licenças, criação de novas licenças,
            alteração de status e associação com empresas clientes serão implementadas aqui.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
