
"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle, Search, BarChart3, ShoppingCart, TrendingUp, TrendingDown, DollarSign, CalendarDays, Award, Clock, PieChart as PieChartIcon, BarChartBig, Loader2, Filter, MapPin } from "lucide-react";
import { useAssets } from '@/contexts/AssetContext';
import { useCategories } from '@/contexts/CategoryContext';
import { useLocations } from '@/contexts/LocationContext';
import { useAssetModels } from '@/contexts/AssetModelContext'; // Import useAssetModels
import { parseISO, format as formatDateFn, isValid, addDays, differenceInCalendarMonths, subDays, subMonths, subYears, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Pie, PieChart, Cell } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
};

const formatDate = (dateString: string) => {
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) {
        return dateString;
    }
    return formatDateFn(date, 'dd/MM/yyyy', { locale: ptBR });
  } catch (error) {
    console.error("Erro ao formatar data:", dateString, error);
    return dateString;
  }
};

interface ValueByLocation {
  locationName: string;
  totalCurrentValue: number;
}

interface DashboardDataType {
  totalAssets: number;
  totalPurchaseValue: number;
  totalCurrentValue: number;
  totalDepreciation: number;
  recentAssets: Array<{ id: string; name: string; modelName?: string; category: string; currentValue: number; purchaseDate: string }>;
  highlights: {
    mostValuable: { name: string; value: number };
    oldestAsset: { name: string; acquiredDate: string };
  };
  valueByLocation: ValueByLocation[];
}

interface ChartDataType {
  pieChartData: Array<{ name: string; value: number; fill: string }>;
  barChartData: Array<{ category: string; valorCompra: number; valorDepreciado: number; valorAtual: number }>;
  // pieChartConfig é inferido ou não usado se a legenda é totalmente customizada
  barChartConfig: ChartConfig;
}

const dateFilterOptions = [
  { value: 'allTime', label: 'Todo o período' },
  { value: 'last7days', label: 'Últimos 7 dias' },
  { value: 'last30days', label: 'Últimos 30 dias' },
  { value: 'last3months', label: 'Últimos 3 meses' },
  { value: 'last6months', label: 'Últimos 6 meses' },
  { value: 'last12months', label: 'Últimos 12 meses' },
];


