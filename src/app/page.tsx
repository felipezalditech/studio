"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { AssetDataTable } from '@/components/assets/AssetDataTable';
import { columns } from '@/components/assets/columns';
import { mockAssets, categories as allCategories, suppliers as allSuppliers } from '@/components/assets/data';
import type { Asset } from '@/components/assets/types';
import { AssetFilters, type AssetFiltersState } from '@/components/assets/AssetFilters';
import { Button } from '@/components/ui/button';
import { DownloadIcon, FileTextIcon } from 'lucide-react';
import { exportToCSV, exportToPDF } from '@/lib/export-utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { isValid, parseISO } from 'date-fns';

const initialFilters: AssetFiltersState = {
  name: '',
  supplier: '',
  invoiceNumber: '',
  category: '',
  purchaseDateFrom: undefined,
  purchaseDateTo: undefined,
};

export default function AssetsPage() {
  const [assets] = useState<Asset[]>(mockAssets);
  const [filters, setFilters] = useState<AssetFiltersState>(initialFilters);
  const { toast } = useToast();

  const filteredAssets = useMemo(() => {
    return assets.filter(asset => {
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
      toast({ title: "Export Notice", description: "No assets to export.", variant: "destructive" });
      return;
    }
    exportToCSV(filteredAssets);
    toast({ title: "Export Successful", description: "Assets exported to CSV." });
  };

  const handleExportPDF = () => {
     if (filteredAssets.length === 0) {
      toast({ title: "Export Notice", description: "No assets to export.", variant: "destructive" });
      return;
    }
    exportToPDF(filteredAssets);
    toast({ title: "Export Successful", description: "Assets exported to PDF." });
  };

  return (
    <div className="space-y-8">
      <AssetFilters 
        filters={filters} 
        setFilters={setFilters} 
        categories={allCategories}
        suppliers={allSuppliers}
        onResetFilters={handleResetFilters}
      />

      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Asset List</CardTitle>
            <CardDescription>View, sort, and manage your fixed assets.</CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button onClick={handleExportCSV} variant="outline">
              <DownloadIcon className="mr-2 h-4 w-4" /> Export CSV
            </Button>
            <Button onClick={handleExportPDF} variant="outline">
              <FileTextIcon className="mr-2 h-4 w-4" /> Export PDF
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
