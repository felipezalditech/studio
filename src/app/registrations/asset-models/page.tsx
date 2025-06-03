
"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Shapes, PlusCircle, Edit2, Trash2, MoreHorizontal } from "lucide-react";
import { useAssetModels, type AssetModel } from '@/contexts/AssetModelContext';
import { AssetModelFormDialog } from '@/components/asset-models/AssetModelFormDialog';
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog';
import { useToast } from '@/hooks/use-toast';

export default function ManageAssetModelsPage() {
  const { assetModels, deleteAssetModel } = useAssetModels();
  const { toast } = useToast();

  const [isAssetModelDialogOpen, setIsAssetModelDialogOpen] = useState(false);
  const [editingAssetModel, setEditingAssetModel] = useState<AssetModel | null>(null);
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
  const [itemToDeleteId, setItemToDeleteId] = useState<string | null>(null);

  const handleOpenAssetModelDialog = (model: AssetModel | null = null) => {
    setEditingAssetModel(model);
    setIsAssetModelDialogOpen(true);
  };

  const handleDeleteRequest = (id: string) => {
    setItemToDeleteId(id);
    setIsConfirmDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!itemToDeleteId) return;
    deleteAssetModel(itemToDeleteId);
    toast({ title: "Sucesso!", description: "Modelo de ativo excluído." });
    setItemToDeleteId(null);
  };

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Gerenciar modelos de ativos</h1>
        <p className="text-muted-foreground">Adicione, edite ou remova modelos de ativos reutilizáveis.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center text-xl">
              <Shapes className="mr-2 h-5 w-5" />
              Lista de modelos de ativos
            </CardTitle>
            <CardDescription>
              Modelos de ativos cadastrados no sistema.
            </CardDescription>
          </div>
          <Button onClick={() => handleOpenAssetModelDialog()}>
            <PlusCircle className="mr-2 h-4 w-4" /> Adicionar modelo
          </Button>
        </CardHeader>
        <CardContent>
          {assetModels.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Nenhum modelo de ativo cadastrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px]">Nome do modelo</TableHead>
                    <TableHead className="min-w-[100px]">Marca</TableHead>
                    <TableHead className="min-w-[80px]">Cor</TableHead>
                    <TableHead className="min-w-[80px] text-center">Largura (cm)</TableHead>
                    <TableHead className="min-w-[80px] text-center">Altura (cm)</TableHead>
                    <TableHead className="min-w-[80px] text-center">Peso (kg)</TableHead>
                    <TableHead className="min-w-[200px]">Descrição</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assetModels.map((model) => (
                    <TableRow key={model.id}>
                      <TableCell>{model.name}</TableCell>
                      <TableCell>{model.brand || 'N/A'}</TableCell>
                      <TableCell>{model.color || 'N/A'}</TableCell>
                      <TableCell className="text-center">{model.width !== undefined ? `${model.width} cm` : 'N/A'}</TableCell>
                      <TableCell className="text-center">{model.height !== undefined ? `${model.height} cm` : 'N/A'}</TableCell>
                      <TableCell className="text-center">{model.weight !== undefined ? `${model.weight} kg` : 'N/A'}</TableCell>
                      <TableCell>{model.description || 'N/A'}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Abrir menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenAssetModelDialog(model)}>
                              <Edit2 className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteRequest(model.id)}
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
            </div>
          )}
        </CardContent>
      </Card>

      {isAssetModelDialogOpen && (
        <AssetModelFormDialog
          open={isAssetModelDialogOpen}
          onOpenChange={setIsAssetModelDialogOpen}
          initialData={editingAssetModel}
        />
      )}

      <ConfirmationDialog
        open={isConfirmDeleteDialogOpen}
        onOpenChange={setIsConfirmDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Confirmar exclusão de modelo de ativo"
        description="Tem certeza que deseja excluir o modelo de ativo selecionado? Esta ação não pode ser desfeita."
      />
    </div>
  );
}
