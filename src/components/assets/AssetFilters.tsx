
"use client";

import type { Dispatch, SetStateAction } from 'react';
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, RotateCcwIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { format, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCategories } from '@/contexts/CategoryContext';
import { useLocations } from '@/contexts/LocationContext';
import { AssetModelCombobox } from '@/components/asset-models/AssetModelCombobox';
import { SupplierCombobox } from '@/components/suppliers/SupplierCombobox'; // Importado

export interface AssetFiltersState {
  name: string;
  supplier: string; // Armazena o ID do fornecedor
  invoiceNumber: string;
  categoryId: string;
  locationId: string;
  modelId: string;
  purchaseDateFrom: Date | undefined;
  purchaseDateTo: Date | undefined;
}

interface AssetFiltersProps {
  filters: AssetFiltersState;
  setFilters: Dispatch<SetStateAction<AssetFiltersState>>;
  onResetFilters: () => void;
}

const ALL_ITEMS_SENTINEL_VALUE = "_ALL_";

export function AssetFilters({ filters, setFilters, onResetFilters }: AssetFiltersProps) {
  const { categories: allCategoriesFromContext } = useCategories();
  const { locations: allLocationsFromContext } = useLocations();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: keyof AssetFiltersState) => (value: string) => {
    setFilters(prev => ({ ...prev, [name]: value === ALL_ITEMS_SENTINEL_VALUE ? "" : value }));
  };

  const handleComboboxChange = (name: keyof AssetFiltersState) => (value: string | undefined) => {
    setFilters(prev => ({ ...prev, [name]: value || "" }));
  };

  const handleDateChange = (name: 'purchaseDateFrom' | 'purchaseDateTo') => (date: Date | undefined) => {
    setFilters(prev => ({ ...prev, [name]: date }));
  };

  return (
    <Card className="mb-6 shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl">Filtrar ativos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Input
            placeholder="Nome, patrimônio ou nº série..."
            name="name"
            value={filters.name}
            onChange={handleInputChange}
            className="text-sm"
          />
          <Input
            placeholder="Filtrar por nº da fatura..."
            name="invoiceNumber"
            value={filters.invoiceNumber}
            onChange={handleInputChange}
            className="text-sm"
          />
           <SupplierCombobox
            value={filters.supplier}
            onChange={handleComboboxChange('supplier')}
          />
          <Select value={filters.categoryId || ALL_ITEMS_SENTINEL_VALUE} onValueChange={handleSelectChange('categoryId')}>
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Filtrar por categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_ITEMS_SENTINEL_VALUE}>Todas as categorias</SelectItem>
              {allCategoriesFromContext.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filters.locationId || ALL_ITEMS_SENTINEL_VALUE} onValueChange={handleSelectChange('locationId')}>
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Filtrar por local alocado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_ITEMS_SENTINEL_VALUE}>Todos os locais</SelectItem>
              {allLocationsFromContext.map(loc => <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>)}
            </SelectContent>
          </Select>
          
          <AssetModelCombobox
            value={filters.modelId}
            onChange={handleComboboxChange('modelId')}
          />

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal text-sm",
                  !filters.purchaseDateFrom && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.purchaseDateFrom && isValid(filters.purchaseDateFrom) ? format(filters.purchaseDateFrom, "PPP", { locale: ptBR }) : <span>Data da compra (de)</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={filters.purchaseDateFrom}
                onSelect={handleDateChange('purchaseDateFrom')}
                initialFocus
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal text-sm",
                  !filters.purchaseDateTo && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.purchaseDateTo && isValid(filters.purchaseDateTo) ? format(filters.purchaseDateTo, "PPP", { locale: ptBR }) : <span>Data da compra (até)</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={filters.purchaseDateTo}
                onSelect={handleDateChange('purchaseDateTo')}
                initialFocus
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="mt-4 flex justify-end">
          <Button
            onClick={onResetFilters}
            className="w-full md:w-auto bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            <RotateCcwIcon className="mr-2 h-4 w-4" /> Redefinir filtros
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
