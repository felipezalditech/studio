
"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Layers, SettingsIcon, PlusCircle, Edit2, Trash2, MoreHorizontal, MapPin } from "lucide-react";
import { useCategories, type AssetCategory } from '@/contexts/CategoryContext';
import { CategoryFormDialog, type CategoryFormValues } from '@/components/categories/CategoryFormDialog';
import { useLocations, type Location } from '@/contexts/LocationContext'; // Importado
import { LocationFormDialog, type LocationFormValues } from '@/components/locations/LocationFormDialog'; // Importado
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog';
import { useToast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const { categories, addCategory, updateCategory, deleteCategory } = useCategories();
  const { locations, addLocation, updateLocation, deleteLocation } = useLocations(); // Hooks de Local
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AssetCategory | null>(null);
  const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false); // Estado para diálogo de Local
  const [editingLocation, setEditingLocation] = useState<Location | null>(null); // Estado para editar Local
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; type: 'category' | 'location' } | null>(null);
  const { toast } = useToast();

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

  const handleOpenLocationDialog = (location: Location | null = null) => {
    setEditingLocation(location);
    setIsLocationDialogOpen(true);
  };

  const handleSubmitLocation = (data: LocationFormValues) => {
    if (editingLocation) {
      updateLocation({ ...editingLocation, ...data });
      toast({ title: "Sucesso!", description: "Local atualizado." });
    } else {
      addLocation(data);
      toast({ title: "Sucesso!", description: "Local adicionado." });
    }
    setIsLocationDialogOpen(false);
  };

  const handleDeleteRequest = (id: string, type: 'category' | 'location') => {
    setItemToDelete({ id, type });
    setIsConfirmDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!itemToDelete) return;

    if (itemToDelete.type === 'category') {
      // TODO: Adicionar verificação se a categoria está em uso.
      deleteCategory(itemToDelete.id);
      toast({ title: "Sucesso!", description: "Categoria excluída." });
    } else if (itemToDelete.type === 'location') {
      // TODO: Adicionar verificação se o local está em uso.
      deleteLocation(itemToDelete.id);
      toast({ title: "Sucesso!", description: "Local excluído." });
    }
    setItemToDelete(null);
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
                            onClick={() => handleDeleteRequest(category.id, 'category')}
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

      {/* Seção de Gerenciar Locais */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center text-xl">
              <MapPin className="mr-2 h-5 w-5" />
              Gerenciar Locais dos Ativos
            </CardTitle>
            <CardDescription>
              Defina os locais onde os ativos podem ser alocados.
            </CardDescription>
          </div>
          <Button onClick={() => handleOpenLocationDialog()}>
            <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Local
          </Button>
        </CardHeader>
        <CardContent>
          {locations.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Nenhum local cadastrado.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome do Local</TableHead>
                  <TableHead>Endereço</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {locations.map((location) => (
                  <TableRow key={location.id}>
                    <TableCell>{location.name}</TableCell>
                    <TableCell>{location.address || 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Abrir menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenLocationDialog(location)}>
                            <Edit2 className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteRequest(location.id, 'location')}
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

      {isLocationDialogOpen && (
        <LocationFormDialog
          open={isLocationDialogOpen}
          onOpenChange={setIsLocationDialogOpen}
          onSubmitAction={handleSubmitLocation}
          initialData={editingLocation}
        />
      )}

      <ConfirmationDialog
        open={isConfirmDeleteDialogOpen}
        onOpenChange={setIsConfirmDeleteDialogOpen}
        onConfirm={confirmDelete}
        title={`Confirmar Exclusão de ${itemToDelete?.type === 'category' ? 'Categoria' : 'Local'}`}
        description={`Tem certeza que deseja excluir ${itemToDelete?.type === 'category' ? 'a categoria selecionada' : 'o local selecionado'}? Esta ação não pode ser desfeita.`}
      />
    </div>
  );
}
