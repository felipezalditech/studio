
"use client";

import React, { useMemo, useCallback, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
import { useLocations } from '@/contexts/LocationContext';
import { AssetDetailsDialog } from '@/components/assets/AssetDetailsDialog';
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog';
import { useBranding } from '@/contexts/BrandingContext';

const initialFilters: AssetFiltersState = {
  name: '',
  supplier: '',
  invoiceNumber: '',
  categoryId: '',
  locationId: '',
  model: '',
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
  locationName?: string;
}

export default function AssetsPage() {
  const { assets, deleteAsset } = useAssets();
  const { suppliers: allSuppliersFromContext, getSupplierById } = useSuppliers();
  const { categories: allCategoriesFromContext, getCategoryById } = useCategories();
  const { locations: allLocationsFromContext, getLocationById } = useLocations();
  const { brandingConfig } = useBranding();
  const [filters, setFilters] = useState<AssetFiltersState>(initialFilters);
  const { toast } = useToast();
  const [selectedAssetForDetails, setSelectedAssetForDetails] = useState<AssetWithCalculatedValues | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const router = useRouter();

  const [assetToDelete, setAssetToDelete] = useState<AssetWithCalculatedValues | null>(null);
  const [isConfirmDeleteAssetDialogOpen, setIsConfirmDeleteAssetDialogOpen] = useState(false);

  const supplierNameMap = useMemo(() => {
    const map = new Map<string, string>();
    allSuppliersFromContext.forEach(supplier => {
      map.set(supplier.id, supplier.nomeFantasia || supplier.razaoSocial);
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

  const locationNameMap = useMemo(() => {
    const map = new Map<string, string>();
    allLocationsFromContext.forEach(location => {
      map.set(location.id, location.name);
    });
    return map;
  }, [allLocationsFromContext]);

  const handleViewDetails = useCallback((asset: AssetWithCalculatedValues) => {
    setSelectedAssetForDetails(asset);
    setIsDetailsDialogOpen(true);
  }, []);

  const handleDeleteAssetRequest = useCallback((asset: AssetWithCalculatedValues) => {
    setAssetToDelete(asset);
    setIsConfirmDeleteAssetDialogOpen(true);
  }, []);

  const handleEditAsset = useCallback((asset: AssetWithCalculatedValues) => {
    router.push(`/assets/edit/${asset.id}`);
  }, [router]);

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
    () => getColumns(handleViewDetails, handleDeleteAssetRequest, handleEditAsset),
    [handleViewDetails, handleDeleteAssetRequest, handleEditAsset]
  );

  const assetsWithCalculatedValues = useMemo(() => {
    const today = new Date();
    return assets
      .filter(asset => {
        const purchaseDate = parseISO(asset.purchaseDate);
        const dateFrom = filters.purchaseDateFrom;
        const dateTo = filters.purchaseDateTo;
        const searchTerm = filters.name.toLowerCase();
        const modelTerm = filters.model.toLowerCase();

        const searchTermMatch = searchTerm
          ? asset.name.toLowerCase().includes(searchTerm) ||
            asset.assetTag.toLowerCase().includes(searchTerm) ||
            (asset.serialNumber && asset.serialNumber.toLowerCase().includes(searchTerm))
          : true;

        const modelMatch = modelTerm
            ? asset.model && asset.model.toLowerCase().includes(modelTerm)
            : true;

        const supplierMatch = filters.supplier ? asset.supplier === filters.supplier : true;
        const invoiceMatch = asset.invoiceNumber.toLowerCase().includes(filters.invoiceNumber.toLowerCase());
        const categoryMatch = filters.categoryId ? asset.categoryId === filters.categoryId : true;
        const locationMatch = filters.locationId ? asset.locationId === filters.locationId : true;

        const dateFromMatch = dateFrom && isValid(purchaseDate) ? purchaseDate >= dateFrom : true;
        const dateToMatch = dateTo && isValid(purchaseDate) ? purchaseDate <= dateTo : true;

        return searchTermMatch && modelMatch && supplierMatch && invoiceMatch && categoryMatch && locationMatch && dateFromMatch && dateToMatch;
      })
      .map(asset => {
        const category = getCategoryById(asset.categoryId);
        let finalDepreciatedValue = asset.previouslyDepreciatedValue || 0;
        let calculatedCurrentValue = asset.purchaseValue - finalDepreciatedValue;

        if (category) {
          const purchaseDateObj = parseISO(asset.purchaseDate);
          if (isValid(purchaseDateObj)) {
            const depreciationStartDate = addDays(purchaseDateObj, 30);

            if (today >= depreciationStartDate) {
              const actualPurchaseValue = asset.purchaseValue;
              const residualAmount = actualPurchaseValue * (category.residualValuePercentage / 100);
              const totalDepreciableOverAssetLife = Math.max(0, actualPurchaseValue - residualAmount);

              let newlyCalculatedDepreciation = 0;
              const assetAgeInMonthsForSystemDepreciation = differenceInCalendarMonths(today, depreciationStartDate);

              if (assetAgeInMonthsForSystemDepreciation > 0) {
                if (category.depreciationMethod === 'linear') {
                  let monthlyDepreciationAmount = 0;
                  if (category.usefulLifeInYears && category.usefulLifeInYears > 0) {
                    const totalUsefulLifeInMonths = category.usefulLifeInYears * 12;
                    if (totalUsefulLifeInMonths > 0) {
                      monthlyDepreciationAmount = totalDepreciableOverAssetLife / totalUsefulLifeInMonths;
                    }
                  } else if (category.depreciationRateValue && category.depreciationRateType) {
                    const rate = category.depreciationRateValue / 100;
                    if (category.depreciationRateType === 'annual') {
                      const annualDepreciationAmount = totalDepreciableOverAssetLife * rate;
                      monthlyDepreciationAmount = annualDepreciationAmount / 12;
                    } else if (category.depreciationRateType === 'monthly') {
                      monthlyDepreciationAmount = totalDepreciableOverAssetLife * rate;
                    }
                  }
                  newlyCalculatedDepreciation = monthlyDepreciationAmount * assetAgeInMonthsForSystemDepreciation;
                }
              }

              const combinedDepreciation = (asset.previouslyDepreciatedValue || 0) + newlyCalculatedDepreciation;
              finalDepreciatedValue = Math.max(0, Math.min(combinedDepreciation, totalDepreciableOverAssetLife));
              calculatedCurrentValue = actualPurchaseValue - finalDepreciatedValue;
            }
          }
        }
        return {
          ...asset,
          depreciatedValue: finalDepreciatedValue,
          calculatedCurrentValue,
          categoryName: categoryNameMap.get(asset.categoryId) || asset.categoryId,
          supplierName: supplierNameMap.get(asset.supplier) || asset.supplier,
          locationName: asset.locationId ? locationNameMap.get(asset.locationId) || asset.locationId : 'N/A',
        };
      });
  }, [assets, filters, getCategoryById, categoryNameMap, supplierNameMap, locationNameMap]);


  const handleResetFilters = useCallback(() => {
    setFilters(initialFilters);
    setRowSelection({});
  }, []);

  const handleExportCSV = () => {
    if (assetsWithCalculatedValues.length === 0) {
      toast({ title: "Aviso de exportação", description: "Nenhum ativo para exportar.", variant: "default" });
      return;
    }
    const assetsForExport = assetsWithCalculatedValues.map(asset => ({
      'ID': asset.id,
      'Data Compra': asset.purchaseDate,
      'Nome': asset.name,
      'Modelo': asset.model || 'N/A',
      'Patrimônio': asset.assetTag,
      'Nota Fiscal': asset.invoiceNumber,
      'Nº Série': asset.serialNumber || 'N/A',
      'Categoria': asset.categoryName,
      'Fornecedor': asset.supplierName,
      'Local Alocado': asset.locationName || 'N/A',
      'Valor Compra': asset.purchaseValue,
      'Valor Já Depreciado (Inicial)': asset.previouslyDepreciatedValue || 0,
      'Valor Depreciado Total': asset.depreciatedValue,
      'Valor Atual': asset.calculatedCurrentValue,
      'Informações Adicionais': asset.additionalInfo || 'N/A',
    }));
    exportToCSV(assetsForExport, 'ativos_filtrados.csv');
    toast({ title: "Exportação concluída", description: "Ativos exportados para CSV." });
  };

  const handleExportPDF = () => {
     if (assetsWithCalculatedValues.length === 0) {
      toast({ title: "Aviso de exportação", description: "Nenhum ativo para exportar.", variant: "default" });
      return;
    }
    const assetsForExport = assetsWithCalculatedValues.map(asset => ({
      ...asset,
      id: asset.id,
      purchaseDate: asset.purchaseDate,
      name: asset.name,
      model: asset.model || 'N/A',
      assetTag: asset.assetTag,
      invoiceNumber: asset.invoiceNumber,
      serialNumber: asset.serialNumber || 'N/A',
      category: asset.categoryName,
      supplier: asset.supplierName,
      location: asset.locationName || 'N/A',
      purchaseValue: asset.purchaseValue,
      previouslyDepreciatedValue: asset.previouslyDepreciatedValue || 0,
      depreciatedValue: asset.depreciatedValue,
      currentValue: asset.calculatedCurrentValue,
      additionalInfo: asset.additionalInfo || 'N/A',
    }));
    exportToPDF(assetsForExport, 'ativos_filtrados.pdf', undefined, brandingConfig.logoUrl);
    toast({ title: "Exportação concluída", description: "Ativos exportados para PDF." });
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
      <h1 className="text-3xl font-bold mb-6">Consultar ativos</h1>
      <AssetFilters
        filters={filters}
        setFilters={setFilters}
        onResetFilters={handleResetFilters}
      />

      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Lista de ativos</CardTitle>
            <CardDescription>Visualize, ordene e gerencie seus ativos imobilizados.</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Button asChild>
              <Link href="/assets/add">
                <PlusCircle className="mr-2 h-4 w-4" /> Adicionar ativo
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
          <CardFooter className="flex flex-row justify-between items-start pt-4 border-t">
            <div className="space-y-1">
              {hasSelectedItems && (
                <>
                  <div className="flex justify-between w-full max-w-xs">
                    <span className="font-semibold text-primary">Valor de compra selecionado:</span>
                    <span className="font-bold text-green-600 dark:text-green-500 ml-2">{formatCurrency(totalPurchaseValueSelected)}</span>
                  </div>
                  <div className="flex justify-between w-full max-w-xs">
                    <span className="font-semibold text-primary">Valor depreciado selecionado:</span>
                    <span className="font-bold text-red-600 dark:text-red-500 ml-2">{formatCurrency(totalDepreciatedValueSelected)}</span>
                  </div>
                  <div className="flex justify-between w-full max-w-xs">
                    <span className="font-semibold text-primary">Valor atual selecionado:</span>
                    <span className="font-bold text-orange-600 dark:text-orange-500 ml-2">{formatCurrency(totalCurrentValueSelected)}</span>
                  </div>
                </>
              )}
            </div>

            {assetsWithCalculatedValues.length > 0 && (
              <div className="space-y-1 text-right">
                 <div className="flex justify-between w-full max-w-xs">
                    <span className="font-semibold text-muted-foreground">Valor total de compra:</span>
                    <span className="font-bold text-green-600 dark:text-green-500 ml-2">{formatCurrency(totalPurchaseValueFiltered)}</span>
                  </div>
                  <div className="flex justify-between w-full max-w-xs">
                    <span className="font-semibold text-muted-foreground">Valor total depreciado:</span>
                    <span className="font-bold text-red-600 dark:text-red-500 ml-2">{formatCurrency(totalDepreciatedValueFiltered)}</span>
                  </div>
                  <div className="flex justify-between w-full max-w-xs">
                    <span className="font-semibold text-muted-foreground">Valor total atual:</span>
                    <span className="font-bold text-orange-600 dark:text-orange-500 ml-2">{formatCurrency(totalCurrentValueFiltered)}</span>
                  </div>
              </div>
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
          title="Confirmar exclusão de ativo"
          description={`Tem certeza que deseja excluir o ativo "${assetToDelete.name}"? Esta ação não pode ser desfeita.`}
        />
      )}
    </div>
  );
}
