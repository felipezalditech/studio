
"use client";

import React, { useMemo, useCallback, useState } from 'react';
import Link from 'next/link'; // Importado
import { AssetDataTable } from '@/components/assets/AssetDataTable';
import { columns } from '@/components/assets/columns';
import type { Asset } from '@/components/assets/types';
import { AssetFilters, type AssetFiltersState } from '@/components/assets/AssetFilters';
import { Button } from '@/components/ui/button';
import { DownloadIcon, FileTextIcon, PlusCircle } from 'lucide-react'; // Importado PlusCircle
import { exportToCSV, exportToPDF } from '@/lib/export-utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { isValid, parseISO } from 'date-fns';
import { useAssets } from '@/contexts/AssetContext'; // Importado

const initialFilters: AssetFiltersState = {
  name: '',
  supplier: '',
  invoiceNumber: '',
  category: '',
  purchaseDateFrom: undefined,
  purchaseDateTo: undefined,
};

export default function AssetsPage() {
  const { assets, categories: allCategories, suppliers: allSuppliers } = useAssets(); // Usando o contexto
  const [filters, setFilters] = useState<AssetFiltersState>(initialFilters);
  const { toast } = useToast();

  const filteredAssets = useMemo(() => {
    return assets.filter(asset => {
      // A data já deve estar no formato 'yyyy-MM-dd' vindo do contexto/localStorage
      const purchaseDate = parseISO(asset.purchaseDate); 
      const dateFrom = filters.purchaseDateFrom;
      const dateTo = filters.purchaseDateTo;

      const nameMatch = asset.name.toLowerCase().includes(filters.name.toLowerCase());
      const supplierMatch = filters.supplier ? asset.supplier === filters.supplier : true;
      const invoiceMatch = asset.invoiceNumber.toLowerCase().includes(filters.invoiceNumber.toLowerCase());
      const categoryMatch = filters.category ? asset.category === filters.category : true;
      
      const dateFromMatch = dateFrom && isValid(purchaseDate) ? purchaseDate >= dateFrom : true;
      const dateToMatch = dateTo && isValid(purchaseDate) ? purchaseDate <= dateTo : true;

      return nameMatch && supplierMatch && invoiceMatch && categoryMatch && dateFromMatch && dateToMatch;
    });
  }, [assets, filters]);

  const handleResetFilters = useCallback(() => {
    setFilters(initialFilters);
  }, []);

  const handleExportCSV = () => {
    if (filteredAssets.length === 0) {
      toast({ title: "Aviso de Exportação", description: "Nenhum ativo para exportar.", variant: "destructive" });
      return;
    }
    exportToCSV(filteredAssets);
    toast({ title: "Exportação Concluída", description: "Ativos exportados para CSV." });
  };

  const handleExportPDF = () => {
     if (filteredAssets.length === 0) {
      toast({ title: "Aviso de Exportação", description: "Nenhum ativo para exportar.", variant: "destructive" });
      return;
    }
    exportToPDF(filteredAssets);
    toast({ title: "Exportação Concluída", description: "Ativos exportados para PDF." });
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold mb-6">Consultar Ativos</h1>
      <AssetFilters 
        filters={filters} 
        setFilters={setFilters} 
        categories={allCategories} // Usando categorias do contexto
        suppliers={allSuppliers}   // Usando fornecedores do contexto
        onResetFilters={handleResetFilters}
      />

      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Lista de Ativos</CardTitle>
            <CardDescription>Visualize, ordene e gerencie seus ativos imobilizados.</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Button asChild>
              <Link href="/assets/add">
                <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Ativo
              </Link>
            </Button>
            <Button onClick={handleExportCSV} variant="outline">
              <DownloadIcon className="mr-2 h-4 w-4" /> Exportar CSV
            </Button>
            <Button onClick={handleExportPDF} variant="outline">
              <FileTextIcon className="mr-2 h-4 w-4" /> Exportar PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <AssetDataTable columns={columns} data={filteredAssets} />
        </CardContent>
      </Card>
    </div>
  );
}
