
"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Layers, SettingsIcon, PlusCircle, Edit2, Trash2, MoreHorizontal } from "lucide-react";
import { useCategories, type AssetCategory } from '@/contexts/CategoryContext';
import { CategoryFormDialog, type CategoryFormValues } from '@/components/categories/CategoryFormDialog';
import { useToast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const { categories, addCategory, updateCategory, deleteCategory } = useCategories();
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AssetCategory | null>(null);
  const { toast } = useToast();

  const handleOpenCategoryDialog = (category: AssetCategory | null = null) => {
    setEditingCategory(category);
    setIsCategoryDialogOpen(true);
  };

  const handleSubmitCategory = (data: CategoryFormValues) => {
    if (editingCategory) {
      updateCategory({ ...editingCategory, ...data });
      toast({ title: "Sucesso!", description: "Categoria atualizada." });
    } else {
      addCategory(data);
      toast({ title: "Sucesso!", description: "Categoria adicionada." });
    }
    setIsCategoryDialogOpen(false);
  };

  const handleDeleteCategory = (categoryId: string) => {
    // TODO: Adicionar verificação se a categoria está em uso por algum ativo antes de excluir.
    if (confirm("Tem certeza que deseja excluir esta categoria? Esta ação não pode ser desfeita.")) {
      deleteCategory(categoryId);
      toast({ title: "Sucesso!", description: "Categoria excluída." });
    }
  };

  const getDepreciationMethodLabel = (method: AssetCategory['depreciationMethod']) => {
    if (method === 'linear') return 'Linear (Linha Reta)';
    if (method === 'reducing_balance') return 'Saldos Decrescentes';
    return method;
  }

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Configurações</h1>
        <p className="text-muted-foreground">Gerencie as configurações gerais da aplicação e as regras de negócio.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center text-xl">
              <Layers className="mr-2 h-5 w-5" />
              Gerenciar Categorias de Ativos
            </CardTitle>
            <CardDescription>
              Defina as categorias de ativos e suas respectivas regras de depreciação.
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
                  <TableHead className="text-center">Valor Residual (%)</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>{category.name}</TableCell>
                    <TableCell>{getDepreciationMethodLabel(category.depreciationMethod)}</TableCell>
                    <TableCell className="text-center">{category.usefulLifeInYears}</TableCell>
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
                            onClick={() => handleDeleteCategory(category.id)}
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <SettingsIcon className="mr-2 h-5 w-5" />
            Outras Configurações
          </CardTitle>
          <CardDescription>
            Opções gerais da aplicação.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Outras opções de configuração da aplicação estarão disponíveis aqui.
          </p>
          <Button variant="outline" disabled>
            Acessar (Em Breve)
          </Button>
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
    </div>
  );
}
