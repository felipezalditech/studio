
"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Layers, PlusCircle, Edit2, Trash2, MoreHorizontal } from "lucide-react";
import { useCategories, type AssetCategory } from '@/contexts/CategoryContext';
import { CategoryFormDialog, type CategoryFormValues } from '@/components/categories/CategoryFormDialog';
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog';
import { useToast } from '@/hooks/use-toast';

export default function ManageCategoriesPage() {
  const { categories, addCategory, updateCategory, deleteCategory } = useCategories();
  const { toast } = useToast();

  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AssetCategory | null>(null);
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
  const [itemToDeleteId, setItemToDeleteId] = useState<string | null>(null);

  const handleOpenCategoryDialog = (category: AssetCategory | null = null) => {
    setEditingCategory(category);
    setIsCategoryDialogOpen(true);
  };

  const handleSubmitCategory = (data: CategoryFormValues) => {
    const categoryDataToSave: Omit<AssetCategory, 'id'> = {
      name: data.name,
      depreciationMethod: data.depreciationMethod,
      residualValuePercentage: data.residualValuePercentage,
      usefulLifeInYears: data.usefulLifeInYears === null || data.usefulLifeInYears === undefined ? undefined : Number(data.usefulLifeInYears),
      depreciationRateType: data.depreciationRateType,
      depreciationRateValue: data.depreciationRateValue === null || data.depreciationRateValue === undefined ? undefined : Number(data.depreciationRateValue),
    };

    if (editingCategory) {
      updateCategory({ ...editingCategory, ...categoryDataToSave });
      toast({ title: "Sucesso!", description: "Categoria atualizada." });
    } else {
      addCategory(categoryDataToSave);
      toast({ title: "Sucesso!", description: "Categoria adicionada." });
    }
    setIsCategoryDialogOpen(false);
  };

  const handleDeleteRequest = (id: string) => {
    setItemToDeleteId(id);
    setIsConfirmDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!itemToDeleteId) return;
    deleteCategory(itemToDeleteId);
    toast({ title: "Sucesso!", description: "Categoria excluída." });
    setItemToDeleteId(null);
  };

  const getDepreciationMethodLabel = (method: AssetCategory['depreciationMethod']) => {
    if (method === 'linear') return 'Linear';
    if (method === 'reducing_balance') return 'Saldos Decrescentes';
    return method;
  }

  const getDepreciationRateTypeLabel = (type?: 'annual' | 'monthly') => {
    if (type === 'annual') return 'Anual';
    if (type === 'monthly') return 'Mensal';
    return 'N/A';
  }

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Gerenciar Categorias de Ativos</h1>
        <p className="text-muted-foreground">Defina as categorias de ativos e suas respectivas regras de depreciação.</p>
      </div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center text-xl">
              <Layers className="mr-2 h-5 w-5" />
              Lista de Categorias
            </CardTitle>
            <CardDescription>
              Categorias cadastradas no sistema.
            </CardDescription>
          </div>
          <Button onClick={() => handleOpenCategoryDialog()}>
            <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Categoria
          </Button>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Nenhuma categoria cadastrada.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Método Depreciação</TableHead>
                  <TableHead className="text-center">Vida Útil (Anos)</TableHead>
                  <TableHead className="text-center">Tx. Depreciação</TableHead>
                  <TableHead className="text-center">Tipo Taxa</TableHead>
                  <TableHead className="text-center">Valor Residual (%)</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>{category.name}</TableCell>
                    <TableCell>{getDepreciationMethodLabel(category.depreciationMethod)}</TableCell>
                    <TableCell className="text-center">{category.usefulLifeInYears ?? 'N/A'}</TableCell>
                    <TableCell className="text-center">{category.depreciationRateValue !== undefined ? `${category.depreciationRateValue}%` : 'N/A'}</TableCell>
                    <TableCell className="text-center">{getDepreciationRateTypeLabel(category.depreciationRateType)}</TableCell>
                    <TableCell className="text-center">{category.residualValuePercentage}%</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Abrir menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenCategoryDialog(category)}>
                            <Edit2 className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteRequest(category.id)}
                            className="text-red-600 hover:!text-red-600 focus:text-red-600 focus:!bg-red-100 dark:focus:!bg-red-700/50"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {isCategoryDialogOpen && (
        <CategoryFormDialog
          open={isCategoryDialogOpen}
          onOpenChange={setIsCategoryDialogOpen}
          onSubmitAction={handleSubmitCategory}
          initialData={editingCategory}
        />
      )}

      <ConfirmationDialog
        open={isConfirmDeleteDialogOpen}
        onOpenChange={setIsConfirmDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Confirmar Exclusão de Categoria"
        description="Tem certeza que deseja excluir a categoria selecionada? Esta ação não pode ser desfeita."
      />
    </div>
  );
}
