
"use client";

import React, { useMemo, useCallback, useState } from 'react';
import Link from 'next/link';
import type { RowSelectionState } from '@tanstack/react-table';
import { AssetDataTable } from '@/components/assets/AssetDataTable';
import { getColumns } from '@/components/assets/columns';
import type { Asset } from '@/components/assets/types';
import { AssetFilters, type AssetFiltersState } from '@/components/assets/AssetFilters';
import { Button } from '@/components/ui/button';
import { DownloadIcon, FileTextIcon, PlusCircle } from 'lucide-react';
import { exportToCSV, exportToPDF } from '@/lib/export-utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { isValid, parseISO } from 'date-fns';
import { useAssets } from '@/contexts/AssetContext';
import { useSuppliers } from '@/contexts/SupplierContext';
import { useCategories } from '@/contexts/CategoryContext';
import { AssetDetailsDialog } from '@/components/assets/AssetDetailsDialog';
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog';

const initialFilters: AssetFiltersState = {
  name: '', // Este campo será usado para nome, patrimônio ou nº de série
  supplier: '',
  invoiceNumber: '',
  categoryId: '',
  purchaseDateFrom: undefined,
  purchaseDateTo: undefined,
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
};

export default function AssetsPage() {
  const { assets, deleteAsset } = useAssets();
  const { suppliers: allSuppliersFromContext, getSupplierById } = useSuppliers();
  const { categories: allCategoriesFromContext, getCategoryById } = useCategories();
  const [filters, setFilters] = useState<AssetFiltersState>(initialFilters);
  const { toast } = useToast();
  const [selectedAssetForDetails, setSelectedAssetForDetails] = useState<Asset | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null);
  const [isConfirmDeleteAssetDialogOpen, setIsConfirmDeleteAssetDialogOpen] = useState(false);

  const supplierNameMap = useMemo(() => {
    const map = new Map<string, string>();
    allSuppliersFromContext.forEach(supplier => {
      map.set(supplier.id, supplier.nomeFantasia);
    });
    return map;
  }, [allSuppliersFromContext]);

  const categoryNameMap = useMemo(() => {
    const map = new Map<string, string>();
    allCategoriesFromContext.forEach(category => {
      map.set(category.id, category.name);
    });
    return map;
  }, [allCategoriesFromContext]);

  const handleViewDetails = useCallback((asset: Asset) => {
    setSelectedAssetForDetails(asset);
    setIsDetailsDialogOpen(true);
  }, []);

  const handleDeleteAssetRequest = useCallback((asset: Asset) => {
    setAssetToDelete(asset);
    setIsConfirmDeleteAssetDialogOpen(true);
  }, []);

  const confirmDeleteAsset = () => {
    if (assetToDelete) {
      deleteAsset(assetToDelete.id);
      toast({
        title: "Sucesso!",
        description: `Ativo "${assetToDelete.name}" deletado.`,
      });
      setAssetToDelete(null);
      setRowSelection({}); // Limpa a seleção após deletar
    }
  };

  const columns = useMemo(() => getColumns(supplierNameMap, getSupplierById, categoryNameMap, handleViewDetails, handleDeleteAssetRequest), [supplierNameMap, getSupplierById, categoryNameMap, handleViewDetails, handleDeleteAssetRequest]);


  const filteredAssets = useMemo(() => {
    return assets.filter(asset => {
      const purchaseDate = parseISO(asset.purchaseDate); 
      const dateFrom = filters.purchaseDateFrom;
      const dateTo = filters.purchaseDateTo;
      const searchTerm = filters.name.toLowerCase();

      const searchTermMatch = searchTerm 
        ? asset.name.toLowerCase().includes(searchTerm) ||
          asset.assetTag.toLowerCase().includes(searchTerm) ||
          (asset.serialNumber && asset.serialNumber.toLowerCase().includes(searchTerm))
        : true;

      const supplierMatch = filters.supplier ? asset.supplier === filters.supplier : true; 
      const invoiceMatch = asset.invoiceNumber.toLowerCase().includes(filters.invoiceNumber.toLowerCase());
      const categoryMatch = filters.categoryId ? asset.categoryId === filters.categoryId : true;
      
      const dateFromMatch = dateFrom && isValid(purchaseDate) ? purchaseDate >= dateFrom : true;
      const dateToMatch = dateTo && isValid(purchaseDate) ? purchaseDate <= dateTo : true;

      return searchTermMatch && supplierMatch && invoiceMatch && categoryMatch && dateFromMatch && dateToMatch;
    });
  }, [assets, filters]);

  const handleResetFilters = useCallback(() => {
    setFilters(initialFilters);
    setRowSelection({}); // Limpa a seleção ao resetar filtros
  }, []);

  const handleExportCSV = () => {
    if (filteredAssets.length === 0) {
      toast({ title: "Aviso de Exportação", description: "Nenhum ativo para exportar.", variant: "default" });
      return;
    }
    const assetsForExport = filteredAssets.map(asset => ({
      ...asset,
      supplier: supplierNameMap.get(asset.supplier) || asset.supplier,
      category: categoryNameMap.get(asset.categoryId) || getCategoryById(asset.categoryId)?.name || asset.categoryId,
    }));
    exportToCSV(assetsForExport, 'ativos_filtrados.csv');
    toast({ title: "Exportação Concluída", description: "Ativos exportados para CSV." });
  };

  const handleExportPDF = () => {
     if (filteredAssets.length === 0) {
      toast({ title: "Aviso de Exportação", description: "Nenhum ativo para exportar.", variant: "default" });
      return;
    }
    const assetsForExport = filteredAssets.map(asset => ({
      ...asset,
      supplier: supplierNameMap.get(asset.supplier) || asset.supplier,
      category: categoryNameMap.get(asset.categoryId) || getCategoryById(asset.categoryId)?.name || asset.categoryId,
    }));
    exportToPDF(assetsForExport, 'ativos_filtrados.pdf');
    toast({ title: "Exportação Concluída", description: "Ativos exportados para PDF." });
  };

  const { totalPurchaseValueFiltered, totalCurrentValueFiltered } = useMemo(() => {
    return filteredAssets.reduce(
      (acc, asset) => {
        acc.totalPurchaseValueFiltered += asset.purchaseValue;
        acc.totalCurrentValueFiltered += asset.currentValue;
        return acc;
      },
      { totalPurchaseValueFiltered: 0, totalCurrentValueFiltered: 0 }
    );
  }, [filteredAssets]);

  const { totalPurchaseValueSelected, totalCurrentValueSelected } = useMemo(() => {
    let purchaseSum = 0;
    let currentSum = 0;
    const selectedIndices = Object.keys(rowSelection).map(Number);

    selectedIndices.forEach(index => {
      const asset = filteredAssets[index];
      if (asset) {
        purchaseSum += asset.purchaseValue;
        currentSum += asset.currentValue;
      }
    });
    return { totalPurchaseValueSelected: purchaseSum, totalCurrentValueSelected: currentSum };
  }, [filteredAssets, rowSelection]);

  const hasSelectedItems = Object.keys(rowSelection).length > 0;


  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold mb-6">Consultar Ativos</h1>
      <AssetFilters 
        filters={filters} 
        setFilters={setFilters} 
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
          <AssetDataTable 
            columns={columns} 
            data={filteredAssets} 
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
          />
        </CardContent>
        {(filteredAssets.length > 0 || hasSelectedItems) && (
          <CardFooter className="flex flex-col items-end space-y-2 pt-4 border-t">
            {hasSelectedItems && (
              <>
                <div className="flex justify-between w-full max-w-xs">
                  <span className="font-semibold text-primary">Total Compra Selecionado:</span>
                  <span className="font-bold text-primary">{formatCurrency(totalPurchaseValueSelected)}</span>
                </div>
                <div className="flex justify-between w-full max-w-xs">
                  <span className="font-semibold text-primary">Total Atual Selecionado:</span>
                  <span className="font-bold text-primary">{formatCurrency(totalCurrentValueSelected)}</span>
                </div>
                <hr className="w-full max-w-xs my-1 border-border" />
              </>
            )}
            {filteredAssets.length > 0 && (
              <>
                <div className="flex justify-between w-full max-w-xs">
                  <span className="font-semibold text-muted-foreground">Total Geral Compra (Filtrado):</span>
                  <span className="font-bold">{formatCurrency(totalPurchaseValueFiltered)}</span>
                </div>
                <div className="flex justify-between w-full max-w-xs">
                  <span className="font-semibold text-muted-foreground">Total Geral Atual (Filtrado):</span>
                  <span className="font-bold text-green-600 dark:text-green-500">{formatCurrency(totalCurrentValueFiltered)}</span>
                </div>
              </>
            )}
          </CardFooter>
        )}
      </Card>

      <AssetDetailsDialog
        asset={selectedAssetForDetails}
        open={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
      />

      {assetToDelete && (
        <ConfirmationDialog
          open={isConfirmDeleteAssetDialogOpen}
          onOpenChange={setIsConfirmDeleteAssetDialogOpen}
          onConfirm={confirmDeleteAsset}
          title="Confirmar Exclusão de Ativo"
          description={`Tem certeza que deseja excluir o ativo "${assetToDelete.name}"? Esta ação não pode ser desfeita.`}
        />
      )}
    </div>
  );
}
