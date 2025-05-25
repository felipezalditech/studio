
"use client";

import React, { useMemo, useCallback, useState } from 'react';
import Link from 'next/link';
import { AssetDataTable } from '@/components/assets/AssetDataTable';
import { getColumns } from '@/components/assets/columns'; // Modificado para getColumns
import type { Asset } from '@/components/assets/types';
import { AssetFilters, type AssetFiltersState } from '@/components/assets/AssetFilters';
import { Button } from '@/components/ui/button';
import { DownloadIcon, FileTextIcon, PlusCircle } from 'lucide-react';
import { exportToCSV, exportToPDF } from '@/lib/export-utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { isValid, parseISO } from 'date-fns';
import { useAssets } from '@/contexts/AssetContext';
import { useSuppliers } from '@/contexts/SupplierContext'; // Importado

const initialFilters: AssetFiltersState = {
  name: '',
  supplier: '', // Agora representa o ID do fornecedor ou string vazia
  invoiceNumber: '',
  category: '',
  purchaseDateFrom: undefined,
  purchaseDateTo: undefined,
};

// Helper function to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
};

export default function AssetsPage() {
  const { assets } = useAssets();
  const { suppliers: allSuppliersFromContext, getSupplierById } = useSuppliers(); // Fornecedores do contexto
  const [filters, setFilters] = useState<AssetFiltersState>(initialFilters);
  const { toast } = useToast();

  // Criar um mapa de ID de fornecedor para nome para exibição na tabela
  const supplierNameMap = useMemo(() => {
    const map = new Map<string, string>();
    allSuppliersFromContext.forEach(supplier => {
      map.set(supplier.id, supplier.nomeFantasia);
    });
    return map;
  }, [allSuppliersFromContext]);

  const columns = useMemo(() => getColumns(supplierNameMap, getSupplierById), [supplierNameMap, getSupplierById]);


  const filteredAssets = useMemo(() => {
    return assets.filter(asset => {
      const purchaseDate = parseISO(asset.purchaseDate); 
      const dateFrom = filters.purchaseDateFrom;
      const dateTo = filters.purchaseDateTo;

      const nameMatch = asset.name.toLowerCase().includes(filters.name.toLowerCase());
      // asset.supplier é o ID, filters.supplier é o ID ou ""
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
    // Para CSV, pode ser útil mostrar o nome do fornecedor em vez do ID
    const assetsForExport = filteredAssets.map(asset => ({
      ...asset,
      supplier: supplierNameMap.get(asset.supplier) || asset.supplier, // Substitui ID por nome
    }));
    exportToCSV(assetsForExport, 'ativos_filtrados.csv');
    toast({ title: "Exportação Concluída", description: "Ativos exportados para CSV." });
  };

  const handleExportPDF = () => {
     if (filteredAssets.length === 0) {
      toast({ title: "Aviso de Exportação", description: "Nenhum ativo para exportar.", variant: "destructive" });
      return;
    }
    const assetsForExport = filteredAssets.map(asset => ({
      ...asset,
      supplier: supplierNameMap.get(asset.supplier) || asset.supplier, // Substitui ID por nome
    }));
    exportToPDF(assetsForExport, 'ativos_filtrados.pdf');
    toast({ title: "Exportação Concluída", description: "Ativos exportados para PDF." });
  };

  const totalPurchaseValueFiltered = useMemo(() => {
    return filteredAssets.reduce((sum, asset) => sum + asset.purchaseValue, 0);
  }, [filteredAssets]);

  const totalCurrentValueFiltered = useMemo(() => {
    return filteredAssets.reduce((sum, asset) => sum + asset.currentValue, 0);
  }, [filteredAssets]);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold mb-6">Consultar Ativos</h1>
      <AssetFilters 
        filters={filters} 
        setFilters={setFilters} 
        // categories e suppliers agora são obtidos internamente no AssetFilters
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
        {filteredAssets.length > 0 && (
          <CardFooter className="flex flex-col items-end space-y-2 pt-4 border-t">
            <div className="flex justify-between w-full max-w-xs">
              <span className="font-semibold text-muted-foreground">Total Geral Compra:</span>
              <span className="font-bold">{formatCurrency(totalPurchaseValueFiltered)}</span>
            </div>
            <div className="flex justify-between w-full max-w-xs">
              <span className="font-semibold text-muted-foreground">Total Geral Atual:</span>
              <span className="font-bold text-green-600 dark:text-green-500">{formatCurrency(totalCurrentValueFiltered)}</span>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
