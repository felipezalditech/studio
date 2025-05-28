
"use client";

import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle, Search, BarChart3, ShoppingCart, TrendingUp, TrendingDown, DollarSign, CalendarDays, Award, Clock } from "lucide-react";
import { useAssets, type AssetWithCalculatedValues } from '@/contexts/AssetContext'; // AssetWithCalculatedValues pode não ser necessário aqui se recalcularmos
import { useCategories } from '@/contexts/CategoryContext';
import { parseISO, format as formatDateFn, isValid, addDays, differenceInCalendarMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Asset } from '@/components/assets/types';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
};

const formatDate = (dateString: string) => {
  try {
    const date = parseISO(dateString);
    return formatDateFn(date, 'dd/MM/yyyy', { locale: ptBR });
  } catch (error) {
    return dateString; // Retorna a string original se houver erro
  }
};


export default function DashboardPage() {
  const { assets } = useAssets();
  const { getCategoryById } = useCategories();

  const dashboardData = useMemo(() => {
    const today = new Date();
    let totalPurchaseValue = 0;
    let totalCurrentValue = 0;
    let totalDepreciation = 0;

    const processedAssets = assets.map(asset => {
      totalPurchaseValue += asset.purchaseValue;
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
      totalDepreciation += finalDepreciatedValue;
      totalCurrentValue += calculatedCurrentValue;
      return { ...asset, calculatedCurrentValue, finalDepreciatedValue, categoryName: category?.name || 'Desconhecida' };
    });

    const recentAssets = [...processedAssets]
        .sort((a, b) => parseISO(b.purchaseDate).getTime() - parseISO(a.purchaseDate).getTime()) // Ordena por data de compra, mais recente primeiro
        .slice(0, 5) // Pega os 5 mais recentes
        .map(asset => ({
            name: asset.name,
            category: asset.categoryName,
            currentValue: asset.calculatedCurrentValue,
            purchaseDate: formatDate(asset.purchaseDate),
        }));


    let mostValuable = { name: "N/A", value: 0 };
    if (processedAssets.length > 0) {
      const sortedByValue = [...processedAssets].sort((a, b) => b.calculatedCurrentValue - a.calculatedCurrentValue);
      mostValuable = { name: sortedByValue[0].name, value: sortedByValue[0].calculatedCurrentValue };
    }

    let oldestAsset = { name: "N/A", acquiredDate: "N/A" };
    if (processedAssets.length > 0) {
      const sortedByDate = [...processedAssets].sort((a, b) => parseISO(a.purchaseDate).getTime() - parseISO(b.purchaseDate).getTime());
      oldestAsset = { name: sortedByDate[0].name, acquiredDate: formatDate(sortedByDate[0].purchaseDate) };
    }
    
    return {
      totalAssets: assets.length,
      totalPurchaseValue,
      totalCurrentValue,
      totalDepreciation,
      recentAssets,
      highlights: {
        mostValuable,
        oldestAsset,
      },
    };
  }, [assets, getCategoryById]);


  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Bem-vindo(a) de volta!</h1>
        <p className="text-muted-foreground">Aqui está um resumo rápido do status dos seus ativos imobilizados.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Ativos</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.totalAssets}</div>
            <p className="text-xs text-muted-foreground">ativos cadastrados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total de Compra</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-500">{formatCurrency(dashboardData.totalPurchaseValue)}</div>
             <p className="text-xs text-muted-foreground">custo de aquisição total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Atual Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-500">{formatCurrency(dashboardData.totalCurrentValue)}</div>
             <p className="text-xs text-muted-foreground">valor líquido contábil</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Depreciação Total</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500 dark:text-red-600">{formatCurrency(dashboardData.totalDepreciation)}</div>
            <p className="text-xs text-muted-foreground">depreciação acumulada</p>
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
              <Link href="/assets/add">
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
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium flex items-center"><Award className="mr-2 h-4 w-4 text-yellow-500"/>Ativo Mais Valioso</p>
              <p className="text-lg text-primary">{dashboardData.highlights.mostValuable.name}</p>
              <p className="text-sm text-muted-foreground">{formatCurrency(dashboardData.highlights.mostValuable.value)}</p>
            </div>
            <div>
              <p className="text-sm font-medium flex items-center"><Clock className="mr-2 h-4 w-4 text-blue-500"/>Ativo Mais Antigo</p>
              <p className="text-lg text-primary">{dashboardData.highlights.oldestAsset.name}</p>
              <p className="text-sm text-muted-foreground">Adquirido em: {dashboardData.highlights.oldestAsset.acquiredDate}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Visão Geral dos Ativos Recentes</CardTitle>
          <CardDescription>Os últimos {dashboardData.recentAssets.length} ativos adicionados ou com movimentações.</CardDescription>
        </CardHeader>
        <CardContent>
          {dashboardData.recentAssets.length > 0 ? (
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
                  {dashboardData.recentAssets.map((asset, index) => (
                    <tr key={index} className="border-b last:border-b-0 hover:bg-muted/50">
                      <td className="p-2">{asset.name}</td>
                      <td className="p-2">{asset.category}</td>
                      <td className="text-right p-2">{formatCurrency(asset.currentValue)}</td>
                      <td className="text-right p-2">{asset.purchaseDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">Nenhum ativo cadastrado ainda.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
