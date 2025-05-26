
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
import { isValid, parseISO, addDays, differenceInCalendarMonths } from 'date-fns';
import { useAssets } from '@/contexts/AssetContext';
import { useSuppliers } from '@/contexts/SupplierContext';
import { useCategories } from '@/contexts/CategoryContext';
import { AssetDetailsDialog } from '@/components/assets/AssetDetailsDialog';
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog';

const initialFilters: AssetFiltersState = {
  name: '',
  supplier: '',
  invoiceNumber: '',
  categoryId: '',
  purchaseDateFrom: undefined,
  purchaseDateTo: undefined,
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
};

export interface AssetWithCalculatedValues extends Asset {
  depreciatedValue: number;
  calculatedCurrentValue: number;
  categoryName?: string;
  supplierName?: string;
}

export default function AssetsPage() {
  const { assets, deleteAsset } = useAssets();
  const { suppliers: allSuppliersFromContext, getSupplierById } = useSuppliers();
  const { categories: allCategoriesFromContext, getCategoryById } = useCategories();
  const [filters, setFilters] = useState<AssetFiltersState>(initialFilters);
  const { toast } = useToast();
  const [selectedAssetForDetails, setSelectedAssetForDetails] = useState<AssetWithCalculatedValues | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const [assetToDelete, setAssetToDelete] = useState<AssetWithCalculatedValues | null>(null);
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

  const handleViewDetails = useCallback((asset: AssetWithCalculatedValues) => {
    setSelectedAssetForDetails(asset);
    setIsDetailsDialogOpen(true);
  }, []);

  const handleDeleteAssetRequest = useCallback((asset: AssetWithCalculatedValues) => {
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
      setRowSelection({});
    }
  };
  
  const columns = useMemo(
    () => getColumns(handleViewDetails, handleDeleteAssetRequest),
    [handleViewDetails, handleDeleteAssetRequest]
  );

  const assetsWithCalculatedValues = useMemo(() => {
    const today = new Date();
    return assets
      .filter(asset => {
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
      })
      .map(asset => {
        const category = getCategoryById(asset.categoryId);
        let depreciatedValue = 0;
        let calculatedCurrentValue = asset.purchaseValue;

        if (category) {
          const purchaseDateObj = parseISO(asset.purchaseDate);
          if (isValid(purchaseDateObj)) {
            const depreciationStartDate = addDays(purchaseDateObj, 30);

            if (today >= depreciationStartDate) {
              const actualPurchaseValue = asset.purchaseValue;
              const residualAmount = actualPurchaseValue * (category.residualValuePercentage / 100);
              const depreciableBaseTotal = Math.max(0, actualPurchaseValue - residualAmount);
              
              let accumulatedDepreciation = 0;
              const assetAgeInMonthsForDepreciation = differenceInCalendarMonths(today, depreciationStartDate);


              if (assetAgeInMonthsForDepreciation > 0) {
                if (category.depreciationMethod === 'linear') {
                  if (category.usefulLifeInYears && category.usefulLifeInYears > 0) {
                    const totalUsefulLifeInMonths = category.usefulLifeInYears * 12;
                    if (totalUsefulLifeInMonths > 0) {
                      const monthlyDepreciationAmount = depreciableBaseTotal / totalUsefulLifeInMonths;
                      const effectiveMonthsToDepreciate = Math.min(assetAgeInMonthsForDepreciation, totalUsefulLifeInMonths);
                      accumulatedDepreciation = monthlyDepreciationAmount * effectiveMonthsToDepreciate;
                    }
                  } else if (category.depreciationRateValue && category.depreciationRateType) {
                    const rate = category.depreciationRateValue / 100;
                    if (category.depreciationRateType === 'annual') {
                      const annualDepreciationAmount = depreciableBaseTotal * rate;
                      const monthlyDepreciationAmount = annualDepreciationAmount / 12;
                      accumulatedDepreciation = monthlyDepreciationAmount * assetAgeInMonthsForDepreciation;
                    } else if (category.depreciationRateType === 'monthly') {
                      const monthlyDepreciationAmount = depreciableBaseTotal * rate;
                      accumulatedDepreciation = monthlyDepreciationAmount * assetAgeInMonthsForDepreciation;
                    }
                  }
                }
                // Add other depreciation methods here (e.g., reducing_balance) if needed
              }
              
              accumulatedDepreciation = Math.max(0, Math.min(accumulatedDepreciation, depreciableBaseTotal));
              depreciatedValue = accumulatedDepreciation;
              calculatedCurrentValue = actualPurchaseValue - depreciatedValue;
            }
          }
        }
        return {
          ...asset,
          depreciatedValue,
          calculatedCurrentValue,
          categoryName: categoryNameMap.get(asset.categoryId) || asset.categoryId,
          supplierName: supplierNameMap.get(asset.supplier) || asset.supplier,
        };
      });
  }, [assets, filters, getCategoryById, categoryNameMap, supplierNameMap]);


  const handleResetFilters = useCallback(() => {
    setFilters(initialFilters);
    setRowSelection({});
  }, []);

  const handleExportCSV = () => {
    if (assetsWithCalculatedValues.length === 0) {
      toast({ title: "Aviso de Exportação", description: "Nenhum ativo para exportar.", variant: "default" });
      return;
    }
    const assetsForExport = assetsWithCalculatedValues.map(asset => ({
      'ID': asset.id,
      'Data Compra': asset.purchaseDate,
      'Nome': asset.name,
      'Patrimônio': asset.assetTag,
      'Nota Fiscal': asset.invoiceNumber,
      'Nº Série': asset.serialNumber || 'N/A',
      'Categoria': asset.categoryName,
      'Fornecedor': asset.supplierName,
      'Valor Compra': asset.purchaseValue,
      'Valor Depreciado': asset.depreciatedValue,
      'Valor Atual': asset.calculatedCurrentValue,
    }));
    exportToCSV(assetsForExport, 'ativos_filtrados.csv');
    toast({ title: "Exportação Concluída", description: "Ativos exportados para CSV." });
  };

  const handleExportPDF = () => {
     if (assetsWithCalculatedValues.length === 0) {
      toast({ title: "Aviso de Exportação", description: "Nenhum ativo para exportar.", variant: "default" });
      return;
    }
    const assetsForExport = assetsWithCalculatedValues.map(asset => ({
      ...asset, // Keep original fields if needed by exportToPDF structure
      id: asset.id, // Explicitly map for clarity in PDF
      purchaseDate: asset.purchaseDate,
      name: asset.name,
      assetTag: asset.assetTag,
      invoiceNumber: asset.invoiceNumber,
      serialNumber: asset.serialNumber || 'N/A',
      category: asset.categoryName,
      supplier: asset.supplierName,
      purchaseValue: asset.purchaseValue,
      depreciatedValue: asset.depreciatedValue, // Add depreciated value
      currentValue: asset.calculatedCurrentValue, // Use calculated current value
    }));
    exportToPDF(assetsForExport, 'ativos_filtrados.pdf', [
      { header: 'ID', dataKey: 'id' },
      { header: 'Data Compra', dataKey: 'purchaseDate' },
      { header: 'Nome', dataKey: 'name' },
      { header: 'Patrimônio', dataKey: 'assetTag' },
      { header: 'Nota Fiscal', dataKey: 'invoiceNumber' },
      { header: 'Nº Série', dataKey: 'serialNumber' },
      { header: 'Categoria', dataKey: 'category' },
      { header: 'Fornecedor', dataKey: 'supplier' },
      { header: 'Valor Compra', dataKey: 'purchaseValue' },
      { header: 'Valor Depreciado', dataKey: 'depreciatedValue' },
      { header: 'Valor Atual', dataKey: 'currentValue' },
    ]);
    toast({ title: "Exportação Concluída", description: "Ativos exportados para PDF." });
  };

  const { totalPurchaseValueFiltered, totalCurrentValueFiltered, totalDepreciatedValueFiltered } = useMemo(() => {
    return assetsWithCalculatedValues.reduce(
      (acc, asset) => {
        acc.totalPurchaseValueFiltered += asset.purchaseValue;
        acc.totalDepreciatedValueFiltered += asset.depreciatedValue;
        acc.totalCurrentValueFiltered += asset.calculatedCurrentValue;
        return acc;
      },
      { totalPurchaseValueFiltered: 0, totalCurrentValueFiltered: 0, totalDepreciatedValueFiltered: 0 }
    );
  }, [assetsWithCalculatedValues]);

  const { totalPurchaseValueSelected, totalCurrentValueSelected, totalDepreciatedValueSelected } = useMemo(() => {
    let purchaseSum = 0;
    let currentSum = 0;
    let depreciatedSum = 0;
    const selectedIndices = Object.keys(rowSelection).map(Number);

    selectedIndices.forEach(index => {
      const asset = assetsWithCalculatedValues[index];
      if (asset) {
        purchaseSum += asset.purchaseValue;
        depreciatedSum += asset.depreciatedValue;
        currentSum += asset.calculatedCurrentValue;
      }
    });
    return { 
        totalPurchaseValueSelected: purchaseSum, 
        totalCurrentValueSelected: currentSum,
        totalDepreciatedValueSelected: depreciatedSum 
    };
  }, [assetsWithCalculatedValues, rowSelection]);

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
            data={assetsWithCalculatedValues} 
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
          />
        </CardContent>
        {(assetsWithCalculatedValues.length > 0 || hasSelectedItems) && (
          <CardFooter className="flex flex-col items-start space-y-2 pt-4 border-t">
            {hasSelectedItems && (
              <>
                <div className="flex justify-between w-full max-w-xs">
                  <span className="font-semibold text-primary">Total Compra Selecionado:</span>
                  <span className="font-bold text-primary">{formatCurrency(totalPurchaseValueSelected)}</span>
                </div>
                <div className="flex justify-between w-full max-w-xs">
                  <span className="font-semibold text-primary">Total Depreciado Selecionado:</span>
                  <span className="font-bold text-primary">{formatCurrency(totalDepreciatedValueSelected)}</span>
                </div>
                <div className="flex justify-between w-full max-w-xs">
                  <span className="font-semibold text-primary">Total Atual Selecionado:</span>
                  <span className="font-bold text-primary">{formatCurrency(totalCurrentValueSelected)}</span>
                </div>
                <hr className="w-full max-w-xs my-1 border-border" />
              </>
            )}
            {assetsWithCalculatedValues.length > 0 && (
              <>
                <div className="flex justify-between w-full max-w-xs">
                  <span className="font-semibold text-muted-foreground">Total Geral Compra:</span>
                  <span className="font-bold">{formatCurrency(totalPurchaseValueFiltered)}</span>
                </div>
                <div className="flex justify-between w-full max-w-xs">
                  <span className="font-semibold text-muted-foreground">Total Geral Depreciado:</span>
                  <span className="font-bold text-orange-600 dark:text-orange-500">{formatCurrency(totalDepreciatedValueFiltered)}</span>
                </div>
                <div className="flex justify-between w-full max-w-xs">
                  <span className="font-semibold text-muted-foreground">Total Geral Atual:</span>
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

    

    