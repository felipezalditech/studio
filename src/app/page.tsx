
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle, Search, BarChart3 } from "lucide-react";

export default function DashboardPage() {
  // Dados de exemplo - substitua por dados reais ou chamadas de API
  const totalAssets = 3;
  const totalPurchaseValue = 1750.00;
  const totalCurrentValue = 1750.00;
  const totalDepreciation = 0.00;

  const recentAssets = [
    { name: "CAMARA", category: "Eletrônicos", currentValue: 250.00, purchaseDate: "24/05/2025" },
    { name: "CELULAR 2", category: "Eletrônicos", currentValue: 500.00, purchaseDate: "24/05/2025" },
    { name: "CELULAR", category: "Eletrônicos", currentValue: 1000.00, purchaseDate: "30/04/2025" },
  ];

  const highlights = {
    mostValuable: { name: "CELULAR", value: 1000.00 },
    oldestAsset: { name: "CELULAR", acquiredDate: "30/04/2025" },
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Bem-vindo(a) de volta, FELIPE!</h1>
        <p className="text-muted-foreground">Aqui está um resumo rápido do status dos seus ativos imobilizados.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Ativos</CardTitle>
            {/* Placeholder icon */}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAssets}</div>
            <p className="text-xs text-muted-foreground">ativos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total de Compra</CardTitle>
            {/* Placeholder icon */}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {totalPurchaseValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Atual Total</CardTitle>
            {/* Placeholder icon */}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {totalCurrentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Depreciação Total</CardTitle>
            {/* Placeholder icon */}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">R$ {totalDepreciation.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Atalhos Rápidos</CardTitle>
            <CardDescription>Acesse as principais funcionalidades do sistema.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Button variant="outline" asChild className="py-6 text-base">
              <Link href="/assets/add"> {/* Supondo uma rota para adicionar ativos */}
                <PlusCircle className="mr-2 h-5 w-5" /> Adicionar Ativo
              </Link>
            </Button>
            <Button variant="outline" asChild className="py-6 text-base">
              <Link href="/assets">
                <Search className="mr-2 h-5 w-5" /> Consultar Ativos
              </Link>
            </Button>
            <Button variant="outline" asChild className="py-6 text-base">
              <Link href="/reports">
                <BarChart3 className="mr-2 h-5 w-5" /> Ver Relatórios
              </Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Destaques</CardTitle>
            <CardDescription>Informações importantes sobre seus ativos.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium">Ativo Mais Valioso</p>
              <p className="text-lg text-primary">{highlights.mostValuable.name}</p>
              <p className="text-sm text-muted-foreground">R$ {highlights.mostValuable.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Ativo Mais Antigo</p>
              <p className="text-lg text-primary">{highlights.oldestAsset.name}</p>
              <p className="text-sm text-muted-foreground">Adquirido em: {highlights.oldestAsset.acquiredDate}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Visão Geral dos Ativos Recentes</CardTitle>
          <CardDescription>Os últimos ativos adicionados ou atualizados.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-semibold">Nome</th>
                  <th className="text-left p-2 font-semibold">Categoria</th>
                  <th className="text-right p-2 font-semibold">Valor Atual</th>
                  <th className="text-right p-2 font-semibold">Data de Compra</th>
                </tr>
              </thead>
              <tbody>
                {recentAssets.map((asset, index) => (
                  <tr key={index} className="border-b last:border-b-0 hover:bg-muted/50">
                    <td className="p-2">{asset.name}</td>
                    <td className="p-2">{asset.category}</td>
                    <td className="text-right p-2">R$ {asset.currentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td className="text-right p-2">{asset.purchaseDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