export default function DashboardPage() {
  const { assets } = useAssets();
  const { getCategoryById } = useCategories();
  const { locations, getLocationById } = useLocations();
  const { getAssetModelNameById } = useAssetModels(); // Get model name function
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardDataType | null>(null);
  const [chartData, setChartData] = useState<ChartDataType | null>(null);
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('allTime');

  useEffect(() => {
    if (assets.length === 0 && typeof window !== 'undefined' && !localStorage.getItem('assets')) {
        // Still might be loading from localStorage or there are truly no assets
    }

    const today = new Date();
    let filterStartDate: Date | null = null;

    switch (selectedDateFilter) {
      case 'last7days':
        filterStartDate = startOfDay(subDays(today, 7));
        break;
      case 'last30days':
        filterStartDate = startOfDay(subMonths(today, 1));
        break;
      case 'last3months':
        filterStartDate = startOfDay(subMonths(today, 3));
        break;
      case 'last6months':
        filterStartDate = startOfDay(subMonths(today, 6));
        break;
      case 'last12months':
        filterStartDate = startOfDay(subYears(today, 1));
        break;
      case 'allTime':
      default:
        filterStartDate = null; // No date filtering
        break;
    }

    const assetsToDisplay = filterStartDate
      ? assets.filter(asset => {
          const purchaseDate = parseISO(asset.purchaseDate);
          return isValid(purchaseDate) && purchaseDate >= filterStartDate!;
        })
      : assets;


    const processedAssets = assetsToDisplay.map(asset => {
      const category = getCategoryById(asset.categoryId);
      const modelName = getAssetModelNameById(asset.modelId);
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
      return { ...asset, calculatedCurrentValue, finalDepreciatedValue, categoryName: category?.name || 'Desconhecida', modelName };
    });

    let totalPurchaseValue = 0;
    let totalCurrentValue = 0;
    let totalDepreciation = 0;

    processedAssets.forEach(asset => {
      totalPurchaseValue += asset.purchaseValue;
      totalDepreciation += asset.finalDepreciatedValue;
      totalCurrentValue += asset.calculatedCurrentValue;
    });

    const recentAssets = [...processedAssets]
        .sort((a, b) => {
            const dateA = parseISO(a.purchaseDate);
            const dateB = parseISO(b.purchaseDate);
            if (!isValid(dateA) && !isValid(dateB)) return 0;
            if (!isValid(dateA)) return 1;
            if (!isValid(dateB)) return -1;
            return dateB.getTime() - dateA.getTime();
        })
        .slice(0, 5)
        .map(asset => ({
            id: asset.id,
            name: asset.name,
            modelName: asset.modelName || 'N/A',
            category: asset.categoryName,
            currentValue: asset.calculatedCurrentValue,
            purchaseDate: formatDate(asset.purchaseDate),
        }));

    let mostValuable = { name: "N/A", value: 0 };
    if (processedAssets.length > 0) {
      const sortedByValue = [...processedAssets].sort((a, b) => b.calculatedCurrentValue - a.calculatedCurrentValue);
      if (sortedByValue.length > 0 && sortedByValue[0]) {
          mostValuable = { name: sortedByValue[0].name, value: sortedByValue[0].calculatedCurrentValue };
      }
    }

    let oldestAsset = { name: "N/A", acquiredDate: "N/A" };
    if (processedAssets.length > 0) {
      const sortedByDate = [...processedAssets].sort((a, b) => {
        const dateA = parseISO(a.purchaseDate);
        const dateB = parseISO(b.purchaseDate);
        if (!isValid(dateA) && !isValid(dateB)) return 0;
        if (!isValid(dateA)) return 1;
        if (!isValid(dateB)) return -1;
        return dateA.getTime() - dateB.getTime();
      });
      if (sortedByDate.length > 0 && sortedByDate[0]) {
          oldestAsset = { name: sortedByDate[0].name, acquiredDate: formatDate(sortedByDate[0].purchaseDate) };
      }
    }

    const valueByLocationMap = new Map<string, number>();
    processedAssets.forEach(asset => {
      if (asset.locationId) {
        const currentTotal = valueByLocationMap.get(asset.locationId) || 0;
        valueByLocationMap.set(asset.locationId, currentTotal + asset.calculatedCurrentValue);
      }
    });

    const valueByLocationData: ValueByLocation[] = [];
    valueByLocationMap.forEach((totalValue, locationId) => {
      const location = getLocationById(locationId);
      if (location) {
        valueByLocationData.push({ locationName: location.name, totalCurrentValue: totalValue });
      }
    });
     valueByLocationData.sort((a, b) => b.totalCurrentValue - a.totalCurrentValue);


    const newDashboardData = {
      totalAssets: assetsToDisplay.length,
      totalPurchaseValue,
      totalCurrentValue,
      totalDepreciation,
      recentAssets,
      highlights: {
        mostValuable,
        oldestAsset,
      },
      valueByLocation: valueByLocationData,
    };
    setDashboardData(newDashboardData);


    const categoryCounts: { [categoryId: string]: { name: string; count: number } } = {};
    const categoryValues: { [categoryId: string]: { name: string; purchaseValue: number; currentValue: number; depreciatedValue: number } } = {};

    processedAssets.forEach(asset => {
      const categoryName = asset.categoryName || 'Desconhecida';
      if (categoryCounts[asset.categoryId]) {
        categoryCounts[asset.categoryId].count++;
      } else {
        categoryCounts[asset.categoryId] = { name: categoryName, count: 1 };
      }
      if (categoryValues[asset.categoryId]) {
        categoryValues[asset.categoryId].purchaseValue += asset.purchaseValue;
        categoryValues[asset.categoryId].currentValue += asset.calculatedCurrentValue;
        categoryValues[asset.categoryId].depreciatedValue += asset.finalDepreciatedValue;
      } else {
        categoryValues[asset.categoryId] = {
          name: categoryName,
          purchaseValue: asset.purchaseValue,
          currentValue: asset.calculatedCurrentValue,
          depreciatedValue: asset.finalDepreciatedValue,
        };
      }
    });

    const chartColors = [
      "hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))",
      "hsl(var(--chart-4))", "hsl(var(--chart-5))",
    ];
    const pieChartData = Object.values(categoryCounts).map((cat, index) => ({
      name: cat.name, value: cat.count, fill: chartColors[index % chartColors.length],
    }));

    const barChartData = Object.values(categoryValues).map(cat => ({
      category: cat.name,
      valorCompra: cat.purchaseValue,
      valorDepreciado: cat.depreciatedValue,
      valorAtual: cat.currentValue,
    }));

    const barChartConfig = {
      valorCompra: { label: "Valor de compra", color: "hsl(var(--chart-2))" },
      valorDepreciado: { label: "Valor depreciado", color: "hsl(var(--chart-3))" },
      valorAtual: { label: "Valor atual", color: "hsl(var(--chart-1))" },
      category: { label: "Categoria" },
    } as ChartConfig;

    setChartData({ pieChartData, barChartData, barChartConfig });
    setIsLoading(false);

  }, [assets, getCategoryById, selectedDateFilter, getLocationById, locations, getAssetModelNameById]);

  if (isLoading || !dashboardData || !chartData) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">Carregando dados do painel...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Bem-vindo(a) de volta!</h1>
          <p className="text-muted-foreground">Aqui está um resumo rápido do status dos seus ativos imobilizados.</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
           <Filter className="h-5 w-5 text-muted-foreground" />
           <Select value={selectedDateFilter} onValueChange={setSelectedDateFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filtrar por período" />
            </SelectTrigger>
            <SelectContent>
              {dateFilterOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>


      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de ativos</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.totalAssets}</div>
            <p className="text-xs text-muted-foreground">
              {selectedDateFilter === 'allTime' ? 'ativos cadastrados' : `ativos no período selecionado`}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor total de compra</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-500">{formatCurrency(dashboardData.totalPurchaseValue)}</div>
             <p className="text-xs text-muted-foreground">custo de aquisição total {selectedDateFilter !== 'allTime' && '(no período)'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Depreciação total</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500 dark:text-red-600">{formatCurrency(dashboardData.totalDepreciation)}</div>
            <p className="text-xs text-muted-foreground">depreciação acumulada {selectedDateFilter !== 'allTime' && '(no período)'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor atual total</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-500">{formatCurrency(dashboardData.totalCurrentValue)}</div>
             <p className="text-xs text-muted-foreground">valor líquido contábil {selectedDateFilter !== 'allTime' && '(no período)'}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChartIcon className="mr-2 h-5 w-5" />
              Contagem de ativos por categoria
            </CardTitle>
            <CardDescription>Distribuição quantitativa dos seus ativos por categoria {selectedDateFilter !== 'allTime' && '(no período selecionado)'}.</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.pieChartData.length > 0 ? (
              <ChartContainer config={{}} className="mx-auto aspect-square max-h-[300px]">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="name" />} />
                  <Pie
                    data={chartData.pieChartData}
                    dataKey="value"
                    nameKey="name"
                    labelLine={false}
                    outerRadius="75%"
                    label={({ value }) => {
                        if (value < (dashboardData.totalAssets * 0.02) && dashboardData.totalAssets > 10) return null; // Oculta para fatias muito pequenas
                        return `${value}`;
                      }
                    }
                  >
                     {chartData.pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartLegend
                    content={(props) => {
                      const { payload } = props;
                      return (
                        <div className="flex items-center justify-center gap-x-4 gap-y-2 flex-wrap pt-3">
                          {payload?.map((entry: any, index: number) => {
                            const categoryName = entry.value;
                            const categoryCount = entry.payload?.value;
                            const percentage = dashboardData.totalAssets > 0
                              ? ((categoryCount / dashboardData.totalAssets) * 100).toFixed(1)
                              : "0.0";
                            return (
                              <div key={`legend-${index}`} className="flex items-center gap-1.5 text-xs">
                                <span
                                  className="h-2 w-2 shrink-0 rounded-[2px]"
                                  style={{ backgroundColor: entry.color }}
                                />
                                <span>{categoryName}: {percentage}%</span>
                              </div>
                            );
                          })}
                        </div>
                      );
                    }}
                  />
                </PieChart>
              </ChartContainer>
            ) : (
              <p className="text-muted-foreground text-center py-4">Nenhum dado disponível para este gráfico {selectedDateFilter !== 'allTime' && 'no período selecionado'}.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChartBig className="mr-2 h-5 w-5" />
              Valores por categoria
            </CardTitle>
            <CardDescription>Comparativo do valor de compra, atual e depreciado por categoria {selectedDateFilter !== 'allTime' && '(no período selecionado)'}.</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.barChartData.length > 0 ? (
              <ChartContainer config={chartData.barChartConfig} className="mx-auto aspect-video max-h-[300px]">
                <BarChart data={chartData.barChartData} accessibilityLayer>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="category"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    interval={0}
                  />
                  <YAxis width={80} tickFormatter={(value) => formatCurrency(value)} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="valorCompra" fill="var(--color-valorCompra)" radius={4} />
                  <Bar dataKey="valorDepreciado" fill="var(--color-valorDepreciado)" radius={4} />
                  <Bar dataKey="valorAtual" fill="var(--color-valorAtual)" radius={4} />
                </BarChart>
              </ChartContainer>
            ) : (
              <p className="text-muted-foreground text-center py-4">Nenhum dado disponível para este gráfico {selectedDateFilter !== 'allTime' && 'no período selecionado'}.</p>
            )}
          </CardContent>
        </Card>
      </div>


      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
         <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
                <MapPin className="mr-2 h-5 w-5 text-blue-500" />
                Valor atual por local
            </CardTitle>
            <CardDescription>
                Soma do valor atual dos ativos agrupados por local {selectedDateFilter !== 'allTime' && '(no período selecionado)'}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dashboardData.valueByLocation.length > 0 ? (
                 <div className="overflow-x-auto max-h-60">
                    <table className="w-full text-sm">
                        <thead>
                        <tr className="border-b">
                            <th className="text-left p-2 font-semibold">Local</th>
                            <th className="text-right p-2 font-semibold">Valor atual total</th>
                        </tr>
                        </thead>
                        <tbody>
                        {dashboardData.valueByLocation.map((item, index) => (
                            <tr key={index} className="border-b last:border-b-0 hover:bg-muted/50">
                            <td className="p-2">{item.locationName}</td>
                            <td className="text-right p-2">{formatCurrency(item.totalCurrentValue)}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p className="text-muted-foreground text-center py-4">
                    Nenhum dado de valor por local para exibir {selectedDateFilter !== 'allTime' && 'no período selecionado'}.
                </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Destaques</CardTitle>
            <CardDescription>Informações importantes sobre seus ativos {selectedDateFilter !== 'allTime' && '(no período selecionado)'}.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium flex items-center"><Award className="mr-2 h-4 w-4 text-yellow-500"/>Ativo mais valioso</p>
              <p className="text-lg text-primary">{dashboardData.highlights.mostValuable.name}</p>
              <p className="text-sm text-muted-foreground">{formatCurrency(dashboardData.highlights.mostValuable.value)}</p>
            </div>
            <div>
              <p className="text-sm font-medium flex items-center"><Clock className="mr-2 h-4 w-4 text-blue-500"/>Ativo mais antigo</p>
              <p className="text-lg text-primary">{dashboardData.highlights.oldestAsset.name}</p>
              <p className="text-sm text-muted-foreground">Adquirido em: {dashboardData.highlights.oldestAsset.acquiredDate}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Visão geral dos ativos recentes</CardTitle>
          <CardDescription>
            {dashboardData.recentAssets.length > 0
              ? `Os últimos ${dashboardData.recentAssets.length} ativos ${selectedDateFilter === 'allTime' ? 'adicionados ou com movimentações' : 'do período selecionado'}.`
              : `Nenhum ativo recente ${selectedDateFilter === 'allTime' ? '' : 'no período selecionado'}.`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {dashboardData.recentAssets.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-semibold">Nome</th>
                    <th className="text-left p-2 font-semibold">Modelo</th>
                    <th className="text-left p-2 font-semibold">Categoria</th>
                    <th className="text-right p-2 font-semibold">Valor atual</th>
                    <th className="text-right p-2 font-semibold">Data de compra</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.recentAssets.map((asset) => (
                    <tr key={asset.id} className="border-b last:border-b-0 hover:bg-muted/50">
                      <td className="p-2">{asset.name}</td>
                      <td className="p-2">{asset.modelName}</td>
                      <td className="p-2">{asset.category}</td>
                      <td className="text-right p-2">{formatCurrency(asset.currentValue)}</td>
                      <td className="text-right p-2">{asset.purchaseDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">Nenhum ativo cadastrado {selectedDateFilter === 'allTime' ? 'ainda' : 'para o período selecionado'}.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

    

    

    