
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface AssetFiltersState {
  name: string;
  supplier: string;
  invoiceNumber: string;
  category: string;
  purchaseDateFrom: Date | undefined;
  purchaseDateTo: Date | undefined;
}

interface AssetFiltersProps {
  filters: AssetFiltersState;
  setFilters: Dispatch<SetStateAction<AssetFiltersState>>;
  categories: string[];
  suppliers: string[];
  onResetFilters: () => void;
}

const ALL_ITEMS_SENTINEL_VALUE = "_ALL_";

export function AssetFilters({ filters, setFilters, categories, suppliers, onResetFilters }: AssetFiltersProps) {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: keyof AssetFiltersState) => (value: string) => {
    setFilters(prev => ({ ...prev, [name]: value === ALL_ITEMS_SENTINEL_VALUE ? "" : value }));
  };

  const handleDateChange = (name: 'purchaseDateFrom' | 'purchaseDateTo') => (date: Date | undefined) => {
    setFilters(prev => ({ ...prev, [name]: date }));
  };

  return (
    <Card className="mb-6 shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl">Filter Assets</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Input
            placeholder="Filter by Name..."
            name="name"
            value={filters.name}
            onChange={handleInputChange}
            className="text-sm"
          />
          <Input
            placeholder="Filter by Invoice Number..."
            name="invoiceNumber"
            value={filters.invoiceNumber}
            onChange={handleInputChange}
            className="text-sm"
          />
           <Select value={filters.supplier} onValueChange={handleSelectChange('supplier')}>
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Filter by Supplier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_ITEMS_SENTINEL_VALUE}>All Suppliers</SelectItem>
              {suppliers.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filters.category} onValueChange={handleSelectChange('category')}>
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Filter by Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_ITEMS_SENTINEL_VALUE}>All Categories</SelectItem>
              {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
            </SelectContent>
          </Select>

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
                {filters.purchaseDateFrom && isValid(filters.purchaseDateFrom) ? format(filters.purchaseDateFrom, "PPP") : <span>Purchase Date From</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={filters.purchaseDateFrom}
                onSelect={handleDateChange('purchaseDateFrom')}
                initialFocus
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
                {filters.purchaseDateTo && isValid(filters.purchaseDateTo) ? format(filters.purchaseDateTo, "PPP") : <span>Purchase Date To</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={filters.purchaseDateTo}
                onSelect={handleDateChange('purchaseDateTo')}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="mt-4 flex justify-end">
            <Button onClick={onResetFilters} variant="outline">
                <RotateCcwIcon className="mr-2 h-4 w-4" /> Reset Filters
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}
